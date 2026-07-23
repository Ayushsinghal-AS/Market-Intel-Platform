import { useEffect, useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import Login from "./pages/Login";
import { api } from "./api";
import { getToken, getUsername, clearSession, setSession } from "./auth";

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [autoLoginFailed, setAutoLoginFailed] = useState(false);

  useEffect(() => {
    const onUnauthorized = () => setAuthed(false);
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  // Demo mode: skip the login screen entirely by signing in as the guest
  // account automatically. Falls back to the real login form if the backend
  // is unreachable or guest login is disabled.
  useEffect(() => {
    if (authed) return;
    api
      .guestLogin()
      .then((res) => {
        setSession(res.access_token, res.username);
        setAuthed(true);
      })
      .catch(() => setAutoLoginFailed(true));
  }, [authed]);

  if (!authed) {
    if (autoLoginFailed) {
      return <Login onAuthenticated={() => setAuthed(true)} />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-light dark:bg-page-dark text-ink-muted text-sm">
        Loading…
      </div>
    );
  }

  const logout = () => {
    clearSession();
    setAuthed(false);
  };

  return <AppRoutes username={getUsername()} onLogout={logout} />;
}
