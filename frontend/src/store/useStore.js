// src/store/useStore.js  — Zustand global state
import { create } from "zustand";
import { authAPI } from "../lib/api";

// ── Auth store ────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user:    JSON.parse(localStorage.getItem("aria_user") || "null"),
  token:   localStorage.getItem("aria_token") || null,
  loading: false,
  error:   null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await authAPI.login({ email, password });
      const { token, user } = res.data;
      localStorage.setItem("aria_token", token);
      localStorage.setItem("aria_user",  JSON.stringify(user));
      set({ token, user, loading: false });
      return { ok: true };
    } catch (err) {
      const error = err.response?.data?.error || "Login failed";
      set({ loading: false, error });
      return { ok: false, error };
    }
  },

  signup: async (companyName, email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await authAPI.signup({ companyName, email, password });
      const { token, user } = res.data;
      localStorage.setItem("aria_token", token);
      localStorage.setItem("aria_user",  JSON.stringify(user));
      set({ token, user, loading: false });
      return { ok: true };
    } catch (err) {
      const error = err.response?.data?.error || "Signup failed";
      set({ loading: false, error });
      return { ok: false, error };
    }
  },

  logout: () => {
    localStorage.removeItem("aria_token");
    localStorage.removeItem("aria_user");
    set({ token: null, user: null });
  },

  refreshUser: async () => {
    try {
      const res = await authAPI.me();
      const user = res.data;
      localStorage.setItem("aria_user", JSON.stringify(user));
      set({ user });
    } catch {}
  },
}));

// ── Toast notification store ──────────────────────────────────
export const useToastStore = create((set, get) => ({
  toasts: [],
  add: (message, type = "info") => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000);
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
