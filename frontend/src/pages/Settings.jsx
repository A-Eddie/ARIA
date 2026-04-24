// src/pages/Settings.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { companyAPI, billingAPI } from "../lib/api";
import { useAuthStore, useToastStore } from "../store/useStore";
import { Card, Input, Btn, SectionHead, ProgressBar } from "../components/ui";

export default function Settings() {
  const { user, logout, refreshUser } = useAuthStore();
  const toast    = useToastStore(s => s.add);
  const navigate = useNavigate();
  const [name,    setName]    = useState(user?.companyName || "");
  const [email,   setEmail]   = useState(user?.email || "");
  const [saving,  setSaving]  = useState(false);
  const [billing, setBilling] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await companyAPI.update({ name });
      await refreshUser();
      toast("Company profile saved", "success");
    } catch { toast("Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const upgradePlan = async (plan) => {
    setBilling(true);
    try {
      const res = await billingAPI.createSession(plan);
      window.location.href = res.data.url;
    } catch (e) {
      toast(e.response?.data?.error || "Billing not configured in demo", "error");
    } finally { setBilling(false); }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const used  = user?.interviewsUsed  || 0;
  const limit = user?.interviewsLimit || 10;

  return (
    <div className="animate-fadeUp" style={{ maxWidth: 640 }}>
      <SectionHead title="Settings" subtitle="Manage your account and ARIA preferences" />

      {/* Company profile */}
      <Card style={{ marginBottom:18 }}>
        <div style={{ fontFamily:"var(--font-head)", fontSize:14, fontWeight:700, color:"var(--white)", marginBottom:18 }}>Company Profile</div>
        <Input label="Company Name" value={name}  onChange={e=>setName(e.target.value)} />
        <Input label="Email"        value={email} onChange={()=>{}} style={{ opacity:0.6 }} />
        <p style={{ fontSize:11, color:"var(--text4)", marginBottom:14, fontFamily:"var(--font-mono)" }}>Email changes require re-authentication via Firebase console</p>
        <Btn onClick={saveProfile} loading={saving}>Save Changes</Btn>
      </Card>

      {/* ARIA preferences */}
      <Card style={{ marginBottom:18 }}>
        <div style={{ fontFamily:"var(--font-head)", fontSize:14, fontWeight:700, color:"var(--white)", marginBottom:18 }}>ARIA Interview Preferences</div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, fontFamily:"var(--font-mono)" }}>Interview Length</label>
          <select defaultValue="standard" style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"11px 14px", color:"var(--white)", fontSize:13, outline:"none" }}>
            <option value="short">Short — 4–5 questions</option>
            <option value="standard">Standard — 6–7 questions</option>
            <option value="extended">Extended — 8–10 questions</option>
          </select>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8, fontFamily:"var(--font-mono)" }}>Question Focus</div>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {["Behavioral","Technical","Situational","Cultural Fit"].map(q=>(
              <button key={q} style={{ background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.2)", color:"#93c5fd", borderRadius:100, padding:"5px 14px", fontSize:12, cursor:"pointer" }}>{q}</button>
            ))}
          </div>
        </div>
        <Btn variant="secondary" onClick={()=>toast("Preferences saved","success")}>Save Preferences</Btn>
      </Card>

      {/* Plan */}
      <Card style={{ marginBottom:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:14, fontWeight:700, color:"var(--white)", marginBottom:4 }}>Current Plan</div>
            <div style={{ fontSize:13, color:"var(--text3)", textTransform:"capitalize" }}>{user?.plan || "starter"} Plan</div>
          </div>
          <div style={{ textAlign:"right", fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text3)" }}>
            {used}/{limit} interviews used
          </div>
        </div>
        <ProgressBar value={used} max={limit} color={used/limit > 0.8 ? "var(--yellow)" : "var(--blue)"} height={5} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:18 }}>
          {[
            { id:"growth",     label:"Growth — $79/mo",     sub:"50 interviews/mo" },
            { id:"enterprise", label:"Enterprise — $199/mo", sub:"Unlimited" },
          ].map(p => (
            <Btn key={p.id} variant="secondary" size="sm" loading={billing} onClick={()=>upgradePlan(p.id)} style={{ flexDirection:"column", height:"auto", padding:"10px", textAlign:"center" }}>
              <span>{p.label}</span>
              <span style={{ fontSize:10, color:"var(--text4)", fontWeight:400 }}>{p.sub}</span>
            </Btn>
          ))}
          <Btn variant="ghost" size="sm">Manage Billing</Btn>
        </div>
      </Card>

      {/* Danger zone */}
      <Card style={{ borderColor:"rgba(239,68,68,0.2)" }}>
        <div style={{ fontFamily:"var(--font-head)", fontSize:14, fontWeight:700, color:"var(--red)", marginBottom:6 }}>Danger Zone</div>
        <p style={{ color:"var(--text3)", fontSize:13, marginBottom:16 }}>These actions are permanent and cannot be undone.</p>
        <div style={{ display:"flex", gap:10 }}>
          <Btn variant="danger" size="sm" onClick={handleLogout}>Sign Out</Btn>
          <Btn variant="danger" size="sm" onClick={()=>toast("Contact support to delete your account","error")}>Delete Account</Btn>
        </div>
      </Card>
    </div>
  );
}
