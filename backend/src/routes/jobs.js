// src/routes/jobs.js
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { db, admin, Collections } = require("../config");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();
router.use(verifyToken);

// ── GET /api/jobs — list company jobs ─────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.JOBS)
      .where("companyId", "==", req.companyId)
      .orderBy("createdAt", "desc")
      .get();
    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ jobs });
  } catch (err) { next(err); }
});

// ── GET /api/jobs/:id ─────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.JOBS).doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Job not found" });
    const job = snap.data();
    if (job.companyId !== req.companyId) return res.status(403).json({ error: "Forbidden" });
    res.json({ job: { id: snap.id, ...job } });
  } catch (err) { next(err); }
});

// ── POST /api/jobs — create job ───────────────────────────────
router.post("/", async (req, res, next) => {
  try {
    const { title, department, location, type, description, skills, customQuestions } = req.body;
    if (!title || !department) {
      return res.status(400).json({ error: "title and department are required" });
    }
    const jobId = uuidv4();
    const token = Math.random().toString(36).slice(2, 14); // candidate invite token
    const job = {
      id: jobId,
      companyId:       req.companyId,
      title,
      department,
      location:        location || "Not specified",
      type:            type || "Full-time",
      description:     description || "",
      skills:          Array.isArray(skills) ? skills : [],
      customQuestions: Array.isArray(customQuestions) ? customQuestions : [],
      token,
      status:          "open",
      candidatesCount: 0,
      createdAt:       admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:       admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection(Collections.JOBS).doc(jobId).set(job);
    res.status(201).json({ job: { ...job, id: jobId } });
  } catch (err) { next(err); }
});

// ── PATCH /api/jobs/:id — update job ─────────────────────────
router.patch("/:id", async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.JOBS).doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Job not found" });
    if (snap.data().companyId !== req.companyId) return res.status(403).json({ error: "Forbidden" });
    const allowed = ["title","department","location","type","description","skills","customQuestions","status"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await db.collection(Collections.JOBS).doc(req.params.id).update(updates);
    res.json({ message: "Job updated", id: req.params.id });
  } catch (err) { next(err); }
});

// ── DELETE /api/jobs/:id ──────────────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.JOBS).doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Job not found" });
    if (snap.data().companyId !== req.companyId) return res.status(403).json({ error: "Forbidden" });
    await db.collection(Collections.JOBS).doc(req.params.id).delete();
    res.json({ message: "Job deleted" });
  } catch (err) { next(err); }
});

// ── GET /api/jobs/token/:token — public (for candidate portal) 
router.get("/token/:token", async (req, res, next) => {
  // Remove auth middleware for this one — public endpoint
});

// Public token lookup (no auth required)
const publicRouter = express.Router();
publicRouter.get("/token/:token", async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.JOBS)
      .where("token", "==", req.params.token)
      .where("status", "==", "open")
      .limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "Job not found or closed" });
    const job = snap.docs[0].data();
    // Return only public fields
    res.json({
      job: {
        id:          snap.docs[0].id,
        title:       job.title,
        department:  job.department,
        location:    job.location,
        type:        job.type,
        description: job.description,
        skills:      job.skills,
        companyId:   job.companyId,
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.publicRouter = publicRouter;
