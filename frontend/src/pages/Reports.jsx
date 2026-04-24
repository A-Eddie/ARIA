// src/pages/Reports.jsx
import { useEffect, useState } from "react";
import { reportsAPI } from "../lib/api";
import { Card, StatCard, ProgressBar, Spinner, SectionHead, STATUS_COLOR, SCORE_COLOR } from "../components/ui";

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    reportsAPI.summary().then(r => setSummary(r.data.summary)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"60vh" }}><Spinner size={32}/></div>;
  if (!summary) return null;

  const verdictColors = { Exceptional:"#10b981", Strong:"#3b82f6", Competent:"#f59e0b", "Needs Development":"#ef4444" };
  const totalScored = Object.values(summary.byVerdict||{}).reduce((a,b)=>a+b,0);

  return (
    <div className="animate-fadeUp">
      <SectionHead title="Reports & Analytics" subtitle="Hiring pipeline performance overview" />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        <StatCard label="Avg Score"    value={`${summary.avgScore}%`}     color="var(--blue)"   />
        <StatCard label="Hire Rate"    value={`${summary.hireRate}%`}     color="var(--green)"  />
        <StatCard label="Interviews"   value={summary.interviewsUsed}     color="var(--purple)" />
        <StatCard label="Total Roles"  value={summary.totalJobs}          color="var(--yellow)" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        {/* By role */}
        <Card>
          <div style={{ fontFamily:"var(--font-head)", fontSize:14, fontWeight:700, color:"var(--white)", marginBottom:18 }}>By Role</div>
          {summary.roleStats?.length === 0 && <div style={{ color:"var(--text4)", fontSize:13 }}>No data yet</div>}
          {summary.roleStats?.map(r => (
            <div key={r.role} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12, color:"var(--white)" }}>{r.role}</span>
                <div style={{ display:"flex", gap:12 }}>
                  <span style={{ fontSize:11, color:"var(--text3)", fontFamily:"var(--font-mono)" }}>{r.count} candidates</span>
                  {r.avgScore && <span style={{ fontSize:11, color:SCORE_COLOR(r.avgScore), fontFamily:"var(--font-mono)" }}>{r.avgScore}/100</span>}
                </div>
              </div>
              <ProgressBar value={r.avgScore||0} color={SCORE_COLOR(r.avgScore||0)} />
            </div>
          ))}
        </Card>

        {/* Verdict distribution */}
        <Card>
          <div style={{ fontFamily:"var(--font-head)", fontSize:14, fontWeight:700, color:"var(--white)", marginBottom:18 }}>Verdict Distribution</div>
          {Object.entries(verdictColors).map(([v,c]) => {
            const n = summary.byVerdict?.[v] || 0;
            return (
              <div key={v} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:c, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:12, color:"var(--white)" }}>{v}</span>
                    <span style={{ fontSize:11, color:c, fontFamily:"var(--font-mono)" }}>{n}</span>
                  </div>
                  <ProgressBar value={n} max={Math.max(totalScored,1)} color={c} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Pipeline bar */}
      <Card>
        <div style={{ fontFamily:"var(--font-head)", fontSize:14, fontWeight:700, color:"var(--white)", marginBottom:16 }}>Pipeline Status</div>
        <div style={{ display:"flex", gap:3, height:32, borderRadius:8, overflow:"hidden", marginBottom:12 }}>
          {Object.entries(STATUS_COLOR).map(([s, c]) => {
            const n = summary.byStatus?.[s] || 0;
            const pct = summary.totalCandidates ? (n / summary.totalCandidates) * 100 : 0;
            return pct > 0 ? (
              <div key={s} title={`${s}: ${n}`} style={{ width:`${pct}%`, background:c, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff", fontFamily:"var(--font-mono)", fontWeight:700, minWidth:20 }}>{n}</div>
            ) : null;
          })}
        </div>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
          {Object.entries(STATUS_COLOR).map(([s, c]) => (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text3)" }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:c }} />
              {s} ({summary.byStatus?.[s]||0})
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
