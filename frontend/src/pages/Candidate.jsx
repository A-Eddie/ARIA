// src/pages/Candidate.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { candidatesAPI, evaluationAPI, assignmentAPI } from "../lib/api";
import { Card, Badge, Btn, ScoreRing, PillTabs, ProgressBar, Spinner, STATUS_COLOR, SCORE_COLOR, PRIO_COLOR } from "../components/ui";
import { useToastStore } from "../store/useStore";

export default function Candidate() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToastStore(s => s.add);

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("evaluation");
  const [status,     setStatus]     = useState(null);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await candidatesAPI.get(id);
      setData(res.data);
      setStatus(res.data.candidate.status);
      // Default to transcript if no evaluation yet
      if (!res.data.evaluation) setTab("transcript");
    } catch { toast("Candidate not found", "error"); navigate("/dashboard/candidates"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const updateStatus = async (newStatus) => {
    try {
      await candidatesAPI.update(id, { status: newStatus });
      setStatus(newStatus);
      toast(`Candidate marked as ${newStatus}`, "success");
    } catch { toast("Failed to update status", "error"); }
  };

  const generateAssignment = async () => {
    setGenerating(true);
    try {
      const res = await assignmentAPI.generate({ candidateId: id });
      setData(p => ({ ...p, assignment: res.data.assignment }));
      setTab("assignment");
      toast("Work assignment generated!", "success");
    } catch (e) { toast(e.response?.data?.error || "Failed to generate assignment", "error"); }
    finally { setGenerating(false); }
  };

  const runEval = async () => {
    if (!data?.candidate?.interviewId) { toast("No interview to evaluate", "error"); return; }
    setGenerating(true);
    try {
      const res = await evaluationAPI.run({ interviewId: data.candidate.interviewId, candidateId: id });
      setData(p => ({ ...p, evaluation: res.data.evaluation }));
      setTab("evaluation");
      toast("Evaluation complete!", "success");
    } catch (e) { toast(e.response?.data?.error || "Evaluation failed", "error"); }
    finally { setGenerating(false); }
  };

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}><Spinner size={32}/></div>;
  if (!data)   return null;

  const { candidate, evaluation, assignment, interview } = data;

  const tabs = [
    { id:"evaluation",  label:"📊 Evaluation" },
    { id:"transcript",  label:"💬 Transcript" },
    ...(assignment ? [{ id:"assignment", label:"📋 Assignment" }] : []),
  ];

  return (
    <div className="animate-fadeUp" style={{ maxWidth: 800 }}>
      {/* Back */}
      <button onClick={() => navigate("/dashboard/candidates")} style={{ background:"none", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:13, marginBottom:20, display:"flex", alignItems:"center", gap:6 }}>
        ← All Candidates
      </button>

      {/* Header card */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:`${STATUS_COLOR[status]||"#6b7280"}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:STATUS_COLOR[status]||"#6b7280", fontWeight:800 }}>
              {candidate.name[0]}
            </div>
            <div>
              <h1 style={{ fontFamily:"var(--font-head)", fontSize:"1.4rem", fontWeight:800, color:"var(--white)", marginBottom:6 }}>{candidate.name}</h1>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                <Badge label={candidate.role}  color="var(--blue)" />
                <Badge label={status}          color={STATUS_COLOR[status]||"#6b7280"} />
                {evaluation && <Badge label={evaluation.hire_recommendation} color={SCORE_COLOR(evaluation.score)} />}
              </div>
              <div style={{ fontSize:12, color:"var(--text3)", marginTop:6 }}>{candidate.email}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
            {!evaluation && candidate.interviewId && (
              <Btn size="sm" loading={generating} onClick={runEval}>Run Evaluation</Btn>
            )}
            {evaluation && !assignment && (
              <Btn size="sm" variant="success" loading={generating} onClick={generateAssignment}>Generate Assignment</Btn>
            )}
            {status !== "hired" && (
              <Btn size="sm" variant="success" onClick={() => updateStatus("hired")}>✓ Hire</Btn>
            )}
            {status !== "rejected" && status !== "hired" && (
              <Btn size="sm" variant="danger" onClick={() => updateStatus("rejected")}>✕ Reject</Btn>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <PillTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {/* ── EVALUATION TAB ── */}
      {tab === "evaluation" && (
        evaluation ? (
          <div>
            {/* Score + verdict */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
              <Card style={{ textAlign:"center", padding:28 }}>
                <div style={{ fontSize:10, color:"var(--text3)", fontFamily:"var(--font-mono)", marginBottom:12 }}>OVERALL SCORE</div>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
                  <ScoreRing score={evaluation.score} size={100} />
                </div>
                <ProgressBar value={evaluation.score} color={SCORE_COLOR(evaluation.score)} height={5} />
              </Card>
              <Card style={{ padding:24 }}>
                <div style={{ fontSize:10, color:"var(--text3)", fontFamily:"var(--font-mono)", marginBottom:10 }}>VERDICT</div>
                <div style={{ fontFamily:"var(--font-head)", fontSize:"1.4rem", fontWeight:800, color:SCORE_COLOR(evaluation.score), marginBottom:12 }}>{evaluation.verdict}</div>
                <Badge label={evaluation.hire_recommendation} color={SCORE_COLOR(evaluation.score)} />
                <div style={{ marginTop:18, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[
                    { l:"Technical",     v:evaluation.technical_rating },
                    { l:"Communication", v:evaluation.communication_rating },
                    { l:"Culture Fit",   v:evaluation.culture_fit_rating },
                  ].filter(x => x.v).map(x => (
                    <div key={x.l} style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"var(--font-head)", fontSize:"1.3rem", fontWeight:800, color:"var(--white)" }}>{x.v}<span style={{fontSize:11,color:"var(--text3)"}}>/5</span></div>
                      <div style={{ fontSize:10, color:"var(--text4)", fontFamily:"var(--font-mono)" }}>{x.l.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Strengths + Gaps */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div style={{ background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:12, padding:18 }}>
                <div style={{ fontSize:10, color:"var(--green)", fontFamily:"var(--font-mono)", marginBottom:12 }}>✓ STRENGTHS</div>
                {evaluation.strengths?.map((s, i) => (
                  <div key={i} style={{ fontSize:13, color:"#d1fae5", paddingLeft:10, borderLeft:"2px solid var(--green)", marginBottom:7, lineHeight:1.5 }}>{s}</div>
                ))}
              </div>
              <div style={{ background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.15)", borderRadius:12, padding:18 }}>
                <div style={{ fontSize:10, color:"var(--yellow)", fontFamily:"var(--font-mono)", marginBottom:12 }}>△ AREAS TO GROW</div>
                {evaluation.gaps?.map((g, i) => (
                  <div key={i} style={{ fontSize:13, color:"#fef3c7", paddingLeft:10, borderLeft:"2px solid var(--yellow)", marginBottom:7, lineHeight:1.5 }}>{g}</div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <Card>
              <div style={{ fontSize:10, color:"var(--text3)", fontFamily:"var(--font-mono)", marginBottom:10 }}>ARIA'S ASSESSMENT</div>
              <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.75, fontStyle:"italic" }}>"{evaluation.summary}"</p>
            </Card>

            {!assignment && (
              <Btn variant="success" style={{ width:"100%", justifyContent:"center", marginTop:16 }} loading={generating} onClick={generateAssignment}>
                Generate Work Assignment →
              </Btn>
            )}
          </div>
        ) : (
          <Card style={{ textAlign:"center", padding:50 }}>
            <div style={{ fontSize:32, marginBottom:14 }}>⏳</div>
            <div style={{ color:"var(--text3)", fontSize:14, marginBottom:20 }}>
              {candidate.status === "interviewing" ? "Interview in progress — evaluation will appear automatically when complete." : "No evaluation yet for this candidate."}
            </div>
            {candidate.interviewId && (
              <Btn loading={generating} onClick={runEval}>Run Evaluation Now</Btn>
            )}
          </Card>
        )
      )}

      {/* ── TRANSCRIPT TAB ── */}
      {tab === "transcript" && (
        <Card style={{ padding: 0 }}>
          {interview?.messages?.length > 0 ? (
            <div style={{ padding:20, maxHeight:500, overflowY:"auto", display:"flex", flexDirection:"column", gap:12 }}>
              {interview.messages.map((m, i) => (
                <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:10 }}>
                  {m.role === "assistant" && (
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,var(--blue),var(--green))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0 }}>🤖</div>
                  )}
                  <div style={{
                    maxWidth:"78%", padding:"11px 15px",
                    borderRadius: m.role==="user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: m.role==="user" ? "var(--blue)" : "rgba(255,255,255,0.07)",
                    border: m.role==="assistant" ? "1px solid rgba(255,255,255,0.07)" : "none",
                    fontSize:13, lineHeight:1.65, color:"var(--white)",
                  }}>
                    <div style={{ fontSize:9, color:m.role==="user"?"rgba(255,255,255,0.5)":"var(--text3)", marginBottom:4, fontFamily:"var(--font-mono)" }}>
                      {m.role==="user" ? candidate.name : "ARIA"}
                      {m.timestamp && ` · ${new Date(m.timestamp).toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"})}`}
                    </div>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding:50, textAlign:"center", color:"var(--text3)", fontSize:13 }}>No transcript available yet.</div>
          )}
        </Card>
      )}

      {/* ── ASSIGNMENT TAB ── */}
      {tab === "assignment" && assignment && (
        <div>
          <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:10, padding:16, marginBottom:16, textAlign:"center" }}>
            <p style={{ fontSize:14, color:"#6ee7b7", fontStyle:"italic" }}>"{assignment.welcome_message}"</p>
          </div>
          <div style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:14, marginBottom:16, display:"flex", gap:12, alignItems:"center" }}>
            <span style={{ fontSize:24 }}>👩‍💼</span>
            <div>
              <div style={{ fontSize:10, color:"var(--blue)", fontFamily:"var(--font-mono)" }}>ASSIGNED MENTOR</div>
              <div style={{ fontSize:14, fontWeight:600, color:"var(--white)" }}>{assignment.mentor}</div>
            </div>
          </div>

          {/* Onboarding tasks */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, color:"var(--text3)", fontFamily:"var(--font-mono)", marginBottom:12 }}>ONBOARDING CHECKLIST</div>
            {assignment.onboarding_tasks?.map((t, i) => (
              <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", alignItems:"flex-start" }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:PRIO_COLOR(t.priority), flexShrink:0, marginTop:5 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--white)" }}>{t.task}</div>
                  <div style={{ fontSize:12, color:"var(--text3)" }}>{t.description}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <Badge label={t.priority} color={PRIO_COLOR(t.priority)} />
                  <div style={{ fontSize:10, color:"var(--text4)", marginTop:3 }}>{t.due}</div>
                </div>
              </div>
            ))}
          </Card>

          {/* First project */}
          <div style={{ background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:10, color:"var(--green)", fontFamily:"var(--font-mono)", marginBottom:8 }}>🚀 FIRST PROJECT</div>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--white)", marginBottom:6 }}>{assignment.first_project?.title}</div>
            <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.65, marginBottom:12 }}>{assignment.first_project?.description}</p>
            {assignment.first_project?.deliverables?.map((d, i) => (
              <div key={i} style={{ fontSize:13, color:"var(--text2)", paddingLeft:12, borderLeft:"2px solid var(--green)", marginBottom:5 }}>◦ {d}</div>
            ))}
            <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"var(--yellow)" }}>⏰ {assignment.first_project?.deadline}</span>
              {assignment.first_project?.tools?.map((t, i) => (
                <span key={i} style={{ background:"rgba(255,255,255,0.07)", borderRadius:100, padding:"2px 9px", fontSize:11, color:"var(--text2)" }}>{t}</span>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <Card>
            <div style={{ fontSize:10, color:"var(--purple)", fontFamily:"var(--font-mono)", marginBottom:10 }}>📈 SUCCESS KPIS</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {assignment.kpis?.map((k, i) => (
                <div key={i} style={{ background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:8, padding:"7px 14px", fontSize:12, color:"#c4b5fd" }}>✦ {k}</div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
