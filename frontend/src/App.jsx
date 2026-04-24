// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore, useToastStore } from "./store/useStore";
import { ToastContainer } from "./components/ui";

// Pages
import LandingPage    from "./pages/Landing";
import LoginPage      from "./pages/Login";
import SignupPage     from "./pages/Signup";
import DashboardPage  from "./pages/Dashboard";
import JobsPage       from "./pages/Jobs";
import CandidatesPage from "./pages/Candidates";
import CandidatePage  from "./pages/Candidate";
import ReportsPage    from "./pages/Reports";
import SettingsPage   from "./pages/Settings";
import InterviewPage  from "./pages/Interview";
import AppShell       from "./components/AppShell";

// ── Protected route wrapper ───────────────────────────────────
function Protected({ children }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { toasts, remove } = useToastStore();

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/"          element={<LandingPage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/signup"    element={<SignupPage />} />
        <Route path="/interview/:token" element={<InterviewPage />} />

        {/* Protected — wrapped in AppShell sidebar layout */}
        <Route path="/dashboard" element={<Protected><AppShell /></Protected>}>
          <Route index                    element={<DashboardPage />} />
          <Route path="jobs"              element={<JobsPage />} />
          <Route path="candidates"        element={<CandidatesPage />} />
          <Route path="candidates/:id"    element={<CandidatePage />} />
          <Route path="reports"           element={<ReportsPage />} />
          <Route path="settings"          element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer toasts={toasts} remove={remove} />
    </>
  );
}
