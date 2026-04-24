// src/routes/companies.js
const express = require("express");
const { db, admin, Collections } = require("../config");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();
router.use(verifyToken);

router.get("/me", async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.COMPANIES).doc(req.companyId).get();
    if (!snap.exists) return res.status(404).json({ error: "Company not found" });
    res.json({ company: { id: snap.id, ...snap.data() } });
  } catch(err){next(err);}
});

router.patch("/me", async (req, res, next) => {
  try {
    const allowed = ["name","email","logo","settings"];
    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    await db.collection(Collections.COMPANIES).doc(req.companyId).update(updates);
    res.json({ message: "Company updated" });
  } catch(err){next(err);}
});

module.exports = router;
