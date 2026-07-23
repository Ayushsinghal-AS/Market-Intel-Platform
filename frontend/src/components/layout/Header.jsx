import { useState } from "react";
import GlobalSearch from "../search/GlobalSearch";
import IndexTickerMarquee from "./IndexTickerMarquee";
import LiveMarketBadge from "./LiveMarketBadge";
import ThemeToggle from "./ThemeToggle";
import Icon from "../icons/Icon";

export default function Header({ onToggleMobileSidebar }) {
  const [bellOpen, setBellOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 glass-panel">
      <div className="h-16 px-4 flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Toggle sidebar"
        >
          <Icon name="menu" className="w-5 h-5" />
        </button>

        <GlobalSearch className="max-w-xs" />

        <LiveMarketBadge />

        <IndexTickerMarquee />

        <div className="ml-auto flex items-center gap-1 shrink-0">
          <div className="relative">
            <button
              onClick={() => setBellOpen((v) => !v)}
              aria-label="Notifications"
              className="w-9 h-9 flex items-center justify-center rounded-full text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Icon name="bell" className="w-5 h-5" />
            </button>
            {bellOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-card p-3 text-xs text-ink-muted shadow-lg">
                No notifications yet.
              </div>
            )}
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
