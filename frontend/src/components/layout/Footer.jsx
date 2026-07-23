import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { NAV_ITEMS } from "./Sidebar";

export default function Footer() {
  const [apiOnline, setApiOnline] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const check = () =>
      api
        .health()
        .then(() => !cancelled && setApiOnline(true))
        .catch(() => !cancelled && setApiOnline(false));
    check();
    const id = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <footer className="border-t border-black/5 dark:border-white/10 mt-12">
      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-ink-muted">
        <div>
          <div className="font-semibold text-ink-primary-light dark:text-ink-primary-dark mb-2">Market Intelligence Platform</div>
          <p>Nifty 50 analytics · live via Yahoo Finance. Educational tool — not investment advice.</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-1.5 h-1.5 rounded-full ${apiOnline ? "bg-status-good" : apiOnline === false ? "bg-status-critical" : "bg-ink-muted"}`} />
            API {apiOnline === null ? "checking…" : apiOnline ? "Online" : "Offline"}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="hover:underline cursor-pointer">GitHub</span>
            <span className="hover:underline cursor-pointer">Twitter</span>
            <span className="hover:underline cursor-pointer">LinkedIn</span>
          </div>
        </div>

        <div>
          <div className="font-semibold text-ink-primary-light dark:text-ink-primary-dark mb-2">Explore</div>
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.path} to={item.path} className="hover:underline w-fit">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="font-semibold text-ink-primary-light dark:text-ink-primary-dark mb-2">Disclaimer</div>
          <p>
            Data may be delayed and is provided "as is" for informational purposes only. Past performance does not
            guarantee future results. Always do your own research before investing.
          </p>
        </div>
      </div>
    </footer>
  );
}
