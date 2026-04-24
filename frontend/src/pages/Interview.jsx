// src/pages/Interview.jsx  — Candidate-facing interview portal
// All Claude calls go through the backend — zero API keys in browser
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jobsAPI, interviewAPI } from "../lib/api";
import { Spinner, ScoreRing, PillTabs, Badge, SCORE_COLOR, PRIO_COLOR } from "../components/ui";

const ROLE_CATEGORIES = [
  { category:"Engineering & Tech", color:"#3b82f6", roles:[{id:"frontend",label:"Frontend Developer",icon:"⚡"},{id:"backend",label:"Backend Engineer",icon:"🔧"},{id:"fullstack",label:"Full Stack Developer",icon:"💻"},{id:"mobile",label:"Mobile Developer",icon:"📱"},{id:"devops",label:"DevOps Engineer",icon:"🚀"},{id:"ml",label:"ML / AI Engineer",icon:"🤖"},{id:"security",label:"Cybersecurity Analyst",icon:"🛡️"},{id:"qa",label:"QA Engineer",icon:"🧪"}]},
  { category:"Data & Analytics",   color:"#8b5cf6", roles:[{id:"data",label:"Data Analyst",icon:"📊"},{id:"datasci",label:"Data Scientist",icon:"🔬"},{id:"dataeng",label:"Data Engineer",icon:"🗄️"},{id:"bi",label:"BI Developer",icon:"📈"}]},
  { category:"Design & Creative",  color:"#ec4899", roles:[{id:"designer",label:"UI/UX Designer",icon:"🎨"},{id:"graphic",label:"Graphic Designer",icon:"✏️"},{id:"motion",label:"Motion Designer",icon:"🎬"},{id:"copywriter",label:"Copywriter",icon:"✍️"},{id:"content",label:"Content Creator",icon:"🎥"}]},
  { category:"Product & Strategy", color:"#10b981", roles:[{id:"pm",label:"Product Manager",icon:"📋"},{id:"po",label:"Product Owner",icon:"🎯"},{id:"strategy",label:"Business Strategist",icon:"♟️"},{id:"scrum",label:"Scrum Master",icon:"🔄"}]},
  { category:"Marketing & Sales",  color:"#f97316", roles:[{id:"growth",label:"Growth Marketer",icon:"📣"},{id:"seo",label:"SEO Specialist",icon:"🔍"},{id:"social",label:"Social Media Manager",icon:"📲"},{id:"sales",label:"Sales Executive",icon:"💼"},{id:"pr",label:"PR Specialist",icon:"📰"}]},
  { category:"Finance & Legal",    color:"#0ea5e9", roles:[{id:"finance",label:"Financial Analyst",icon:"💰"},{id:"accountant",label:"Accountant",icon:"🧾"},{id:"lawyer",label:"Corporate Lawyer",icon:"⚖️"},{id:"compliance",label:"Compliance Officer",icon:"📜"},{id:"risk",label:"Risk Analyst",icon:"⚠️"}]},
  { category:"Operations & HR",    color:"#14b8a6", roles:[{id:"ops",label:"Operations Manager",icon:"⚙️"},{id:"hr",label:"HR Specialist",icon:"👥"},{id:"recruiter",label:"Talent Recruiter",icon:"🎯"},{id:"projectmgr",label:"Project Manager",icon:"📅"},{id:"admin",label:"Executive Assistant",icon:"🗂️"}]},
  { category:"Healthcare",         color:"#f43f5e", roles:[{id:"doctor",label:"Medical Doctor",icon:"🩺"},{id:"nurse",label:"Registered Nurse",icon:"💉"},{id:"researcher",label:"Research Scientist",icon:"🔭"},{id:"biotech",label:"Biotech Engineer",icon:"🧬"}]},
  { category:"Education",          color:"#f59e0b", roles:[{id:"teacher",label:"Teacher / Educator",icon:"🎓"},{id:"trainer",label:"Corporate Trainer",icon:"📚"},{id:"coach",label:"Life / Career Coach",icon:"🧭"}]},
];

