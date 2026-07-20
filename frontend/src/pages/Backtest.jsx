import { useState } from "react";
import { api } from "../api";
import StatCard from "../components/StatCard";
import EquityCurveChart from "../components/EquityCurveChart";

export default function Backtest() {
  const [form, setForm] = useState({ ticker: "RELIANCE.NS", short_window: 50, long_window: 200, period: "5y" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.backtest({
        ticker: form.ticker,
        short_window: Number(form.short_window),
        long_window: Number(form.long_window),
        period: form.period,
      });
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
        <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">SMA Crossover Backtest</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input
            value={form.ticker}
            onChange={(e) => setForm({ ...form, ticker: e.target.value })}
            placeholder="Ticker e.g. RELIANCE.NS"
            className="rounded border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            value={form.short_window}
            onChange={(e) => setForm({ ...form, short_window: e.target.value })}
            placeholder="Short window"
            className="rounded border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            value={form.long_window}
            onChange={(e) => setForm({ ...form, long_window: e.target.value })}
            placeholder="Long window"
            className="rounded border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-sm"
          />
          <select
            value={form.period}
            onChange={(e) => setForm({ ...form, period: e.target.value })}
            className="rounded border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-sm"
          >
            {["2y", "3y", "5y", "10y"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="mt-3 text-sm px-3 py-1.5 rounded bg-series-blue-light dark:bg-series-blue-dark text-white disabled:opacity-50"
        >
          {loading ? "Running…" : "Run Backtest"}
        </button>
        {error && <div className="text-status-critical text-sm mt-2">{error}</div>}
      </section>

      {result && (
        <>
          <section>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">
              {result.ticker} — {result.params.short_window}/{result.params.long_window} SMA Crossover vs Buy &amp; Hold
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Strategy CAGR" value={`${result.strategy.cagr_pct}%`} tone={result.strategy.cagr_pct >= 0 ? "good" : "critical"} />
              <StatCard label="Buy & Hold CAGR" value={`${result.buy_and_hold.cagr_pct}%`} />
              <StatCard label="Strategy Sharpe" value={result.strategy.sharpe_ratio} />
              <StatCard label="Strategy Max Drawdown" value={`${result.strategy.max_drawdown_pct}%`} tone="critical" />
              <StatCard label="Trades" value={result.trades} />
              <StatCard label="Win Rate" value={result.win_rate_pct != null ? `${result.win_rate_pct}%` : "—"} />
              <StatCard label="Strategy Multiple" value={`${result.strategy.final_multiple}x`} />
              <StatCard label="Buy & Hold Multiple" value={`${result.buy_and_hold.final_multiple}x`} />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Equity Curve (Growth of ₹1)</h2>
            <EquityCurveChart
              data={result.equity_curve}
              lines={[
                { key: "strategy", label: "SMA Strategy", color: "blue" },
                { key: "buy_and_hold", label: "Buy & Hold", color: "green" },
              ]}
            />
          </section>
        </>
      )}
    </div>
  );
}
