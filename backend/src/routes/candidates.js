// src/routes/candidates.js
const express = require("express");
const { db, admin, Collections } = require("../config");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();
router.use(verifyToken);

// ── GET /api/candidates ───────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const { status, jobId, limit = 50, search } = req.query;
    let query = db.collection(Collections.CANDIDATES)
      .where("companyId", "==", req.companyId)
      .orderBy("createdAt", "desc")
      .limit(Number(limit));
    if (status) query = query.where("status", "==", status);
    if (jobId)  query = query.where("jobId",  "==", jobId);
    const snap = await query.get();
    let candidates = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (search) {
      const s = search.toLowerCase();
      candidates = candidates.filter(c =>
        c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || c.role.toLowerCase().includes(s)
      );
    }
    res.json({ candidates, total: candidates.length });
  } catch (err) { next(err); }
});

// ── GET /api/candidates/:id ───────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.CANDIDATES).doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Candidate not found" });
    const c = snap.data();
    if (c.companyId !== req.companyId) return res.status(403).json({ error: "Forbidden" });

    // Enrich with evaluation + assignment if available
    let evaluation = null, assignment = null, interview = null;
    if (c.evaluationId) {
      const es = await db.collection(Collections.EVALUATIONS).doc(c.evaluationId).get();
      if (es.exists) evaluation = es.data();
    }
    if (c.assignmentId) {
      const as = await db.collection(Collections.ASSIGNMENTS).doc(c.assignmentId).get();
      if (as.exists) assignment = as.data();
    }
    if (c.interviewId) {
      const is = await db.collection(Collections.INTERVIEWS).doc(c.interviewId).get();
      if (is.exists) interview = { id: is.id, messages: is.data().messages, duration: is.data().durationMinutes };
    }

    res.json({ candidate: { id: snap.id, ...c }, evaluation, assignment, interview });
  } catch (err) { next(err); }
});

// ── PATCH /api/candidates/:id ─────────────────────────────────
router.patch("/:id", async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.CANDIDATES).doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Candidate not found" });
    if (snap.data().companyId !== req.companyId) return res.status(403).json({ error: "Forbidden" });
    const allowed = ["status", "notes", "tags"];
    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    await db.collection(Collections.CANDIDATES).doc(req.params.id).update(updates);
    res.json({ message: "Candidate updated" });
  } catch (err) { next(err); }
});

// ── DELETE /api/candidates/:id ────────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.CANDIDATES).doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Candidate not found" });
    if (snap.data().companyId !== req.companyId) return res.status(403).json({ error: "Forbidden" });
    await db.collection(Collections.CANDIDATES).doc(req.params.id).delete();
    res.json({ message: "Candidate deleted" });
  } catch (err) { next(err); }
});

module.exports = router;
