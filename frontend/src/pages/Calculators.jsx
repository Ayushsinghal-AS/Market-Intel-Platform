import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { path: "sip", label: "SIP" },
  { path: "lumpsum", label: "Lumpsum" },
  { path: "cagr", label: "CAGR" },
  { path: "options-payoff", label: "Options Payoff" },
];

export default function Calculators() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">Financial Calculators</h2>
      <div className="flex gap-1 flex-wrap">
        {TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `text-sm px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? "bg-series-blue-light dark:bg-series-blue-dark text-white"
                  : "text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/10"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
