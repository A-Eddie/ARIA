// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore, useToastStore } from "../store/useStore";
import { Card, Input, Btn } from "../components/ui";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuthStore();
  const toast = useToastStore(s => s.add);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (res.ok) {
      toast("Welcome back!", "success");
      navigate("/dashboard");
    } else {
      toast(res.error, "error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 30, color: "var(--white)", marginBottom: 6 }}>
            AR<span style={{ color: "var(--blue)" }}>IA</span>
          </div>
          <p style={{ color: "var(--text3)", fontSize: 14 }}>Sign in to your HR dashboard</p>
        </div>
        <Card>
          <form onSubmit={submit}>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hr@company.com" required />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            {error && <p style={{ color: "var(--red)", fontSize: 12, marginBottom: 12 }}>{error}</p>}
            <Btn type="submit" loading={loading} style={{ width: "100%", justifyContent: "center" }}>
              Sign In →
            </Btn>
          </form>
          <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--text3)" }}>
            No account? <Link to="/signup" style={{ color: "var(--blue)" }}>Sign up free</Link>
          </div>
        </Card>
        <p style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "var(--text4)", fontFamily: "var(--font-mono)" }}>
          DEMO → hr@techcorp.co.ke / demo1234
        </p>
      </div>
    </div>
  );
}
