// src/routes/email.js
const express = require("express");
const { db, Collections } = require("../config");
const { verifyToken } = require("../middleware/auth");
const emailService = require("../services/email");
const router = express.Router();
router.use(verifyToken);

// ── POST /api/email/invite — send candidate interview invite ──
router.post("/invite", async (req, res, next) => {
  try {
    const { candidateEmail, candidateName, jobId } = req.body;
    if (!candidateEmail || !candidateName || !jobId) {
      return res.status(400).json({ error: "candidateEmail, candidateName, jobId required" });
    }
    const jobSnap = await db.collection(Collections.JOBS).doc(jobId).get();
    if (!jobSnap.exists) return res.status(404).json({ error: "Job not found" });
    const job = jobSnap.data();
    if (job.companyId !== req.companyId) return res.status(403).json({ error: "Forbidden" });
    await emailService.sendCandidateInvite(
      { email: candidateEmail, name: candidateName },
      job,
      job.token
    );
    res.json({ message: "Invite sent successfully" });
  } catch(err){ next(err); }
});

module.exports = router;
