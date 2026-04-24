// src/lib/api.js  — Axios client wired to backend
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT ──────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aria_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 globally ────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("aria_token");
      localStorage.removeItem("aria_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  signup:  (data) => api.post("/auth/signup", data),
  login:   (data) => api.post("/auth/login",  data),
  me:      ()     => api.get("/auth/me"),
  refresh: ()     => api.post("/auth/refresh"),
};

// ── Jobs ──────────────────────────────────────────────────────
export const jobsAPI = {
  list:       ()       => api.get("/jobs"),
  get:        (id)     => api.get(`/jobs/${id}`),
  create:     (data)   => api.post("/jobs", data),
  update:     (id, d)  => api.patch(`/jobs/${id}`, d),
  delete:     (id)     => api.delete(`/jobs/${id}`),
  byToken:    (token)  => api.get(`/jobs/token/${token}`),   // public
};

// ── Candidates ────────────────────────────────────────────────
export const candidatesAPI = {
  list:   (params) => api.get("/candidates", { params }),
  get:    (id)     => api.get(`/candidates/${id}`),
  update: (id, d)  => api.patch(`/candidates/${id}`, d),
  delete: (id)     => api.delete(`/candidates/${id}`),
};

// ── Interview ─────────────────────────────────────────────────
export const interviewAPI = {
  start:   (data) => api.post("/interview/start",   data),  // public
  message: (data) => api.post("/interview/message", data),  // public
  get:     (id)   => api.get(`/interview/${id}`),
};

// ── Evaluation ────────────────────────────────────────────────
export const evaluationAPI = {
  run: (data) => api.post("/evaluation/run", data),
  get: (candidateId) => api.get(`/evaluation/${candidateId}`),
};

// ── Assignment ────────────────────────────────────────────────
export const assignmentAPI = {
  generate: (data)        => api.post("/assignment/generate", data),
  get:      (candidateId) => api.get(`/assignment/${candidateId}`),
};

// ── Reports ───────────────────────────────────────────────────
export const reportsAPI = {
  summary: () => api.get("/reports/summary"),
};

// ── Company ───────────────────────────────────────────────────
export const companyAPI = {
  get:    () => api.get("/companies/me"),
  update: (d) => api.patch("/companies/me", d),
};

// ── Billing ───────────────────────────────────────────────────
export const billingAPI = {
  plans:         ()     => api.get("/billing/plans"),
  createSession: (plan) => api.post("/billing/create-session", { plan }),
};

// ── Email ─────────────────────────────────────────────────────
export const emailAPI = {
  sendInvite: (data) => api.post("/email/invite", data),
};

export default api;
