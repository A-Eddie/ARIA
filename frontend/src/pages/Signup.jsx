// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore, useToastStore } from "../store/useStore";
import { Card, Input, Btn } from "../components/ui";

export default function Signup() {
  const [company,  setCompany]  = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const { signup, loading } = useAuthStore();
  const toast = useToastStore(s => s.add);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast("Passwords do not match", "error"); return; }
    if (password.length < 8)  { toast("Password must be at least 8 characters", "error"); return; }
    const res = await signup(company, email, password);
    if (res.ok) {
      toast("Account created! Welcome to ARIA.", "success");
      navigate("/dashboard");
    } else {
      toast(res.error, "error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 30, color: "var(--white)", marginBottom: 6 }}>
            AR<span style={{ color: "var(--blue)" }}>IA</span>
          </div>
          <p style={{ color: "var(--text3)", fontSize: 14 }}>Create your company account — free to start</p>
        </div>
        <Card>
          <form onSubmit={submit}>
            <Input label="Company Name" value={company} onChange={e => setCompany(e.target.value)} placeholder="TechCorp Kenya" required />
            <Input label="Work Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hr@company.com" required />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
            <Input label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" required />
            <Btn type="submit" loading={loading} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
              Create Account →
            </Btn>
          </form>
          <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--text3)" }}>
            Already have an account? <Link to="/login" style={{ color: "var(--blue)" }}>Sign in</Link>
          </div>
        </Card>
        <p style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "var(--text4)", fontFamily: "var(--font-mono)" }}>
          No credit card required · Starter plan is free
        </p>
      </div>
    </div>
  );
}
