import { useState } from "react";
import { api } from "../api";
import StatCard from "../components/StatCard";

export default function EtfScanner() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.etfScan();
      if (res.error) throw new Error(res.error);
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <section>
        <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">ETF Intelligence Scanner</h2>
        <p className="text-xs text-ink-muted mb-3">
          Ported from the repo's ETF dip-buying bot: RSI/EMA/VWAP-scored strategy across liquid Indian ETFs, picking the
          steepest eligible dip while avoiding yesterday's category to force diversification.
        </p>
        <button
          onClick={scan}
          disabled={loading}
          className="text-sm px-4 py-2 rounded bg-series-blue-light dark:bg-series-blue-dark text-white disabled:opacity-50"
        >
          {loading ? "Scanning (can take ~30s)…" : "Run Scan"}
        </button>
        {error && <div className="text-status-critical text-sm mt-2">{error}</div>}
      </section>

      {result && (
        <>
          <section>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Strategy Result — {result.strategy}</h2>
            {result.selected ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <StatCard label="Pick" value={result.selected.ticker.replace(".NS", "")} sub={result.selected.category} />
                  <StatCard
                    label="Verdict"
                    value={result.selected.analysis.verdict}
                    tone={result.selected.analysis.verdict.includes("BUY") ? "good" : "critical"}
                  />
                  <StatCard label="1D Change" value={`${result.selected.change_1d_pct}%`} tone={result.selected.change_1d_pct >= 0 ? "good" : "critical"} />
                  <StatCard label="Value Traded" value={`₹${result.selected.value_cr} Cr`} />
                  <StatCard label="RSI" value={result.selected.rsi} />
                  <StatCard label="EMA50" value={result.selected.ema50} />
                  <StatCard label="VWAP" value={result.selected.analysis.vwap} sub={result.selected.analysis.vwap_status} />
                  <StatCard label="Confidence" value={result.selected.analysis.confidence} />
                </div>
                <p className="text-sm text-ink-secondary-light dark:text-ink-secondary-dark">{result.reason}</p>
              </>
            ) : (
              <p className="text-sm text-status-warning">{result.reason || "No trade signal today."}</p>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">All Scanned ETFs</h2>
            <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-black/5 dark:bg-white/5 text-ink-muted text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2">Ticker</th>
                    <th className="text-left px-3 py-2">Category</th>
                    <th className="text-right px-3 py-2">Price</th>
                    <th className="text-right px-3 py-2">1D %</th>
                    <th className="text-right px-3 py-2">30D %</th>
                    <th className="text-right px-3 py-2">RSI</th>
                    <th className="text-right px-3 py-2">Value (Cr)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.all_etfs.map((e) => (
                    <tr key={e.ticker} className="border-t border-black/5 dark:border-white/5">
                      <td className="px-3 py-1.5 font-medium">{e.ticker.replace(".NS", "")}</td>
                      <td className="px-3 py-1.5 text-ink-secondary-light dark:text-ink-secondary-dark">{e.category}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">₹{e.price}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums ${e.change_1d_pct >= 0 ? "text-status-good" : "text-status-critical"}`}>
                        {e.change_1d_pct}%
                      </td>
                      <td className={`px-3 py-1.5 text-right tabular-nums ${e.change_30d_pct >= 0 ? "text-status-good" : "text-status-critical"}`}>
                        {e.change_30d_pct}%
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{e.rsi ?? "—"}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{e.value_cr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