const STAGES = { PROFILE:"profile", LIVE:"live", EVALUATING:"evaluating", DONE:"done" };

export default function Interview() {
  const { token }  = useParams();
  const navigate   = useNavigate();

  // Job info from token
  const [job,        setJob]        = useState(null);
  const [jobLoading, setJobLoading] = useState(!!token);

  // Form state
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [role,     setRole]     = useState(null);
  const [search,   setSearch]   = useState("");

  // Interview session
  const [stage,       setStage]       = useState(STAGES.PROFILE);
  const [interviewId, setInterviewId] = useState(null);
  const [candidateId, setCandidateId] = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [typing,      setTyping]      = useState(false);
  const [typingTxt,   setTypingTxt]   = useState("");

  // Results
  const [evaluation, setEvaluation] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [subTab,     setSubTab]     = useState("eval");

  const chatEnd = useRef(null);

  // Load job from token
  useEffect(() => {
    if (!token) return;
    jobsAPI.byToken(token)
      .then(r => setJob(r.data.job))
      .catch(() => {})
      .finally(() => setJobLoading(false));
  }, [token]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingTxt]);

  // Typewriter effect
  const typewriter = (text, onDone) => {
    setTyping(true); setTypingTxt(""); let i = 0;
    const speed = Math.max(8, 22 - text.length / 30);
    const iv = setInterval(() => {
      if (i < text.length) { setTypingTxt(text.slice(0, i + 1)); i++; }
      else { clearInterval(iv); setTyping(false); onDone(text); }
    }, speed);
  };

  // Start interview
  const startInterview = async () => {
    setStage(STAGES.LIVE); setSending(true);
    try {
      const payload = token
        ? { jobToken: token, candidateName: name, candidateEmail: email }
        : { jobToken: "demo", candidateName: name, candidateEmail: email };

      const res = await interviewAPI.start(payload);
      setInterviewId(res.data.interviewId);
      setCandidateId(res.data.candidateId);
      setMessages([{ role:"assistant", content: res.data.message, id: Date.now() }]);
    } catch (e) {
      alert(e.response?.data?.error || "Failed to start interview. Check backend is running.");
      setStage(STAGES.PROFILE);
    } finally { setSending(false); }
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || sending || typing) return;
    const userMsg = { role:"user", content: input.trim(), id: Date.now() };
    setMessages(p => [...p, userMsg]);
    const sent = input.trim();
    setInput(""); setSending(true);

    try {
      const res = await interviewAPI.message({ interviewId, candidateId, message: sent });
      setSending(false);

      const ariaMsg = { role:"assistant", content: res.data.message, id: Date.now() };

      if (res.data.complete) {
        setMessages(p => [...p, ariaMsg]);
        setStage(STAGES.EVALUATING);
        // Poll for evaluation result
        pollForEvaluation();
      } else {
        typewriter(res.data.message, () => {
          setMessages(p => [...p, ariaMsg]);
          setTypingTxt("");
        });
      }
    } catch (e) {
      setSending(false);
      alert(e.response?.data?.error || "Failed to send message.");
    }
  };

  // Poll backend until evaluation is ready
  const pollForEvaluation = () => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { candidatesAPI, evaluationAPI, assignmentAPI } = await import("../lib/api");
        const res = await candidatesAPI.get(candidateId);
        const c   = res.data.candidate;
        if (c.status === "evaluated" || c.status === "hired") {
          clearInterval(interval);
          setEvaluation(res.data.evaluation);
          setAssignment(res.data.assignment);
          setStage(STAGES.DONE);
        }
      } catch {}
      if (attempts > 20) {
        clearInterval(interval);
        setStage(STAGES.DONE); // timeout — show done anyway
      }
    }, 3000);
  };

  // ── PROFILE STAGE ─────────────────────────────────────────
  if (jobLoading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Spinner size={32} />
    </div>
  );

  if (stage === STAGES.PROFILE) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", justifyContent:"center", padding:"36px 20px", fontFamily:"var(--font-sans)", color:"var(--text)" }}>
      <div style={{ width:"100%", maxWidth:700 }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:36 }}>
          <div style={{ fontFamily:"var(--font-head)", fontWeight:800, fontSize:22, color:"var(--white)" }}>AR<span style={{ color:"var(--blue)" }}>IA</span></div>
          <div style={{ fontSize:11, color:"var(--text4)", fontFamily:"var(--font-mono)" }}>CANDIDATE PORTAL</div>
        </div>

        {job && (
          <div style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:10, padding:16, marginBottom:28 }}>
            <div style={{ fontSize:10, color:"var(--blue)", fontFamily:"var(--font-mono)", marginBottom:4 }}>YOU'RE APPLYING FOR</div>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--white)", marginBottom:4 }}>{job.title}</div>
            <div style={{ fontSize:12, color:"var(--text3)" }}>{job.department} · {job.location}</div>
          </div>
        )}

        <h2 style={{ fontFamily:"var(--font-head)", fontSize:"1.8rem", fontWeight:800, color:"var(--white)", marginBottom:6 }}>Tell us about yourself</h2>
        <p style={{ color:"var(--text3)", marginBottom:28, fontSize:13 }}>ARIA will conduct your interview — takes about 10 minutes from anywhere.</p>

        {/* Name + email */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:22 }}>
          <div>
            <label style={{ display:"block", fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5, fontFamily:"var(--font-mono)" }}>Full Name *</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"11px 14px", color:"var(--white)", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ display:"block", fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5, fontFamily:"var(--font-mono)" }}>Email *</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"11px 14px", color:"var(--white)", fontSize:14, outline:"none", boxSizing:"border-box" }} />
          </div>
        </div>

        {/* Role picker (only shown if no job token) */}
        {!job && (
          <div style={{ marginBottom:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <label style={{ fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"var(--font-mono)" }}>
                Applying For {role && <span style={{ color:"var(--blue)" }}>— {role.label}</span>}
              </label>
              {role && <span onClick={()=>setRole(null)} style={{ fontSize:11, color:"var(--text3)", cursor:"pointer" }}>Clear</span>}
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search roles..." style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"9px 13px", color:"var(--white)", fontSize:12, outline:"none", boxSizing:"border-box", marginBottom:14 }} />
            <div style={{ maxHeight:340, overflowY:"auto" }}>
              {ROLE_CATEGORIES.map(cat => {
                const roles = cat.roles.filter(r => !search || r.label.toLowerCase().includes(search.toLowerCase()));
                if (!roles.length) return null;
                return (
                  <div key={cat.category} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:9, color:cat.color, fontFamily:"var(--font-mono)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:7, display:"flex", alignItems:"center", gap:7 }}>
                      <div style={{ height:1, flex:1, background:`${cat.color}25` }}/>{cat.category}<div style={{ height:1, flex:1, background:`${cat.color}25` }}/>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5 }}>
                      {roles.map(r => {
                        const sel = role?.id === r.id;
                        return (
                          <div key={r.id} onClick={()=>setRole(r)} style={{ background:sel?`${cat.color}12`:"rgba(255,255,255,0.03)", border:`1px solid ${sel?cat.color:"rgba(255,255,255,0.06)"}`, borderRadius:7, padding:"8px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:7, transition:"all 0.12s" }}>
                            <span style={{ fontSize:14 }}>{r.icon}</span>
                            <span style={{ fontSize:11, color:sel?"var(--white)":"var(--text2)", fontWeight:sel?600:400, lineHeight:1.3 }}>{r.label}</span>
                            {sel && <span style={{ marginLeft:"auto", color:cat.color, fontSize:11 }}>✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={startInterview}
          disabled={!name.trim() || !email.trim() || sending || (!job && !role)}
          style={{
            width:"100%", background: name.trim()&&email.trim()&&(job||role) ? "var(--blue)" : "rgba(255,255,255,0.06)",
            color: name.trim()&&email.trim()&&(job||role) ? "#fff" : "var(--text4)",
            border:"none", borderRadius:9, padding:"14px", fontSize:14, fontWeight:700,
            cursor: name.trim()&&email.trim()&&(job||role) ? "pointer" : "not-allowed",
            fontFamily:"var(--font-sans)", transition:"all 0.15s",
          }}
        >
          {sending ? "Starting..." : job ? `Begin Interview — ${job.title} →` : role ? `Begin Interview — ${role.label} →` : "Select a role to continue"}
        </button>
      </div>
    </div>
  );

  // ── LIVE STAGE ────────────────────────────────────────────
  if (stage === STAGES.LIVE) return (
    <div style={{ height:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", fontFamily:"var(--font-sans)", color:"var(--text)" }}>
      <div style={{ padding:"12px 22px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12, background:"rgba(7,8,12,0.95)", backdropFilter:"blur(20px)" }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,var(--blue),var(--green))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🤖</div>
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:"var(--white)" }}>ARIA — AI HR Director</div>
          <div style={{ fontSize:11, color:"var(--green)", display:"flex", alignItems:"center", gap:5 }}>
            <span className="animate-pulse" style={{ width:5, height:5, borderRadius:"50%", background:"var(--green)" }}/> Live Interview · {job?.title || role?.label}
          </div>
        </div>
        <div style={{ marginLeft:"auto", fontSize:12, color:"var(--text3)" }}>Candidate: <strong style={{ color:"var(--white)" }}>{name}</strong></div>
      </div>

      <div style={{ flex:1, overflow:"auto", padding:"22px", display:"flex", flexDirection:"column", gap:12 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:9, alignItems:"flex-end" }}>
            {m.role==="assistant" && <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,var(--blue),var(--green))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0 }}>🤖</div>}
            <div style={{ maxWidth:"72%", padding:"11px 15px", borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px", background:m.role==="user"?"var(--blue)":"rgba(255,255,255,0.07)", border:m.role==="assistant"?"1px solid rgba(255,255,255,0.07)":"none", fontSize:13, lineHeight:1.65, color:"var(--white)" }}>
              {m.content}
            </div>
            {m.role==="user" && <div style={{ width:28, height:28, borderRadius:"50%", background:"#1f2937", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{name[0]}</div>}
          </div>
        ))}
        {(sending || typing) && (
          <div style={{ display:"flex", gap:9, alignItems:"flex-end" }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,var(--blue),var(--green))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>🤖</div>
            <div style={{ padding:"11px 15px", borderRadius:"14px 14px 14px 4px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.07)", fontSize:13, color:"var(--white)", lineHeight:1.65 }}>
              {typing ? typingTxt : <span style={{ display:"flex", gap:3, alignItems:"center" }}>{[0,1,2].map(i=><span key={i} style={{ width:5, height:5, borderRadius:"50%", background:"var(--blue)", animation:`bounce 1.4s ${i*0.2}s infinite` }}/>)}</span>}
            </div>
          </div>
        )}
        <div ref={chatEnd}/>
      </div>

      <div style={{ padding:"12px 18px", borderTop:"1px solid var(--border)", background:"rgba(7,8,12,0.95)" }}>
        <div style={{ display:"flex", gap:9 }}>
          <input
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()}
            placeholder="Type your answer..."
            disabled={sending||typing}
            style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"12px 15px", color:"var(--white)", fontSize:13, outline:"none" }}
          />
          <button onClick={sendMessage} disabled={sending||typing||!input.trim()} style={{ background:!input.trim()||sending||typing?"rgba(255,255,255,0.05)":"var(--blue)", color:"#fff", border:"none", borderRadius:9, padding:"12px 20px", cursor:"pointer", fontSize:17, transition:"all 0.15s" }}>➤</button>
        </div>
        <div style={{ fontSize:11, color:"var(--text4)", marginTop:6, textAlign:"center", fontFamily:"var(--font-mono)" }}>Press Enter to send · Your answers are being evaluated in real time</div>
      </div>
    </div>
  );

  // ── EVALUATING STAGE ──────────────────────────────────────
  if (stage === STAGES.EVALUATING) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"var(--font-sans)" }}>
      <span className="animate-float" style={{ fontSize:48 }}>🤖</span>
      <div style={{ fontFamily:"var(--font-head)", fontSize:"1.5rem", color:"var(--white)" }}>ARIA is evaluating...</div>
      <div style={{ color:"var(--text3)", fontSize:13, fontFamily:"var(--font-mono)" }}>Analysing your responses and building your personalised assignment</div>
      <Spinner size={24} />
    </div>
  );

  // ── DONE STAGE ────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", justifyContent:"center", padding:"36px 20px", fontFamily:"var(--font-sans)", color:"var(--text)" }}>
      <div style={{ width:"100%", maxWidth:640 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:44, marginBottom:10 }}>🎉</div>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:"1.9rem", fontWeight:800, color:"var(--white)", marginBottom:5 }}>Interview Complete!</h2>
          <p style={{ color:"var(--text3)", fontSize:13 }}>ARIA has evaluated your performance, {name}.</p>
        </div>

        {/* Tab switch */}
        <div style={{ marginBottom:20 }}>
          <PillTabs
            tabs={[{ id:"eval", label:"📊 Evaluation" }, { id:"assign", label:"📋 Assignment" }]}
            active={subTab}
            onChange={setSubTab}
          />
        </div>

        {/* Evaluation */}
        {subTab === "eval" && evaluation && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)", borderRadius:12, padding:22, textAlign:"center" }}>
                <div style={{ fontSize:10, color:"var(--text3)", fontFamily:"var(--font-mono)", marginBottom:10 }}>YOUR SCORE</div>
                <div style={{ display:"flex", justifyContent:"center" }}><ScoreRing score={evaluation.score} size={90} /></div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)", borderRadius:12, padding:22, textAlign:"center" }}>
                <div style={{ fontSize:10, color:"var(--text3)", fontFamily:"var(--font-mono)", marginBottom:10 }}>VERDICT</div>
                <div style={{ fontFamily:"var(--font-head)", fontSize:"1.2rem", fontWeight:800, color:SCORE_COLOR(evaluation.score), marginBottom:10 }}>{evaluation.verdict}</div>
                <Badge label={evaluation.hire_recommendation} color={SCORE_COLOR(evaluation.score)} />
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              <div style={{ background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:10, padding:16 }}>
                <div style={{ fontSize:10, color:"var(--green)", fontFamily:"var(--font-mono)", marginBottom:9 }}>✓ STRENGTHS</div>
                {evaluation.strengths?.map((s,i)=><div key={i} style={{ fontSize:12, color:"#d1fae5", paddingLeft:8, borderLeft:"2px solid var(--green)", marginBottom:6, lineHeight:1.5 }}>{s}</div>)}
              </div>
              <div style={{ background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.15)", borderRadius:10, padding:16 }}>
                <div style={{ fontSize:10, color:"var(--yellow)", fontFamily:"var(--font-mono)", marginBottom:9 }}>△ AREAS TO GROW</div>
                {evaluation.gaps?.map((g,i)=><div key={i} style={{ fontSize:12, color:"#fef3c7", paddingLeft:8, borderLeft:"2px solid var(--yellow)", marginBottom:6, lineHeight:1.5 }}>{g}</div>)}
              </div>
            </div>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)", borderRadius:10, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:10, color:"var(--text3)", fontFamily:"var(--font-mono)", marginBottom:7 }}>ARIA'S ASSESSMENT</div>
              <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.7, fontStyle:"italic" }}>"{evaluation.summary}"</p>
            </div>
            {assignment && <button onClick={()=>setSubTab("assign")} style={{ width:"100%", background:"var(--green)", color:"#fff", border:"none", borderRadius:9, padding:"13px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"var(--font-sans)" }}>View Your Work Assignment →</button>}
          </div>
        )}
        {subTab === "eval" && !evaluation && (
          <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>
            <Spinner size={28} />
            <div style={{ marginTop:12 }}>Evaluation loading...</div>
          </div>
        )}

        {/* Assignment */}
        {subTab === "assign" && assignment && (
          <div>
            <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:9, padding:14, marginBottom:14, textAlign:"center" }}>
              <p style={{ fontSize:13, color:"#6ee7b7", fontStyle:"italic" }}>"{assignment.welcome_message}"</p>
            </div>
            <div style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:9, padding:13, marginBottom:14, display:"flex", gap:11, alignItems:"center" }}>
              <span style={{ fontSize:22 }}>👩‍💼</span>
              <div><div style={{ fontSize:10, color:"var(--blue)", fontFamily:"var(--font-mono)" }}>YOUR MENTOR</div><div style={{ fontSize:13, fontWeight:600, color:"var(--white)" }}>{assignment.mentor}</div></div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:"var(--text3)", fontFamily:"var(--font-mono)", marginBottom:9 }}>ONBOARDING CHECKLIST</div>
              {assignment.onboarding_tasks?.map((t,i)=>(
                <div key={i} style={{ display:"flex", gap:11, padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", alignItems:"flex-start" }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:PRIO_COLOR(t.priority), flexShrink:0, marginTop:5 }}/>
                  <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600, color:"var(--white)" }}>{t.task}</div><div style={{ fontSize:11, color:"var(--text3)" }}>{t.description}</div></div>
                  <div style={{ textAlign:"right" }}><Badge label={t.priority} color={PRIO_COLOR(t.priority)}/><div style={{ fontSize:10, color:"var(--text4)", marginTop:3 }}>{t.due}</div></div>
                </div>
              ))}
            </div>
            <div style={{ background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:9, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:10, color:"var(--green)", fontFamily:"var(--font-mono)", marginBottom:7 }}>🚀 FIRST PROJECT</div>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--white)", marginBottom:5 }}>{assignment.first_project?.title}</div>
              <p style={{ fontSize:12, color:"var(--text2)", lineHeight:1.6, marginBottom:10 }}>{assignment.first_project?.description}</p>
              {assignment.first_project?.deliverables?.map((d,i)=><div key={i} style={{ fontSize:12, color:"var(--text2)", paddingLeft:10, borderLeft:"2px solid var(--green)", marginBottom:4 }}>◦ {d}</div>)}
              <div style={{ display:"flex", gap:10, marginTop:10, flexWrap:"wrap", alignItems:"center" }}>
                <span style={{ fontSize:11, color:"var(--yellow)" }}>⏰ {assignment.first_project?.deadline}</span>
                {assignment.first_project?.tools?.map((t,i)=><span key={i} style={{ background:"rgba(255,255,255,0.07)", borderRadius:100, padding:"2px 9px", fontSize:10, color:"var(--text2)" }}>{t}</span>)}
              </div>
            </div>
            <button onClick={()=>navigate("/")} style={{ width:"100%", background:"rgba(255,255,255,0.06)", color:"var(--text2)", border:"1px solid var(--border)", borderRadius:9, padding:"13px", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"var(--font-sans)" }}>
              Back to Home
            </button>
          </div>
        )}
        {subTab === "assign" && !assignment && (
          <div style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>
            <div style={{ fontSize:28, marginBottom:12 }}>📋</div>
            <div>Assignment will be generated after evaluation completes.</div>
          </div>
        )}
      </div>
    </div>
  );
}
