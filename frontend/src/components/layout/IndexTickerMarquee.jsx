import { useEffect, useState } from "react";
import { api } from "../../api";

// The existing /market/nifty-multi-timeframe payload has no true 1-day change
// field, so this honestly surfaces price + 1W/1M returns rather than
// fabricating a daily change figure.
function fmt(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-IN");
}

export default function IndexTickerMarquee() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api
        .niftyMultiTimeframe()
        .then((res) => {
          if (!cancelled && !res.error) setStats(res.day_stats);
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!stats) return <div className="hidden md:block flex-1" />;

  const chips = (
    <div className="flex items-center gap-6 shrink-0 px-3">
      <span className="text-xs font-semibold whitespace-nowrap">
        NIFTY 50 <span className="tabular-nums font-normal ml-1">{fmt(stats.price)}</span>
      </span>
      <span className={`text-xs tabular-nums whitespace-nowrap ${stats.return_1w_pct >= 0 ? "text-status-good" : "text-status-critical"}`}>
        1W {stats.return_1w_pct >= 0 ? "+" : ""}
        {stats.return_1w_pct}%
      </span>
      <span className={`text-xs tabular-nums whitespace-nowrap ${stats.return_1m_pct >= 0 ? "text-status-good" : "text-status-critical"}`}>
        1M {stats.return_1m_pct >= 0 ? "+" : ""}
        {stats.return_1m_pct}%
      </span>
      <span className="text-xs text-ink-muted whitespace-nowrap">
        Range {fmt(stats.low)}–{fmt(stats.high)}
      </span>
    </div>
  );

  return (
    <div className="hidden md:block flex-1 overflow-hidden">
      <div className="flex w-max animate-marquee">
        {chips}
        {chips}
      </div>
    </div>
  );
}
