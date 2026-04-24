// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useStore";
import { reportsAPI, candidatesAPI, jobsAPI } from "../lib/api";
import { Card, StatCard, Badge, Btn, ProgressBar, Spinner, STATUS_COLOR, SCORE_COLOR } from "../components/ui";

function ago(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user }  = useAuthStore();
  const [summary,     setSummary]     = useState(null);
  const [candidates,  setCandidates]  = useState([]);
  const [jobs,        setJobs]        = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      reportsAPI.summary(),
      candidatesAPI.list({ limit: 5 }),
      jobsAPI.list(),
    ]).then(([r, c, j]) => {
      setSummary(r.data.summary);
      setCandidates(c.data.candidates);
      setJobs(j.data.jobs.filter(x => x.status === "open").slice(0, 5));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Spinner size={32} />
    </div>
  );

  return (
    <div className="animate-fadeUp">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-head)", fontSize: "1.8rem", fontWeight: 800, color: "var(--white)", marginBottom: 4 }}>
          {greeting} 👋
        </h1>
        <p style={{ color: "var(--text3)", fontSize: 13 }}>
          Your hiring pipeline at a glance — {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stat cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard label="Open Roles"        value={summary.openJobs}         color="var(--blue)"   icon="💼" sub={`${summary.totalJobs} total`} />
          <StatCard label="Candidates"        value={summary.totalCandidates}  color="var(--purple)" icon="👤" sub={`${summary.byStatus?.pending || 0} pending`} />
          <StatCard label="Hired"             value={summary.hired}            color="var(--green)"  icon="✅" sub={`${summary.hireRate}% hire rate`} />
          <StatCard label="Avg. Score"        value={`${summary.avgScore}%`}   color="var(--yellow)" icon="📊" sub="across all roles" />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>
        {/* Recent candidates */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, color: "var(--white)" }}>Recent Candidates</h3>
            <Btn variant="secondary" size="sm" onClick={() => navigate("/dashboard/candidates")}>View All</Btn>
          </div>
          {candidates.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text4)", fontSize: 13 }}>No candidates yet</div>
          )}
          {candidates.map(c => (
            <div key={c.id} onClick={() => navigate(`/dashboard/candidates/${c.id}`)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${STATUS_COLOR[c.status] || "#6b7280"}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: STATUS_COLOR[c.status] || "#6b7280", fontWeight: 700, flexShrink: 0 }}>
                {c.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{c.role}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Badge label={c.status} color={STATUS_COLOR[c.status] || "#6b7280"} />
                {c.score != null && (
                  <div style={{ fontSize: 11, color: SCORE_COLOR(c.score), marginTop: 3, fontFamily: "var(--font-mono)" }}>{c.score}/100</div>
                )}
              </div>
            </div>
          ))}
        </Card>

        {/* Open roles */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, color: "var(--white)" }}>Open Roles</h3>
            <Btn variant="secondary" size="sm" onClick={() => navigate("/dashboard/jobs")}>Manage</Btn>
          </div>
          {jobs.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text4)", fontSize: 13 }}>No open roles yet</div>
          )}
          {jobs.map(j => (
            <div key={j.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 3 }}>{j.title}</div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "var(--text3)" }}>{j.department} · {j.location}</span>
                <span style={{ fontSize: 11, color: "var(--blue)", fontFamily: "var(--font-mono)" }}>{j.candidatesCount || 0} candidates</span>
              </div>
            </div>
          ))}
          <Btn style={{ width: "100%", marginTop: 14, justifyContent: "center" }} size="sm" onClick={() => navigate("/dashboard/jobs")}>
            + Post New Role
          </Btn>
        </Card>

        {/* Pipeline progress */}
        {summary?.byStatus && (
          <Card style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 16 }}>Pipeline Overview</h3>
            <div style={{ display: "flex", gap: 3, height: 32, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
              {Object.entries(STATUS_COLOR).map(([s, c]) => {
                const n = summary.byStatus[s] || 0;
                const pct = summary.totalCandidates ? (n / summary.totalCandidates) * 100 : 0;
                return pct > 0 ? (
                  <div key={s} title={`${s}: ${n}`} style={{ width: `${pct}%`, background: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 700, minWidth: 24 }}>{n}</div>
                ) : null;
              })}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {Object.entries(STATUS_COLOR).map(([s, c]) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text3)" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
                  {s} ({summary.byStatus[s] || 0})
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
