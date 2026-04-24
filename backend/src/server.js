// ─────────────────────────────────────────────────────────────
//  ARIA HR Platform — Backend Server
//  Entry point: src/server.js
// ─────────────────────────────────────────────────────────────
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();

// ── Security middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Stripe webhook must receive raw body ─────────────────────
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Global rate limiter ──────────────────────────────────────
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down." },
}));

// ── Strict limiter for AI endpoints ──────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 10,
  message: { error: "AI rate limit reached — wait 1 minute." },
});
app.use("/api/interview/message", aiLimiter);
app.use("/api/interview/start",   aiLimiter);

// ── Health check ─────────────────────────────────────────────
app.get("/health", (_, res) => res.json({
  status: "ok",
  timestamp: new Date().toISOString(),
  version: "1.0.0",
}));

// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth",        require("./routes/auth"));
app.use("/api/companies",   require("./routes/companies"));
app.use("/api/jobs",        require("./routes/jobs"));
app.use("/api/candidates",  require("./routes/candidates"));
app.use("/api/interview",   require("./routes/interview"));
app.use("/api/evaluation",  require("./routes/evaluation"));
app.use("/api/assignment",  require("./routes/assignment"));
app.use("/api/reports",     require("./routes/reports"));
app.use("/api/billing",     require("./routes/billing"));
app.use("/api/email",       require("./routes/email"));

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🤖 ARIA Backend running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL}\n`);
});

module.exports = app;
