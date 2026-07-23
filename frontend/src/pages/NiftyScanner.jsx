import { useEffect, useState } from "react";
import { api } from "../api";
import StatCard from "../components/StatCard";
import { SkeletonStatGrid, SkeletonTableRows } from "../components/ui/Skeleton";

const TF_ORDER = ["1m", "5m", "10m", "15m", "1h", "1d"];

function verdictTone(v) {
  if (!v) return "neutral";
  if (v.includes("BUY")) return "good";
  if (v.includes("SELL")) return "critical";
  return "neutral";
}

export default function NiftyScanner() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .niftyMultiTimeframe()
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setData(res);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) {
    return (
      <div className="p-6 space-y-8 max-w-6xl mx-auto">
        <SkeletonStatGrid count={4} />
        <SkeletonTableRows rows={6} cols={7} />
      </div>
    );
  }
  if (error) return <div className="p-6 text-status-critical">Failed to load: {error}</div>;

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">Nifty 50 Multi-Timeframe Scanner</h2>
          <button onClick={load} className="text-xs px-3 py-1.5 rounded border border-black/10 dark:border-white/10">
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Nifty 50" value={data.day_stats.price} />
          <StatCard label="Day Range" value={`${data.day_stats.low} – ${data.day_stats.high}`} />
          <StatCard label="Position in Range" value={`${data.day_stats.range_position_pct}%`} />
          <StatCard label="Returns 1W / 1M" value={`${data.day_stats.return_1w_pct}% / ${data.day_stats.return_1m_pct}%`} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Timeframe Verdicts</h2>
        <div className="overflow-x-auto glass-card">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5 text-ink-muted text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Timeframe</th>
                <th className="text-right px-3 py-2">Price</th>
                <th className="text-right px-3 py-2">RSI</th>
                <th className="text-right px-3 py-2">EMA50</th>
                <th className="text-left px-3 py-2">MAs</th>
                <th className="text-left px-3 py-2">Oscillators</th>
                <th className="text-left px-3 py-2">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {TF_ORDER.map((tf) => {
                const row = data.timeframes[tf];
                return (
                  <tr key={tf} className="border-t border-black/5 dark:border-white/5">
                    <td className="px-3 py-1.5 font-medium">{tf}</td>
                    {row ? (
                      <>
                        <td className="px-3 py-1.5 text-right tabular-nums">{row.price}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{row.rsi}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{row.ema50 ?? "—"}</td>
                        <td className="px-3 py-1.5">{row.ma_signal}</td>
                        <td className="px-3 py-1.5">{row.oscillator_signal}</td>
                        <td className={`px-3 py-1.5 font-semibold ${verdictTone(row.verdict) === "good" ? "text-status-good" : verdictTone(row.verdict) === "critical" ? "text-status-critical" : ""}`}>
                          {row.verdict}
                        </td>
                      </>
                    ) : (
                      <td colSpan={6} className="px-3 py-1.5 text-ink-muted">
                        Unavailable
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-muted mt-2">
          Trend: check 1h &amp; 1d first. Entry timing: watch 5m against that trend for a pullback-then-resume signal.
        </p>
      </section>
    </div>
  );
}
