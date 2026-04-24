// src/routes/assignment.js
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { db, admin, anthropic, Collections } = require("../config");
const { verifyToken } = require("../middleware/auth");
const emailService = require("../services/email");

const router = express.Router();
router.use(verifyToken);

// ── Core assignment generator ─────────────────────────────────
async function generateAssignment(candidateId, companyId) {
  const candSnap = await db.collection(Collections.CANDIDATES).doc(candidateId).get();
  if (!candSnap.exists) throw new Error("Candidate not found");
  const candidate = candSnap.data();

  const jobSnap = await db.collection(Collections.JOBS).doc(candidate.jobId).get();
  const job     = jobSnap.data();

  const evalSnap = await db.collection(Collections.EVALUATIONS)
    .where("candidateId", "==", candidateId).limit(1).get();
  const evaluation = evalSnap.empty ? null : evalSnap.docs[0].data();

  const context = evaluation
    ? `Score: ${evaluation.score}/100. Verdict: ${evaluation.verdict}. Strengths: ${evaluation.strengths?.join(", ")}. Gaps: ${evaluation.gaps?.join(", ")}.`
    : "No evaluation data available.";

  const response = await anthropic.messages.create({
    model:      "claude-sonnet-4-5",
    max_tokens: 1000,
    system: `You are ARIA, an expert AI HR Director. Generate a comprehensive, personalised work assignment for a new hire.
Return ONLY valid JSON (no markdown):
{
  "welcome_message": "<personalised 1-sentence welcome for ${candidate.name}>",
  "mentor": "<realistic mentor name and title>",
  "onboarding_tasks": [
    { "task": "...", "description": "...", "due": "<Day 1-3|Week 1|Week 2>", "priority": "<Critical|High|Medium>" }
  ],
  "first_project": {
    "title": "...",
    "description": "2-sentence project brief.",
    "deliverables": ["...", "...", "...", "..."],
    "deadline": "<specific timeframe>",
    "tools": ["...", "...", "..."]
  },
  "kpis": ["...", "...", "...", "..."],
  "learning_resources": ["...", "...", "..."],
  "team_introduction": "<1 sentence about team structure>"
}`,
    messages: [{
      role:    "user",
      content: `Generate onboarding assignment for ${candidate.name}, new ${job.title} at ${candidate.companyId}. Evaluation context: ${context}`,
    }],
  });

  let assignment;
  try {
    assignment = JSON.parse(response.content[0].text.replace(/```json|```/g, "").trim());
  } catch {
    assignment = {
      welcome_message: `Welcome to the team, ${candidate.name}! We're thrilled to have your expertise on board.`,
      mentor: "Team Lead",
      onboarding_tasks: [
        { task: "Workspace Setup", description: "Configure your development environment and tools", due: "Day 1-3", priority: "Critical" },
        { task: "Team Introduction", description: "Meet all team members and key stakeholders", due: "Day 1-3", priority: "High" },
        { task: "Documentation Review", description: "Study existing systems and internal documentation", due: "Week 1", priority: "High" },
        { task: "First PR / Task", description: "Complete a small starter task to get familiar with workflow", due: "Week 2", priority: "Medium" },
      ],
      first_project: {
        title: `${job.title} Onboarding Project`,
        description: "Complete a structured onboarding project to demonstrate your skills and get familiar with our codebase and processes.",
        deliverables: ["Working solution", "Test coverage", "Documentation", "Team demo"],
        deadline: "End of Week 2",
        tools: ["GitHub", "Slack", "Notion"],
      },
      kpis: ["Onboarding checklist completion", "First task delivered on time", "Team integration score", "Documentation quality"],
      learning_resources: ["Internal wiki", "Engineering handbook", "Codebase walkthrough recording"],
      team_introduction: "You will be joining a cross-functional team of 8 engineers and designers.",
    };
  }

  const assignId = uuidv4();
  await db.collection(Collections.ASSIGNMENTS).doc(assignId).set({
    id: assignId,
    candidateId,
    companyId,
    jobId:      candidate.jobId,
    ...assignment,
    createdAt:  admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection(Collections.CANDIDATES).doc(candidateId).update({
    assignmentId: assignId,
    updatedAt:    admin.firestore.FieldValue.serverTimestamp(),
  });

  // Email assignment to candidate
  try {
    await emailService.sendAssignment(candidate, assignment);
  } catch (e) {
    console.warn("Assignment email failed:", e.message);
  }

  return { assignId, assignment };
}

module.exports.generateAssignment = generateAssignment;

// ── POST /api/assignment/generate ────────────────────────────
router.post("/generate", async (req, res, next) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId) return res.status(400).json({ error: "candidateId required" });
    const { assignId, assignment } = await generateAssignment(candidateId, req.companyId);
    res.json({ assignId, assignment });
  } catch (err) { next(err); }
});

// ── GET /api/assignment/:candidateId ─────────────────────────
router.get("/:candidateId", async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.ASSIGNMENTS)
      .where("candidateId", "==", req.params.candidateId)
      .where("companyId",   "==", req.companyId)
      .limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "Assignment not found" });
    res.json({ assignment: { id: snap.docs[0].id, ...snap.docs[0].data() } });
  } catch (err) { next(err); }
});

module.exports = router;
