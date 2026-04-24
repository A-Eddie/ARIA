// src/pages/Jobs.jsx
import { useEffect, useState } from "react";
import { jobsAPI, emailAPI } from "../lib/api";
import { useToastStore } from "../store/useStore";
import { Card, Badge, Btn, Modal, Input, Textarea, Select, SectionHead, Empty, Spinner, STATUS_COLOR } from "../components/ui";

function ago(d) {
  if (!d?._seconds) return d ? new Date(d).toLocaleDateString() : "";
  return new Date(d._seconds * 1000).toLocaleDateString();
}

const INVITE_INIT = { name: "", email: "" };

export default function Jobs() {
  const toast = useToastStore(s => s.add);
  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showLink,  setShowLink]  = useState(null);
  const [showInvite,setShowInvite]= useState(null);
  const [copied,    setCopied]    = useState(false);
  const [invite,    setInvite]    = useState(INVITE_INIT);
  const [form, setForm] = useState({ title:"", department:"", location:"", type:"Full-time", description:"", skills:"", customQuestions:"" });

  const load = async () => {
    try {
      const res = await jobsAPI.list();
      setJobs(res.data.jobs);
    } catch { toast("Failed to load jobs", "error"); }
    finally  { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title || !form.department) { toast("Title and department are required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        skills:          form.skills.split(",").map(s => s.trim()).filter(Boolean),
        customQuestions: form.customQuestions.split("\n").map(s => s.trim()).filter(Boolean),
      };
      await jobsAPI.create(payload);
      toast("Job posting created!", "success");
      setShowNew(false);
      setForm({ title:"", department:"", location:"", type:"Full-time", description:"", skills:"", customQuestions:"" });
      load();
    } catch (e) { toast(e.response?.data?.error || "Failed to create job", "error"); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (job) => {
    try {
      await jobsAPI.update(job.id, { status: job.status === "open" ? "closed" : "open" });
      toast(`Job ${job.status === "open" ? "closed" : "reopened"}`, "success");
      load();
    } catch { toast("Failed to update job", "error"); }
  };

  const deleteJob = async (id) => {
    if (!confirm("Delete this job posting?")) return;
    try {
      await jobsAPI.delete(id);
      toast("Job deleted", "success");
      load();
    } catch { toast("Failed to delete job", "error"); }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/interview/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendInvite = async () => {
    if (!invite.name || !invite.email) { toast("Name and email required", "error"); return; }
    setSaving(true);
    try {
      await emailAPI.sendInvite({ candidateName: invite.name, candidateEmail: invite.email, jobId: showInvite.id });
      toast(`Invite sent to ${invite.email}`, "success");
      setShowInvite(null);
      setInvite(INVITE_INIT);
    } catch (e) { toast(e.response?.data?.error || "Failed to send invite", "error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}><Spinner size={32} /></div>;

  return (
    <div className="animate-fadeUp">
      <SectionHead
        title="Job Postings"
        subtitle={`${jobs.filter(j=>j.status==="open").length} open · ${jobs.filter(j=>j.status==="closed").length} closed`}
        action="+ Post New Role"
        onAction={() => setShowNew(true)}
      />

      {jobs.length === 0 && <Empty icon="💼" title="No job postings yet" subtitle="Create your first role to start interviewing candidates" action="+ Post New Role" onAction={() => setShowNew(true)} />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {jobs.map(j => (
          <Card key={j.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--white)", marginBottom: 8, fontFamily: "var(--font-head)" }}>{j.title}</h3>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Badge label={j.department} color="var(--blue)" />
                  <Badge label={j.location}   color="#6b7280" />
                  <Badge label={j.type}       color="var(--purple)" />
                </div>
              </div>
              <Badge label={j.status} color={STATUS_COLOR[j.status]} />
            </div>
            {j.description && <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12, lineHeight: 1.6 }}>{j.description}</p>}
            {j.skills?.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
                {j.skills.map(s => <span key={s} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 100, padding: "2px 9px", fontSize: 11, color: "var(--text2)" }}>{s}</span>)}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: 12, color: "var(--text3)" }}>
                <span style={{ color: "var(--blue)", fontWeight: 600 }}>{j.candidatesCount || 0}</span> candidates · {ago(j.createdAt)}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn variant="secondary" size="sm" onClick={() => { setShowLink(j); setCopied(false); }}>🔗 Link</Btn>
                <Btn variant="ghost"     size="sm" onClick={() => setShowInvite(j)}>✉ Invite</Btn>
                <Btn variant={j.status === "open" ? "danger" : "success"} size="sm" onClick={() => toggleStatus(j)}>
                  {j.status === "open" ? "Close" : "Reopen"}
                </Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* New Job Modal */}
      <Modal show={showNew} onClose={() => setShowNew(false)} title="Post New Role" width={600}>
        <Input label="Job Title *"   value={form.title}      onChange={e => setForm(p=>({...p,title:e.target.value}))}      placeholder="e.g. Senior React Developer" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input label="Department *" value={form.department} onChange={e => setForm(p=>({...p,department:e.target.value}))} placeholder="Engineering" />
          <Input label="Location"     value={form.location}   onChange={e => setForm(p=>({...p,location:e.target.value}))}   placeholder="Nairobi / Remote" />
        </div>
        <Select label="Type" value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))} options={["Full-time","Part-time","Contract","Internship"].map(t=>({value:t,label:t}))} />
        <Textarea label="Description" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Brief role description..." rows={3} />
        <Input label="Required Skills (comma-separated)" value={form.skills} onChange={e => setForm(p=>({...p,skills:e.target.value}))} placeholder="React, TypeScript, CSS" />
        <Textarea label="Custom Interview Questions (one per line — optional)" value={form.customQuestions} onChange={e => setForm(p=>({...p,customQuestions:e.target.value}))} placeholder={"Describe your experience with X.\nHow would you handle Y?"} rows={3} />
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={create} loading={saving} style={{ flex:1, justifyContent:"center" }}>Create Posting</Btn>
          <Btn variant="secondary" onClick={() => setShowNew(false)}>Cancel</Btn>
        </div>
      </Modal>

      {/* Invite Link Modal */}
      <Modal show={!!showLink} onClose={() => setShowLink(null)} title={`Candidate Link — ${showLink?.title}`}>
        <p style={{ fontSize:13, color:"var(--text2)", marginBottom:18, lineHeight:1.6 }}>
          Share this unique link with candidates. ARIA will automatically conduct their interview for <strong style={{color:"var(--white)"}}>{showLink?.title}</strong>.
        </p>
        <div style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:9, padding:"13px 15px", fontFamily:"var(--font-mono)", fontSize:12, color:"#93c5fd", wordBreak:"break-all", marginBottom:18 }}>
          {showLink && `${window.location.origin}/interview/${showLink.token}`}
        </div>
        <Btn onClick={() => copyLink(showLink?.token)} style={{ width:"100%", justifyContent:"center" }}>
          {copied ? "✓ Copied!" : "📋 Copy Link"}
        </Btn>
      </Modal>

      {/* Email Invite Modal */}
      <Modal show={!!showInvite} onClose={() => setShowInvite(null)} title={`Email Invite — ${showInvite?.title}`}>
        <p style={{ fontSize:13, color:"var(--text2)", marginBottom:18, lineHeight:1.6 }}>
          Send a personalised interview invitation directly to the candidate's email.
        </p>
        <Input label="Candidate Name"  value={invite.name}  onChange={e=>setInvite(p=>({...p,name:e.target.value}))}  placeholder="Jane Doe" />
        <Input label="Candidate Email" type="email" value={invite.email} onChange={e=>setInvite(p=>({...p,email:e.target.value}))} placeholder="jane@email.com" />
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={sendInvite} loading={saving} style={{ flex:1, justifyContent:"center" }}>Send Invite ✉</Btn>
          <Btn variant="secondary" onClick={() => setShowInvite(null)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  );
}
