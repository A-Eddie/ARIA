// src/components/AppShell.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useStore";

const NAV = [
  { to: "/dashboard",            icon: "⬡", label: "Dashboard" },
  { to: "/dashboard/jobs",       icon: "💼", label: "Jobs" },
  { to: "/dashboard/candidates", icon: "👤", label: "Candidates" },
  { to: "/dashboard/reports",    icon: "📊", label: "Reports" },
  { to: "/dashboard/settings",   icon: "⚙️", label: "Settings" },
];

export default function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const used  = user?.interviewsUsed  || 0;
  const limit = user?.interviewsLimit || 10;
  const pct   = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{
        width: 216, flexShrink: 0,
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        padding: "18px 10px", gap: 3,
        background: "rgba(255,255,255,0.01)",
      }}>
        {/* Logo */}
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 22, color: "var(--white)", padding: "4px 10px", marginBottom: 24 }}>
          AR<span style={{ color: "var(--blue)" }}>IA</span>
        </div>

        {/* Nav links */}
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/dashboard"}
            style={({ isActive }) => ({
              background:  isActive ? "rgba(59,130,246,0.1)"  : "transparent",
              border:      `1px solid ${isActive ? "rgba(59,130,246,0.25)" : "transparent"}`,
              color:       isActive ? "var(--blue)" : "var(--text3)",
              borderRadius: 9, padding: "9px 14px",
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              textDecoration: "none", transition: "all 0.12s",
            })}
          >
            <span style={{ fontSize: 15 }}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Usage meter */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border)",
          borderRadius: 9, padding: "11px 12px", marginBottom: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text4)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>
            <span>INTERVIEWS</span>
            <span>{used}/{limit}</span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pct > 80 ? "#f59e0b" : "var(--blue)", borderRadius: 100, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: 10, color: "var(--text4)", marginTop: 5, fontFamily: "var(--font-mono)", textTransform: "capitalize" }}>
            {user?.plan || "starter"} plan
          </div>
        </div>

        {/* Company / user */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", borderTop: "1px solid var(--border)" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {(user?.companyName || "A")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.companyName || "Company"}
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)" }}>HR Admin</div>
          </div>
          <button onClick={handleLogout} title="Sign out" style={{ background: "none", border: "none", color: "var(--text4)", cursor: "pointer", fontSize: 16, padding: 2, transition: "color 0.15s" }}>
            ⏏
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>
        <Outlet />
      </main>
    </div>
  );
}
