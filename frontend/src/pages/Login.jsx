import { useState } from "react";
import { api } from "../api";
import { setSession } from "../auth";

export default function Login({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = mode === "login" ? await api.login(username, password) : await api.register(username, password);
      setSession(res.access_token, res.username);
      onAuthenticated();
    } catch (err) {
      setError(mode === "login" ? "Invalid username or password." : "Could not register (username may be taken).");
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.guestLogin();
      setSession(res.access_token, res.username);
      onAuthenticated();
    } catch (err) {
      setError("Guest login is unavailable right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page-light dark:bg-page-dark px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-ink-primary-light dark:text-ink-primary-dark">Market Intelligence Platform</h1>
          <p className="text-xs text-ink-muted mt-1">Nifty 50 analytics · live via Yahoo Finance</p>
        </div>
        <form
          onSubmit={submit}
          className="rounded-lg border border-black/10 dark:border-white/10 bg-surface-light dark:bg-surface-dark p-6 space-y-4"
        >
          <h2 className="text-sm font-semibold text-ink-primary-light dark:text-ink-primary-dark">
            {mode === "login" ? "Log in" : "Create an account"}
          </h2>
          <input
            autoFocus
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
          />
          {error && <div className="text-status-critical text-xs">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm px-3 py-2 rounded bg-series-blue-light dark:bg-series-blue-dark text-white disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Register"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full text-xs text-ink-muted hover:underline"
          >
            {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
          </button>
          <div className="flex items-center gap-2 text-[10px] text-ink-muted uppercase tracking-wide">
            <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
            or
            <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
          </div>
          <button
            type="button"
            onClick={continueAsGuest}
            disabled={loading}
            className="w-full text-sm px-3 py-2 rounded border border-black/10 dark:border-white/10 text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
          >
            Continue as Guest
          </button>
        </form>
      </div>
    </div>
  );
}
