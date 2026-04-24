// src/components/ui.jsx  — All reusable UI atoms
import { useState } from "react";

// ── Badge ─────────────────────────────────────────────────────
export function Badge({ label, color = "#6b7280" }) {
  return (
    <span style={{
      background: `${color}18`, border: `1px solid ${color}44`,
      color, borderRadius: 100, padding: "2px 10px",
      fontSize: 11, fontFamily: "var(--font-mono)",
      textTransform: "uppercase", letterSpacing: "0.05em",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ── Button ────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "primary", size = "md", disabled, type = "button", style: s = {}, loading }) {
  const pad = size === "sm" ? "6px 14px" : size === "lg" ? "15px 32px" : "11px 22px";
  const fnt = size === "sm" ? 12 : size === "lg" ? 16 : 14;
  const variants = {
    primary:   { background: "#3b82f6", color: "#fff", border: "none" },
    secondary: { background: "rgba(255,255,255,0.06)", color: "#c8c5be", border: "1px solid rgba(255,255,255,0.1)" },
    danger:    { background: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" },
    success:   { background: "#10b981", color: "#fff", border: "none" },
    ghost:     { background: "transparent", color: "#6b7280", border: "1px solid rgba(255,255,255,0.08)" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...variants[variant],
        padding: pad, fontSize: fnt, borderRadius: 8,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        fontFamily: "var(--font-sans)", fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s", display: "inline-flex",
        alignItems: "center", gap: 6, ...s,
      }}
    >
      {loading && <span className="animate-spin" style={{ fontSize: 14 }}>◌</span>}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────
export function Input({ label, value, onChange, placeholder, type = "text", error, required, style: s = {}, autoFocus }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: "block", fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
          {label}{required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        style={{
          width: "100%", background: "rgba(255,255,255,0.05)",
          border: `1px solid ${error ? "var(--red)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 8, padding: "11px 14px", color: "var(--white)",
          fontSize: 14, outline: "none", boxSizing: "border-box", ...s,
        }}
      />
      {error && <p style={{ color: "var(--red)", fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────
export function Textarea({ label, value, onChange, placeholder, rows = 4, style: s = {} }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--font-mono)" }}>{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%", background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "11px 14px", color: "var(--white)",
          fontSize: 14, outline: "none", resize: "vertical",
          fontFamily: "var(--font-sans)", boxSizing: "border-box", ...s,
        }}
      />
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────
export function Select({ label, value, onChange, options, style: s = {} }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--font-mono)" }}>{label}</label>}
      <select
        value={value}
        onChange={onChange}
        style={{
          width: "100%", background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "11px 14px", color: "var(--white)",
          fontSize: 14, outline: "none", ...s,
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: "#0f1015" }}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, style: s = {}, glow, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${glow ? "rgba(59,130,246,0.25)" : "var(--border)"}`,
        borderRadius: 14, padding: 22,
        boxShadow: glow ? "0 0 30px rgba(59,130,246,0.08)" : "none",
        cursor: onClick ? "pointer" : "default",
        transition: onClick ? "all 0.15s" : "none",
        ...s,
      }}
    >
      {children}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ show, onClose, title, children, width = 560 }) {
  if (!show) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        zIndex: 1000, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 20,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0f1015", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, padding: 28, width: "100%", maxWidth: width,
          maxHeight: "90vh", overflowY: "auto",
          animation: "fadeUp 0.25s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--white)", fontFamily: "var(--font-head)" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "var(--text2)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 20, color = "var(--blue)" }) {
  return (
    <span className="animate-spin" style={{ fontSize: size, color, display: "inline-block" }}>◌</span>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function Empty({ icon = "📭", title, subtitle, action, onAction }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)" }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, marginBottom: 20 }}>{subtitle}</div>}
      {action && <Btn onClick={onAction}>{action}</Btn>}
    </div>
  );
}

// ── Score ring ────────────────────────────────────────────────
export function ScoreRing({ score, size = 80 }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: size * 0.25, color, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────
export function StatCard({ label, value, color = "var(--blue)", icon, sub }) {
  return (
    <Card style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>{label}</span>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      </div>
      <div style={{ fontFamily: "var(--font-head)", fontSize: "2rem", fontWeight: 800, color, lineHeight: 1, marginBottom: sub ? 6 : 0 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text4)" }}>{sub}</div>}
    </Card>
  );
}

// ── Progress bar ──────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = "var(--blue)", height = 4 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ height, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 100, transition: "width 0.8s ease" }} />
    </div>
  );
}

// ── Toast container ───────────────────────────────────────────
export function ToastContainer({ toasts, remove }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => remove(t.id)} style={{
          background: t.type === "error" ? "rgba(239,68,68,0.15)" : t.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
          border: `1px solid ${t.type === "error" ? "rgba(239,68,68,0.3)" : t.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(59,130,246,0.3)"}`,
          borderRadius: 10, padding: "12px 18px", fontSize: 13,
          color: t.type === "error" ? "#fca5a5" : t.type === "success" ? "#6ee7b7" : "#93c5fd",
          cursor: "pointer", maxWidth: 320, animation: "slideIn 0.3s ease",
          backdropFilter: "blur(12px)",
        }}>
          {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : "ℹ "}{t.message}
        </div>
      ))}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────
export function SectionHead({ title, subtitle, action, onAction, actionVariant = "primary" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-head)", fontSize: "1.8rem", fontWeight: 800, color: "var(--white)", marginBottom: subtitle ? 4 : 0 }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--text3)", fontSize: 13 }}>{subtitle}</p>}
      </div>
      {action && <Btn onClick={onAction} variant={actionVariant}>{action}</Btn>}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────
export function Divider({ label, color = "var(--text3)" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
      <span style={{ fontSize: 10, color, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

// ── Pill tabs ─────────────────────────────────────────────────
export function PillTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, background: active === t.id ? "rgba(59,130,246,0.2)" : "transparent",
          border: `1px solid ${active === t.id ? "rgba(59,130,246,0.35)" : "transparent"}`,
          color: active === t.id ? "#93c5fd" : "var(--text3)",
          borderRadius: 8, padding: "9px", cursor: "pointer",
          fontSize: 13, fontFamily: "var(--font-sans)", fontWeight: 600,
          transition: "all 0.15s",
        }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Colors helpers ────────────────────────────────────────────
export const STATUS_COLOR = {
  open: "#10b981", closed: "#6b7280", pending: "#f59e0b",
  interviewing: "#3b82f6", evaluating: "#8b5cf6",
  evaluated: "#8b5cf6", hired: "#10b981", rejected: "#ef4444",
};
export const SCORE_COLOR  = s => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";
export const PRIO_COLOR   = p => p === "Critical" ? "#ef4444" : p === "High" ? "#f59e0b" : "#10b981";
