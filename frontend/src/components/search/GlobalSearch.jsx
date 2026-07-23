import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NIFTY_TICKERS } from "../../data/niftyTickers";
import { api } from "../../api";
import Icon from "../icons/Icon";

const MAX_RESULTS = 5;

function score(entry, q) {
  const ticker = entry.ticker.replace(".NS", "").toLowerCase();
  const name = entry.name.toLowerCase();
  if (ticker === q) return 100;
  if (ticker.startsWith(q)) return 90;
  if (name.startsWith(q)) return 80;
  if (name.split(/\s+/).some((word) => word.startsWith(q))) return 60;
  if (ticker.includes(q) || name.includes(q)) return 40;
  return 0;
}

function fuzzyMatch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return NIFTY_TICKERS.map((entry) => ({ entry, s: score(entry, q) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, MAX_RESULTS)
    .map((r) => r.entry);
}

function fmt(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-IN");
}

export default function GlobalSearch({ className = "" }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [overviews, setOverviews] = useState({});
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const found = fuzzyMatch(query);
    setMatches(found);
    setActiveIndex(found.length || query.trim() ? 0 : -1);
    if (!found.length) return;

    const timer = setTimeout(() => {
      Promise.all(
        found.map((entry) =>
          api
            .stockOverview(entry.ticker)
            .then((data) => [entry.ticker, data])
            .catch(() => [entry.ticker, null])
        )
      ).then((pairs) => {
        setOverviews((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // The dropdown above only ever covers the ~50 NIFTY50 names in
  // niftyTickers.js -- anything outside that list (a smaller-cap stock, a
  // slightly different name spelling) would otherwise show no suggestions
  // and Enter would do nothing. This always-present trailing row hands the
  // raw query straight to /stock/:ticker, which resolves it server-side via
  // resolve_ticker (ticker guess, tickermap.csv name lookup, or a direct
  // yfinance-valid symbol) -- the same fallback the /stock landing page uses.
  const trimmedQuery = query.trim();
  const items = trimmedQuery ? [...matches, { isGeneric: true, query: trimmedQuery }] : matches;

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const goTo = (ticker) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/stock/${ticker}`);
  };

  const onKeyDown = (e) => {
    if (!isOpen || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        const item = items[activeIndex];
        goTo(item.isGeneric ? item.query : item.ticker);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const showDropdown = isOpen && items.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search stocks (e.g. TCS, Reliance, HDFC Bank)"
          className="w-full rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-series-blue-light dark:focus:ring-series-blue-dark"
        />
      </div>

      {showDropdown && (
        <div className="absolute mt-2 w-full min-w-[320px] glass-card overflow-hidden z-40 shadow-lg">
          {items.map((item, i) => {
            if (item.isGeneric) {
              return (
                <button
                  key="__generic"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => goTo(item.query)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors border-t border-black/5 dark:border-white/10 ${
                    activeIndex === i ? "bg-black/5 dark:bg-white/10" : ""
                  }`}
                >
                  <Icon name="search" className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                  <span className="text-ink-muted">
                    Search for <span className="font-medium text-ink-primary-light dark:text-ink-primary-dark">"{item.query}"</span>
                  </span>
                </button>
              );
            }

            const entry = item;
            const ov = overviews[entry.ticker];
            const changePct =
              ov && ov.previous_close ? ((ov.price - ov.previous_close) / ov.previous_close) * 100 : null;
            return (
              <button
                key={entry.ticker}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => goTo(entry.ticker)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  activeIndex === i ? "bg-black/5 dark:bg-white/10" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{entry.name}</div>
                  <div className="text-xs text-ink-muted">
                    {entry.ticker.replace(".NS", "")} · {entry.sector}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {ov ? (
                    <>
                      <div className="tabular-nums font-medium">₹{fmt(ov.price)}</div>
                      {changePct != null && (
                        <div className={`text-xs tabular-nums ${changePct >= 0 ? "text-status-good" : "text-status-critical"}`}>
                          {changePct >= 0 ? "+" : ""}
                          {changePct.toFixed(2)}%
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-ink-muted">…</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
