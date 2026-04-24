// src/routes/auth.js
const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { db, auth, admin, Collections } = require("../config");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// ── POST /api/auth/signup ─────────────────────────────────────
router.post("/signup", async (req, res, next) => {
  try {
    const { companyName, email, password } = req.body;
    if (!companyName || !email || !password) {
      return res.status(400).json({ error: "companyName, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Create Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({ email, password, displayName: companyName });
    } catch (err) {
      if (err.code === "auth/email-already-exists") {
        return res.status(409).json({ error: "Email already registered" });
      }
      throw err;
    }

    const uid       = firebaseUser.uid;
    const companyId = uuidv4();

    // Create company document
    await db.collection(Collections.COMPANIES).doc(companyId).set({
      id:               companyId,
      name:             companyName,
      email,
      ownerId:          uid,
      plan:             "starter",
      interviewsUsed:   0,
      interviewsLimit:  10,
      createdAt:        admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:        admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create user document
    await db.collection(Collections.USERS).doc(uid).set({
      uid, email, companyId,
      role:      "admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Set custom claims so middleware can read companyId from token
    await auth.setCustomUserClaims(uid, { companyId, role: "admin" });

    // Issue JWT
    const token = jwt.sign(
      { uid, email, companyId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(201).json({
      token,
      user: { uid, email, companyId, companyName },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    // Look up user in Firebase Auth
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(email);
    } catch {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Get user document
    const userSnap = await db.collection(Collections.USERS).doc(firebaseUser.uid).get();
    if (!userSnap.exists) {
      return res.status(401).json({ error: "User record not found" });
    }
    const userData = userSnap.data();

    // Get company
    const compSnap = await db.collection(Collections.COMPANIES).doc(userData.companyId).get();
    const company  = compSnap.exists ? compSnap.data() : {};

    // Issue JWT
    const token = jwt.sign(
      { uid: firebaseUser.uid, email, companyId: userData.companyId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      token,
      user: {
        uid:         firebaseUser.uid,
        email,
        companyId:   userData.companyId,
        companyName: company.name,
        plan:        company.plan,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get("/me", verifyToken, async (req, res, next) => {
  try {
    const compSnap = await db.collection(Collections.COMPANIES).doc(req.companyId).get();
    const company  = compSnap.exists ? compSnap.data() : {};
    res.json({
      uid:         req.uid,
      email:       req.email,
      companyId:   req.companyId,
      companyName: company.name,
      plan:        company.plan,
      interviewsUsed:  company.interviewsUsed,
      interviewsLimit: company.interviewsLimit,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────
router.post("/refresh", verifyToken, async (req, res) => {
  const token = jwt.sign(
    { uid: req.uid, email: req.email, companyId: req.companyId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
  res.json({ token });
});

module.exports = router;
