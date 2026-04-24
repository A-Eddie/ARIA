// src/pages/Landing.jsx
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useStore";
import { Btn } from "../components/ui";

const FEATURES = [
  { icon: "🤖", t: "AI Interviews",      d: "ARIA conducts real adaptive interviews — behavioral, technical, situational — tailored per role and candidate." },
  { icon: "📊", t: "Smart Evaluation",   d: "Instant score, verdict, strengths/gaps breakdown, and hire recommendation generated the moment an interview ends." },
  { icon: "📋", t: "Work Assignment",    d: "Personalised onboarding plan, first project, KPIs, and mentor automatically assigned to every hire." },
  { icon: "🏢", t: "Company Dashboard",  d: "Full pipeline view — manage jobs, track candidates, read transcripts, and export reports in one place." },
  { icon: "📧", t: "Auto Notifications", d: "Candidates receive invite links instantly. Companies get real-time alerts the moment evaluations are ready." },
  { icon: "🔒", t: "Secure & Scalable",  d: "Firebase Auth, JWT tokens, per-company data isolation, rate limiting, and GDPR-ready architecture." },
];

const PLANS = [
  { id: "starter",    name: "Starter",    price: "$29", features: ["10 interviews/mo", "1 job posting", "Email notifications", "Basic evaluation"] },
  { id: "growth",     name: "Growth",     price: "$79", features: ["50 interviews/mo", "5 job postings", "Custom questions", "Work assignment", "CSV export"], pop: true },
  { id: "enterprise", name: "Enterprise", price: "$199",features: ["Unlimited interviews", "Unlimited postings", "White-label", "API access", "Priority support"] },
];

export default function Landing() {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const go = () => navigate(token ? "/dashboard" : "/login");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", height: 60, borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "rgba(7,8,12,0.92)", backdropFilter: "blur(20px)", zIndex: 100 }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 22, color: "var(--white)" }}>
          AR<span style={{ color: "var(--blue)" }}>IA</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" size="sm" onClick={() => navigate("/login")}>Sign In</Btn>
          <Btn size="sm" onClick={() => navigate("/signup")}>Get Started Free</Btn>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "100px 20px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 0%,rgba(59,130,246,0.1) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div className="animate-fadeUp" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 100, padding: "5px 16px", fontSize: 11, color: "#93c5fd", marginBottom: 28, fontFamily: "var(--font-mono)" }}>
          <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue)" }} />
          AI-POWERED HR PLATFORM · LIVE NOW
        </div>
        <h1 className="animate-fadeUp" style={{ fontFamily: "var(--font-head)", fontSize: "clamp(2.8rem,7vw,5.5rem)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--white)", marginBottom: 20, animationDelay: "0.1s" }}>
          Hire Smarter<br />with <span style={{ color: "var(--blue)", fontStyle: "italic" }}>ARIA</span>
        </h1>
        <p className="animate-fadeUp" style={{ fontSize: "1.15rem", color: "var(--text3)", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7, animationDelay: "0.2s" }}>
          Your AI HR Director that interviews candidates, evaluates performance, and assigns work — automatically, at scale.
        </p>
        <div className="animate-fadeUp" style={{ display: "flex", gap: 14, justifyContent: "center", animationDelay: "0.3s" }}>
          <button onClick={go} className="animate-glow" style={{ background: "var(--blue)", color: "#fff", border: "none", borderRadius: 10, padding: "15px 38px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            Start Hiring with ARIA →
          </button>
          <Btn variant="secondary" onClick={go}>View Demo</Btn>
        </div>
      </section>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "rgba(255,255,255,0.04)", maxWidth: 720, margin: "0 auto 80px", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
        {[["2,400+", "Interviews"], ["94%", "Accuracy"], ["3×", "Faster Hiring"], ["40+", "Roles"]].map(([v, l]) => (
          <div key={l} style={{ background: "var(--bg)", padding: "24px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: "2rem", fontWeight: 800, color: "var(--white)", marginBottom: 4 }}>{v}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ textAlign: "center", fontFamily: "var(--font-head)", fontSize: "2rem", fontWeight: 800, color: "var(--white)", marginBottom: 48 }}>Everything you need to hire well</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {FEATURES.map(f => (
            <div key={f.t} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 8, fontFamily: "var(--font-head)" }}>{f.t}</h3>
              <p style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.7 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 100px" }}>
        <h2 style={{ textAlign: "center", fontFamily: "var(--font-head)", fontSize: "2rem", fontWeight: 800, color: "var(--white)", marginBottom: 12 }}>Simple pricing</h2>
        <p style={{ textAlign: "center", color: "var(--text3)", marginBottom: 48 }}>Start free. Scale as you grow.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {PLANS.map(p => (
            <div key={p.id} style={{ background: p.pop ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${p.pop ? "rgba(59,130,246,0.3)" : "var(--border)"}`, borderRadius: 16, padding: 24, position: "relative" }}>
              {p.pop && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "var(--blue)", color: "#fff", borderRadius: 100, padding: "2px 12px", fontSize: 10, fontFamily: "var(--font-mono)" }}>POPULAR</div>}
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6, fontFamily: "var(--font-mono)" }}>{p.name}</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: "2.2rem", fontWeight: 800, color: "var(--white)", marginBottom: 20 }}>
                {p.price}<span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 400 }}>/mo</span>
              </div>
              {p.features.map(f => <div key={f} style={{ fontSize: 12, color: "var(--text2)", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>✓ {f}</div>)}
              <button onClick={() => navigate("/signup")} style={{ width: "100%", marginTop: 20, background: p.pop ? "var(--blue)" : "rgba(255,255,255,0.06)", color: p.pop ? "#fff" : "var(--text2)", border: "none", borderRadius: 8, padding: "11px", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "var(--font-sans)" }}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "32px", borderTop: "1px solid var(--border)", color: "var(--text4)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
        © 2025 ARIA HR Platform · AI-Powered Hiring · Built for modern teams
      </footer>
    </div>
  );
}
