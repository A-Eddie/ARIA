// src/routes/interview.js
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { db, admin, anthropic, Collections } = require("../config");
const { verifyToken, checkInterviewLimit } = require("../middleware/auth");
const { evaluationQueue } = require("../jobs/queues");
const emailService = require("../services/email");

const router = express.Router();

// ── System prompt builder ─────────────────────────────────────
function buildInterviewPrompt(roleTitle, candidateName, customQuestions = []) {
  const custom = customQuestions.length > 0
    ? `\n\nAlso include these company-specific questions:\n${customQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    : "";
  return `You are ARIA — an elite AI HR Director conducting a professional job interview for the role of ${roleTitle}. You are sharp, warm, perceptive, and highly professional.

Candidate name: ${candidateName}

Your behavior rules:
- Ask EXACTLY ONE focused interview question per response. No lists, no multiple questions.
- Alternate intelligently between: behavioral, technical, situational, and cultural-fit questions specific to the ${roleTitle} role.
- Acknowledge the candidate's answer briefly and naturally before asking the next question.
- Keep each response under 100 words total.
- After exactly 6 candidate responses, end the interview by saying the phrase "INTERVIEW_COMPLETE" at the very start of your message, followed by a warm, professional closing message thanking the candidate.
- Never reveal you are an AI unless directly asked. If asked, say: "I'm ARIA, your AI HR Director."
- Never ask the same type of question twice in a row.${custom}`;
}

// ── POST /api/interview/start  (PUBLIC — candidate uses token) ─
router.post("/start", async (req, res, next) => {
  try {
    const { jobToken, candidateName, candidateEmail } = req.body;
    if (!jobToken || !candidateName || !candidateEmail) {
      return res.status(400).json({ error: "jobToken, candidateName, candidateEmail are required" });
    }

    // Find job by token
    const jobSnap = await db.collection(Collections.JOBS)
      .where("token", "==", jobToken)
      .where("status", "==", "open")
      .limit(1).get();
    if (jobSnap.empty) {
      return res.status(404).json({ error: "Job not found or no longer accepting applications" });
    }
    const jobDoc = jobSnap.docs[0];
    const job    = jobDoc.data();

    // Check company interview limit
    const compSnap = await db.collection(Collections.COMPANIES).doc(job.companyId).get();
    const company  = compSnap.data();
    if (company.interviewsUsed >= company.interviewsLimit) {
      return res.status(429).json({ error: "This company has reached its monthly interview limit." });
    }

    // Create candidate record
    const candidateId = uuidv4();
    const candidate = {
      id: candidateId,
      name:       candidateName,
      email:      candidateEmail,
      role:       job.title,
      jobId:      jobDoc.id,
      companyId:  job.companyId,
      status:     "interviewing",
      score:      null,
      verdict:    null,
      createdAt:  admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:  admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection(Collections.CANDIDATES).doc(candidateId).set(candidate);

    // Increment job candidate count
    await db.collection(Collections.JOBS).doc(jobDoc.id).update({
      candidatesCount: admin.firestore.FieldValue.increment(1),
    });

    // Create interview session
    const interviewId = uuidv4();
    await db.collection(Collections.INTERVIEWS).doc(interviewId).set({
      id:          interviewId,
      candidateId,
      companyId:   job.companyId,
      jobId:       jobDoc.id,
      messages:    [],
      status:      "in_progress",
      startedAt:   admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update candidate with interviewId
    await db.collection(Collections.CANDIDATES).doc(candidateId).update({ interviewId });

    // Get ARIA's opening message
    const sys = buildInterviewPrompt(job.title, candidateName, job.customQuestions);
    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-5",
      max_tokens: 300,
      system:     sys,
      messages: [{
        role:    "user",
        content: `Please start the interview. Greet ${candidateName} warmly and ask your first question for the ${job.title} role.`,
      }],
    });
    const ariaMessage = response.content[0].text;

    // Save opening message
    await db.collection(Collections.INTERVIEWS).doc(interviewId).update({
      messages: admin.firestore.FieldValue.arrayUnion({
        role:      "assistant",
        content:   ariaMessage,
        timestamp: new Date().toISOString(),
      }),
    });

    // Increment company usage
    await db.collection(Collections.COMPANIES).doc(job.companyId).update({
      interviewsUsed: admin.firestore.FieldValue.increment(1),
    });

    res.status(201).json({
      interviewId,
      candidateId,
      message: ariaMessage,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/interview/message  (PUBLIC — candidate sends reply)
router.post("/message", async (req, res, next) => {
  try {
    const { interviewId, candidateId, message } = req.body;
    if (!interviewId || !candidateId || !message) {
      return res.status(400).json({ error: "interviewId, candidateId, and message are required" });
    }

    // Fetch interview + candidate + job
    const [ivSnap, candSnap] = await Promise.all([
      db.collection(Collections.INTERVIEWS).doc(interviewId).get(),
      db.collection(Collections.CANDIDATES).doc(candidateId).get(),
    ]);
    if (!ivSnap.exists)   return res.status(404).json({ error: "Interview not found" });
    if (!candSnap.exists) return res.status(404).json({ error: "Candidate not found" });

    const interview = ivSnap.data();
    const candidate = candSnap.data();

    if (interview.status === "completed") {
      return res.status(400).json({ error: "Interview already completed" });
    }

    const jobSnap = await db.collection(Collections.JOBS).doc(interview.jobId).get();
    const job     = jobSnap.data();

    // Save candidate message
    const userEntry = {
      role:      "user",
      content:   message.trim(),
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...interview.messages, userEntry];

    // Call Claude with full history
    const sys = buildInterviewPrompt(job.title, candidate.name, job.customQuestions);
    const claudeMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }));
    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-5",
      max_tokens: 300,
      system:     sys,
      messages:   claudeMessages,
    });
    const ariaReply  = response.content[0].text;
    const isComplete = ariaReply.startsWith("INTERVIEW_COMPLETE");
    const cleanReply = ariaReply.replace("INTERVIEW_COMPLETE", "").trim();

    const ariaEntry = {
      role:      "assistant",
      content:   cleanReply,
      timestamp: new Date().toISOString(),
    };
    const finalMessages = [...updatedMessages, ariaEntry];

    // Update interview in Firestore
    const updateData = {
      messages: finalMessages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (isComplete) {
      updateData.status      = "completed";
      updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
      const durationMs = Date.now() - ivSnap.createTime?.toMillis();
      updateData.durationMinutes = Math.round(durationMs / 60000) || null;
    }
    await db.collection(Collections.INTERVIEWS).doc(interviewId).update(updateData);

    // If complete — update candidate + queue evaluation
    if (isComplete) {
      await db.collection(Collections.CANDIDATES).doc(candidateId).update({
        status:    "evaluating",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Queue background evaluation job
      if (evaluationQueue) {
        await evaluationQueue.add(
          { interviewId, candidateId, jobId: interview.jobId, companyId: interview.companyId },
          { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
        );
      }
    }

    res.json({
      message:  cleanReply,
      complete: isComplete,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/interview/:id  (Company — authenticated) ─────────
router.get("/:id", verifyToken, async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.INTERVIEWS).doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Interview not found" });
    const iv = snap.data();
    if (iv.companyId !== req.companyId) return res.status(403).json({ error: "Forbidden" });
    res.json({ interview: { id: snap.id, ...iv } });
  } catch (err) { next(err); }
});

module.exports = router;
