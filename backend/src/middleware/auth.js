// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const { auth, db, Collections } = require("../config");

// ── Verify Firebase ID Token ──────────────────────────────────
const verifyFirebaseToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }
  const token = header.split("Bearer ")[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    req.uid        = decoded.uid;
    req.email      = decoded.email;
    req.companyId  = decoded.companyId || null; // set via custom claims
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ── Verify JWT (email/password fallback) ─────────────────────
const verifyJWT = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }
  const token = header.split("Bearer ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.uid       = decoded.uid;
    req.email     = decoded.email;
    req.companyId = decoded.companyId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ── Accept either Firebase or JWT ────────────────────────────
const verifyToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }
  const token = header.split("Bearer ")[1];

  // Try JWT first (faster, no network call)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.uid       = decoded.uid;
    req.email     = decoded.email;
    req.companyId = decoded.companyId;
    return next();
  } catch (_) {}

  // Fallback: Firebase
  try {
    const decoded = await auth.verifyIdToken(token);
    req.uid       = decoded.uid;
    req.email     = decoded.email;
    req.companyId = decoded.companyId || null;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ── Check company plan limits ─────────────────────────────────
const checkInterviewLimit = async (req, res, next) => {
  try {
    const snap = await db.collection(Collections.COMPANIES).doc(req.companyId).get();
    if (!snap.exists) return res.status(404).json({ error: "Company not found" });
    const company = snap.data();
    if (company.interviewsUsed >= company.interviewsLimit) {
      return res.status(429).json({
        error: "Monthly interview limit reached. Please upgrade your plan.",
        used:  company.interviewsUsed,
        limit: company.interviewsLimit,
        plan:  company.plan,
      });
    }
    req.company = company;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { verifyFirebaseToken, verifyJWT, verifyToken, checkInterviewLimit };
