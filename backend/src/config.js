// src/config.js — Shared service clients
const admin = require("firebase-admin");
const Anthropic = require("@anthropic-ai/sdk");

// ── Firebase Admin ───────────────────────────────────────────
let firebaseApp;
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  firebaseApp = admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
} else {
  firebaseApp = admin.apps[0];
}

const db    = admin.firestore();
const auth  = admin.auth();
const storage = admin.storage();

// ── Anthropic ────────────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Firestore collection helpers ─────────────────────────────
const Collections = {
  COMPANIES:    "companies",
  JOBS:         "jobs",
  CANDIDATES:   "candidates",
  INTERVIEWS:   "interviews",
  EVALUATIONS:  "evaluations",
  ASSIGNMENTS:  "assignments",
  USERS:        "users",
  ACTIVITY:     "activity_logs",
};

module.exports = { db, auth, storage, anthropic, admin, Collections };
