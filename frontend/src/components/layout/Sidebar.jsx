import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "../icons/Icon";

export const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: "home" },
  { path: "/stock", label: "Stocks", icon: "chartBar" },
  { path: "/portfolio", label: "Portfolio", icon: "briefcase" },
  { path: "/etf-scanner", label: "ETF Scanner", icon: "layers" },
  { path: "/nifty-scanner", label: "Nifty Scanner", icon: "pulse" },
  { path: "/backtest", label: "Backtest", icon: "history" },
  { path: "/calculators", label: "Calculators", icon: "calculator" },
];

const STORAGE_KEY = "mip_sidebar_collapsed";

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      localStorage.setItem(STORAGE_KEY, !v ? "1" : "0");
      return !v;
    });
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onCloseMobile} />
      )}
      <motion.aside
        animate={{ width: collapsed ? 72 : 224 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`fixed md:sticky top-0 h-screen shrink-0 z-50 md:z-10 glass-panel border-r border-black/5 dark:border-white/10 flex flex-col ${
          mobileOpen ? "left-0" : "-left-full md:left-0"
        } transition-[left] md:transition-none`}
      >
        <div className="h-16 flex items-center px-4 border-b border-black/5 dark:border-white/10 shrink-0">
          {!collapsed && <span className="font-bold text-sm truncate">Market Intel</span>}
        </div>

        <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-series-blue-light dark:bg-series-blue-dark text-white"
                    : "text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/10"
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon name={item.icon} className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={toggleCollapsed}
          className="hidden md:flex items-center justify-center h-12 border-t border-black/5 dark:border-white/10 text-ink-muted hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Icon name="chevron" className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </button>
      </motion.aside>
    </>
  );
}
