// src/services/email.js  — Nodemailer email service
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const FROM = process.env.EMAIL_FROM || "ARIA HR <aria@aria-hr.com>";
const BASE = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Candidate interview invitation ────────────────────────────
async function sendCandidateInvite(candidate, job, token) {
  await transporter.sendMail({
    from:    FROM,
    to:      candidate.email,
    subject: `Your Interview Invitation — ${job.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#07080c;color:#c8c5be;padding:40px;border-radius:12px">
        <h1 style="color:#fff;font-size:28px;margin-bottom:8px">You're invited to interview with ARIA 🤖</h1>
        <p style="color:#9ca3af;margin-bottom:24px">Hi ${candidate.name},</p>
        <p>You've been invited to complete an AI-powered interview for the <strong style="color:#fff">${job.title}</strong> position.</p>
        <p style="margin:16px 0;color:#9ca3af">The interview takes approximately <strong style="color:#fff">10 minutes</strong> and you can complete it from anywhere, at any time.</p>
        <a href="${BASE}/interview/${token}" style="display:inline-block;background:#3b82f6;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;margin:24px 0">
          Start My Interview →
        </a>
        <p style="font-size:12px;color:#6b7280;margin-top:32px">This link is unique to you. Do not share it with others.<br>If you did not apply for this role, please ignore this email.</p>
      </div>
    `,
  });
}

// ── Company — evaluation ready notification ───────────────────
async function sendEvaluationReady(company, candidate, evaluation, job) {
  const scoreColor = evaluation.score >= 80 ? "#10b981" : evaluation.score >= 60 ? "#f59e0b" : "#ef4444";
  await transporter.sendMail({
    from:    FROM,
    to:      company.email,
    subject: `Interview Complete: ${candidate.name} — ${job.title} (Score: ${evaluation.score}/100)`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#07080c;color:#c8c5be;padding:40px;border-radius:12px">
        <h1 style="color:#fff;font-size:24px">Interview Results 📊</h1>
        <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:20px;margin:20px 0">
          <p><strong style="color:#fff">Candidate:</strong> ${candidate.name}</p>
          <p><strong style="color:#fff">Role:</strong> ${job.title}</p>
          <p><strong style="color:#fff">Score:</strong> <span style="color:${scoreColor};font-size:20px;font-weight:800">${evaluation.score}/100</span></p>
          <p><strong style="color:#fff">Verdict:</strong> ${evaluation.verdict}</p>
          <p><strong style="color:#fff">Recommendation:</strong> ${evaluation.hire_recommendation}</p>
          <p style="color:#9ca3af;font-style:italic;margin-top:12px">"${evaluation.summary}"</p>
        </div>
        <a href="${BASE}/dashboard/candidates/${candidate.id}" style="display:inline-block;background:#3b82f6;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700">
          View Full Report →
        </a>
      </div>
    `,
  });
}

// ── Candidate — work assignment email ─────────────────────────
async function sendAssignment(candidate, assignment) {
  await transporter.sendMail({
    from:    FROM,
    to:      candidate.email,
    subject: `Welcome to the team, ${candidate.name}! Your onboarding plan is ready 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#07080c;color:#c8c5be;padding:40px;border-radius:12px">
        <h1 style="color:#fff">Welcome aboard! 🎉</h1>
        <p style="color:#6ee7b7;font-style:italic;margin:16px 0">"${assignment.welcome_message}"</p>
        <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:10px;padding:16px;margin:20px 0">
          <p style="color:#93c5fd;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">YOUR MENTOR</p>
          <p style="color:#fff;font-weight:600">${assignment.mentor}</p>
        </div>
        <h3 style="color:#fff;margin-top:24px">Your First Project: ${assignment.first_project?.title}</h3>
        <p style="color:#9ca3af">${assignment.first_project?.description}</p>
        <p style="color:#f59e0b;margin-top:8px">⏰ Deadline: ${assignment.first_project?.deadline}</p>
        <a href="${BASE}" style="display:inline-block;background:#10b981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:24px">
          View Full Assignment →
        </a>
      </div>
    `,
  });
}

module.exports = { sendCandidateInvite, sendEvaluationReady, sendAssignment };
