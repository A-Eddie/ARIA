// src/pages/Candidates.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { candidatesAPI } from "../lib/api";
import { SectionHead, Badge, Btn, Spinner, Empty, STATUS_COLOR, SCORE_COLOR } from "../components/ui";
import { useToastStore } from "../store/useStore";

function ago(d) {
  if (!d) return "";
  const ts = d._seconds ? d._seconds * 1000 : new Date(d).getTime();
  const s  = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

const STATUSES = ["all","pending","interviewing","evaluating","evaluated","hired","rejected"];

export default function Candidates() {
  const navigate = useNavigate();
  const toast    = useToastStore(s => s.add);
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");
  const [search,     setSearch]     = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const res = await candidatesAPI.list(params);
      setCandidates(res.data.candidates);
    } catch { toast("Failed to load candidates", "error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const filtered = search
    ? candidates.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    : candidates;

  return (
    <div className="animate-fadeUp">
      <SectionHead
        title="Candidates"
        subtitle={`${candidates.length} total`}
        action="+ New Interview"
        onAction={() => navigate("/dashboard/jobs")}
      />

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              background: filter===s ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${filter===s ? "rgba(59,130,246,0.3)" : "var(--border)"}`,
              color: filter===s ? "var(--blue)" : "var(--text3)",
              borderRadius: 100, padding: "5px 12px", fontSize: 11,
              cursor: "pointer", fontFamily: "var(--font-mono)", textTransform: "capitalize",
            }}>
              {s === "all" ? `All (${candidates.length})` : s}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, role, email..."
          style={{ marginLeft:"auto", background:"rgba(255,255,255,0.04)", border:"1px solid var(--border)", borderRadius:8, padding:"7px 13px", color:"var(--white)", fontSize:12, outline:"none", width:220 }}
        />
      </div>

      {loading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60 }}><Spinner size={28}/></div>
      ) : filtered.length === 0 ? (
        <Empty icon="👤" title="No candidates found" subtitle="Adjust filters or invite candidates via a job posting" />
      ) : (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden" }}>
          {/* Table header */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1fr 80px", background:"rgba(255,255,255,0.02)", borderBottom:"1px solid var(--border)" }}>
            {["Candidate","Role","Status","Score","Applied",""].map(h => (
              <div key={h} style={{ padding:"10px 16px", fontSize:10, color:"var(--text4)", fontFamily:"var(--font-mono)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map(c => (
            <div key={c.id} style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1fr 80px", borderBottom:"1px solid rgba(255,255,255,0.03)", transition:"background 0.12s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ padding:"13px 16px", display:"flex", alignItems:"center", gap:11 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:`${STATUS_COLOR[c.status]||"#6b7280"}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:STATUS_COLOR[c.status]||"#6b7280", fontWeight:700, flexShrink:0 }}>
                  {c.name[0]}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--white)" }}>{c.name}</div>
                  <div style={{ fontSize:11, color:"var(--text3)" }}>{c.email}</div>
                </div>
              </div>
              <div style={{ padding:"13px 16px", display:"flex", alignItems:"center", fontSize:12, color:"var(--text2)" }}>{c.role}</div>
              <div style={{ padding:"13px 16px", display:"flex", alignItems:"center" }}>
                <Badge label={c.status} color={STATUS_COLOR[c.status]||"#6b7280"} />
              </div>
              <div style={{ padding:"13px 16px", display:"flex", alignItems:"center" }}>
                {c.score != null
                  ? <span style={{ fontFamily:"var(--font-mono)", fontSize:13, color:SCORE_COLOR(c.score), fontWeight:700 }}>{c.score}/100</span>
                  : <span style={{ color:"var(--text4)", fontSize:13 }}>—</span>
                }
              </div>
              <div style={{ padding:"13px 16px", display:"flex", alignItems:"center", fontSize:11, color:"var(--text3)", fontFamily:"var(--font-mono)" }}>
                {ago(c.createdAt)}
              </div>
              <div style={{ padding:"13px 16px", display:"flex", alignItems:"center" }}>
                <Btn variant="secondary" size="sm" onClick={() => navigate(`/dashboard/candidates/${c.id}`)}>View</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
