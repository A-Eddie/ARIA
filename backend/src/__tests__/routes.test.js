// backend/src/__tests__/routes.test.js
const request = require("supertest");

// Mock Firebase and Anthropic before importing app
jest.mock("../config", () => ({
  db: {
    collection: jest.fn(() => ({
      doc:         jest.fn(() => ({ get: jest.fn(), set: jest.fn(), update: jest.fn(), delete: jest.fn() })),
      where:       jest.fn().mockReturnThis(),
      orderBy:     jest.fn().mockReturnThis(),
      limit:       jest.fn().mockReturnThis(),
      get:         jest.fn(() => ({ docs: [], empty: true })),
      add:         jest.fn(),
    })),
  },
  auth:      { verifyIdToken: jest.fn(), createUser: jest.fn(), getUserByEmail: jest.fn(), setCustomUserClaims: jest.fn() },
  anthropic: { messages: { create: jest.fn() } },
  admin:     { firestore: { FieldValue: { serverTimestamp: jest.fn(), arrayUnion: jest.fn(), increment: jest.fn() } } },
  Collections: {
    COMPANIES: "companies", JOBS: "jobs", CANDIDATES: "candidates",
    INTERVIEWS: "interviews", EVALUATIONS: "evaluations", ASSIGNMENTS: "assignments", USERS: "users",
  },
}));

jest.mock("../jobs/queues", () => ({ evaluationQueue: null }));
jest.mock("../services/email",  () => ({ sendCandidateInvite: jest.fn(), sendEvaluationReady: jest.fn(), sendAssignment: jest.fn() }));

const jwt  = require("jsonwebtoken");
process.env.JWT_SECRET  = "test-secret-key";
process.env.ANTHROPIC_API_KEY = "test-key";

const app = require("../server");

// ── Helpers ───────────────────────────────────────────────────
const makeToken = (override = {}) =>
  jwt.sign({ uid: "user1", email: "hr@test.com", companyId: "co1", ...override }, "test-secret-key", { expiresIn: "1h" });

// ── Health ────────────────────────────────────────────────────
describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.version).toBeDefined();
  });
});

// ── Auth ──────────────────────────────────────────────────────
describe("POST /api/auth/signup", () => {
  const { auth, db } = require("../config");

  it("returns 400 if fields missing", async () => {
    const res = await request(app).post("/api/auth/signup").send({ email: "x@x.com" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 if password too short", async () => {
    const res = await request(app).post("/api/auth/signup").send({ companyName: "Test", email: "x@x.com", password: "123" });
    expect(res.status).toBe(400);
  });

  it("creates user and returns token on success", async () => {
    auth.createUser.mockResolvedValueOnce({ uid: "new-uid" });
    db.collection().doc().set.mockResolvedValue({});
    auth.setCustomUserClaims.mockResolvedValue({});

    const res = await request(app).post("/api/auth/signup").send({
      companyName: "Test Co", email: "hr@test.com", password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("hr@test.com");
  });
});

describe("POST /api/auth/login", () => {
  const { auth, db } = require("../config");

  it("returns 400 if missing fields", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "hr@test.com" });
    expect(res.status).toBe(400);
  });

  it("returns 401 if user not found", async () => {
    auth.getUserByEmail.mockRejectedValueOnce(new Error("not found"));
    const res = await request(app).post("/api/auth/login").send({ email: "x@x.com", password: "pw" });
    expect(res.status).toBe(401);
  });
});

// ── Auth middleware ───────────────────────────────────────────
describe("Auth middleware", () => {
  it("returns 401 with no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer badtoken");
    expect(res.status).toBe(401);
  });

  it("passes with valid JWT", async () => {
    const { db } = require("../config");
    db.collection().doc().get.mockResolvedValueOnce({ exists: true, data: () => ({ name: "Test Co", plan: "starter", interviewsUsed: 0, interviewsLimit: 10 }) });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("hr@test.com");
  });
});

// ── Jobs ──────────────────────────────────────────────────────
describe("GET /api/jobs", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/jobs");
    expect(res.status).toBe(401);
  });

  it("returns jobs list with valid token", async () => {
    const { db } = require("../config");
    db.collection().where().orderBy().limit().get.mockResolvedValueOnce({
      docs: [{ id: "j1", data: () => ({ title: "Frontend Dev", status: "open", companyId: "co1" }) }],
    });
    const res = await request(app).get("/api/jobs").set("Authorization", `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });
});

describe("POST /api/jobs", () => {
  it("returns 400 if title missing", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ department: "Eng" });
    expect(res.status).toBe(400);
  });
});

// ── Interview (public) ────────────────────────────────────────
describe("POST /api/interview/start", () => {
  it("returns 400 if fields missing", async () => {
    const res = await request(app).post("/api/interview/start").send({ jobToken: "abc" });
    expect(res.status).toBe(400);
  });

  it("returns 404 if job token invalid", async () => {
    const { db } = require("../config");
    db.collection().where().where().limit().get.mockResolvedValueOnce({ empty: true });
    const res = await request(app).post("/api/interview/start").send({
      jobToken: "invalid", candidateName: "Test", candidateEmail: "t@t.com",
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/interview/message", () => {
  it("returns 400 if fields missing", async () => {
    const res = await request(app).post("/api/interview/message").send({ interviewId: "i1" });
    expect(res.status).toBe(400);
  });
});

// ── Billing ───────────────────────────────────────────────────
describe("GET /api/billing/plans", () => {
  it("returns plan list without auth", async () => {
    const res = await request(app).get("/api/billing/plans");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.plans)).toBe(true);
    expect(res.body.plans).toHaveLength(3);
    expect(res.body.plans[0]).toHaveProperty("id");
    expect(res.body.plans[0]).toHaveProperty("price");
  });
});

// ── Rate limiting ─────────────────────────────────────────────
describe("Rate limiting", () => {
  it("health check is not rate limited", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
    }
  });
});

// ── 404 ───────────────────────────────────────────────────────
describe("404 handler", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
