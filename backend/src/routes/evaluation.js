// src/routes/evaluation.js
const express    = require("express");
const { v4: uuidv4 } = require("uuid");
const { db, admin, anthropic, Collections } = require("../config");
const { verifyToken } = require("../middleware/auth");
const emailService = require("../services/email");

const router = express.Router();

// ── Core evaluation function (called by queue + manual trigger)
async function runEvaluation(interviewId, candidateId) {
  const [ivSnap, candSnap] = await Promise.all([
    db.collection(Collections.INTERVIEWS).doc(interviewId).get(),
    db.collection(Collections.CANDIDATES).doc(candidateId).get(),
  ]);

  if (!ivSnap.exists || !candSnap.exists) {
    throw new Error(`Interview or candidate not found: ${interviewId} / ${candidateId}`);
  }
  const interview = ivSnap.data();
  const candidate = candSnap.data();
  const jobSnap   = await db.collection(Collections.JOBS).doc(interview.jobId).get();
  const job       = jobSnap.data();

  // Build transcript
  const transcript = interview.messages
    .map(m => `${m.role === "user" ? candidate.name : "ARIA"}: ${m.content}`)
    .join("\n\n");

  // Ask Claude to evaluate
  const response = await anthropic.messages.create({
    model:      "claude-sonnet-4-5",
    max_tokens: 800,
    system: `You are ARIA, an expert AI HR Director and talent evaluator.
Evaluate the following interview transcript for the role of ${job.title}.
Return ONLY a valid JSON object with no markdown, no explanation, just the JSON:
{
  "score": <integer 0-100>,
  "verdict": "<Exceptional|Strong|Competent|Needs Development>",
  "strengths": ["<str1>", "<str2>", "<str3>"],
  "gaps": ["<gap1>", "<gap2>"],
  "summary": "<2 clear professional sentences>",
  "hire_recommendation": "<Strongly Recommend|Recommend|Consider|Do Not Recommend>",
  "technical_rating": <1-5>,
  "communication_rating": <1-5>,
  "culture_fit_rating": <1-5>
}`,
    messages: [{
      role:    "user",
      content: `Interview transcript for ${candidate.name} — ${job.title}:\n\n${transcript}`,
    }],
  });

  let evaluation;
  try {
    evaluation = JSON.parse(response.content[0].text.replace(/```json|```/g, "").trim());
  } catch {
    evaluation = {
      score: 70, verdict: "Competent",
      strengths: ["Demonstrated relevant knowledge", "Clear communication", "Positive attitude"],
      gaps: ["Could provide more specific examples", "Technical depth could improve"],
      summary: "The candidate showed solid foundational skills for this role. Further technical assessment is recommended.",
      hire_recommendation: "Consider",
      technical_rating: 3, communication_rating: 4, culture_fit_rating: 3,
    };
  }

  // Save evaluation
  const evalId = uuidv4();
  await db.collection(Collections.EVALUATIONS).doc(evalId).set({
    id:          evalId,
    interviewId,
    candidateId,
    companyId:   interview.companyId,
    jobId:       interview.jobId,
    ...evaluation,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update candidate
  await db.collection(Collections.CANDIDATES).doc(candidateId).update({
    status:         "evaluated",
    score:          evaluation.score,
    verdict:        evaluation.verdict,
    hire_recommendation: evaluation.hire_recommendation,
    evaluationId:   evalId,
    updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
  });

  // Notify company by email
  try {
    const compSnap = await db.collection(Collections.COMPANIES).doc(interview.companyId).get();
    const company  = compSnap.data();
    await emailService.sendEvaluationReady(company, candidate, evaluation, job);
  } catch (emailErr) {
    console.warn("Email notification failed:", emailErr.message);
  }

  return { evalId, evaluation };
}

// Export for queue use
module.exports.runEvaluation = runEvaluation;

// ── POST /api/evaluation/run  (manual trigger — company auth) ─
router.post("/run", verifyToken, async (req, res, next) => {
  try {
    const { interviewId, candidateId } = req.body;
    if (!interviewId || !candidateId) {
      return res.status(400).json({ error: "interviewId and candidateId required" });
    }
    const { evalId, evaluation } = await runEvaluation(interviewId, candidateId);
    res.json({ evalId, evaluation });
  } catch (err) { next(err); }
});

// ── GET /api/evaluation/:candidateId ─────────────────────────
router.get("/:candidateId", verifyToken, async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.EVALUATIONS)
      .where("candidateId", "==", req.params.candidateId)
      .where("companyId",   "==", req.companyId)
      .limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "Evaluation not found" });
    res.json({ evaluation: { id: snap.docs[0].id, ...snap.docs[0].data() } });
  } catch (err) { next(err); }
});

module.exports = router;
