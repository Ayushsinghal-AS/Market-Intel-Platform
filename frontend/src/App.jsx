import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Backtest from "./pages/Backtest";
import StockExplorer from "./pages/StockExplorer";
import EtfScanner from "./pages/EtfScanner";
import NiftyScanner from "./pages/NiftyScanner";
import Login from "./pages/Login";
import { getToken, getUsername, clearSession } from "./auth";

const TABS = [
  { key: "dashboard", label: "Market Dashboard", Component: Dashboard },
  { key: "stocks", label: "Stock Explorer", Component: StockExplorer },
  { key: "portfolio", label: "Portfolio Analyzer", Component: Portfolio },
  { key: "etf", label: "ETF Scanner", Component: EtfScanner },
  { key: "nifty", label: "Nifty50 Scanner", Component: NiftyScanner },
  { key: "backtest", label: "Backtester", Component: Backtest },
];

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [active, setActive] = useState("dashboard");

  useEffect(() => {
    const onUnauthorized = () => setAuthed(false);
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  if (!authed) {
    return <Login onAuthenticated={() => setAuthed(true)} />;
  }

  const logout = () => {
    clearSession();
    setAuthed(false);
  };

  const ActiveComponent = TABS.find((t) => t.key === active).Component;

  return (
    <div className="min-h-screen bg-page-light dark:bg-page-dark text-ink-primary-light dark:text-ink-primary-dark">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold">Market Intelligence Platform</h1>
            <p className="text-xs text-ink-muted">Nifty 50 analytics · live via Yahoo Finance</p>
          </div>
          <nav className="flex gap-1 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                  active === tab.key
                    ? "bg-series-blue-light dark:bg-series-blue-dark text-white"
                    : "text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span>{getUsername()}</span>
            <button onClick={logout} className="px-2 py-1 rounded border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main>
        <ActiveComponent />
      </main>
    </div>
  );
}
