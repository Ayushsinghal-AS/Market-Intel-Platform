import { useState } from "react";
import { api } from "../api";
import StatCard from "../components/StatCard";
import EquityCurveChart from "../components/EquityCurveChart";

const emptyRow = () => ({ ticker: "", quantity: "", buy_price: "", buy_date: "" });

export default function Portfolio() {
  const [rows, setRows] = useState([
    { ticker: "RELIANCE.NS", quantity: "10", buy_price: "1200", buy_date: "2023-01-15" },
    { ticker: "TCS.NS", quantity: "5", buy_price: "3400", buy_date: "2023-06-01" },
  ]);
  const [result, setResult] = useState(null);
  const [overlap, setOverlap] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateRow = (i, field, value) => {
    const next = [...rows];
    next[i] = { ...next[i], [field]: value };
    setRows(next);
  };

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setOverlap(null);
    try {
      const holdings = rows
        .filter((r) => r.ticker && r.quantity && r.buy_price && r.buy_date)
        .map((r) => ({ ...r, quantity: Number(r.quantity), buy_price: Number(r.buy_price) }));
      const res = await api.analyzePortfolio(holdings);
      if (res.error) throw new Error(res.error);
      setResult(res);

      const overlapHoldings = res.holdings.map((h) => ({ ticker: h.ticker, value: h.current_value }));
      const ov = await api.portfolioOverlap(overlapHoldings);
      setOverlap(ov);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <section>
        <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Holdings</h2>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-4 gap-2">
              <input
                placeholder="Ticker e.g. RELIANCE.NS"
                value={row.ticker}
                onChange={(e) => updateRow(i, "ticker", e.target.value)}
                className="rounded border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Quantity"
                value={row.quantity}
                onChange={(e) => updateRow(i, "quantity", e.target.value)}
                className="rounded border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Buy price"
                value={row.buy_price}
                onChange={(e) => updateRow(i, "buy_price", e.target.value)}
                className="rounded border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-sm"
              />
              <input
                type="date"
                value={row.buy_date}
                onChange={(e) => updateRow(i, "buy_date", e.target.value)}
                className="rounded border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setRows([...rows, emptyRow()])}
            className="text-sm px-3 py-1.5 rounded border border-black/10 dark:border-white/10"
          >
            + Add holding
          </button>
          <button
            onClick={analyze}
            disabled={loading}
            className="text-sm px-3 py-1.5 rounded bg-series-blue-light dark:bg-series-blue-dark text-white disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Analyze Portfolio"}
          </button>
        </div>
        {error && <div className="text-status-critical text-sm mt-2">{error}</div>}
      </section>

      {result && (
        <>
          <section>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Risk &amp; Return Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Absolute P&L"
                value={`${result.absolute_pnl_pct}%`}
                sub={`₹${result.absolute_pnl.toLocaleString("en-IN")}`}
                tone={result.absolute_pnl >= 0 ? "good" : "critical"}
              />
              <StatCard label="XIRR" value={`${result.xirr_pct ?? "—"}%`} />
              <StatCard label="CAGR" value={`${result.cagr_pct ?? "—"}%`} />
              <StatCard label="Beta vs Nifty" value={result.beta_vs_nifty ?? "—"} />
              <StatCard label="Sharpe Ratio" value={result.sharpe_ratio ?? "—"} />
              <StatCard label="Sortino Ratio" value={result.sortino_ratio ?? "—"} />
              <StatCard label="Max Drawdown" value={`${result.max_drawdown_pct ?? "—"}%`} tone="critical" />
              <StatCard label="Volatility (ann.)" value={`${result.annualized_volatility_pct ?? "—"}%`} />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Portfolio Value Over Time</h2>
            <EquityCurveChart data={result.equity_curve} lines={[{ key: "value", label: "Portfolio Value (₹)", color: "blue" }]} />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Holdings Breakdown</h2>
            <div className="overflow-x-auto glass-card">
              <table className="w-full text-sm">
                <thead className="bg-black/5 dark:bg-white/5 text-ink-muted text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-2">Ticker</th>
                    <th className="text-right px-3 py-2">Invested</th>
                    <th className="text-right px-3 py-2">Current Value</th>
                    <th className="text-right px-3 py-2">P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {result.holdings.map((h) => (
                    <tr key={h.ticker} className="border-t border-black/5 dark:border-white/5">
                      <td className="px-3 py-1.5 font-medium">{h.ticker.replace(".NS", "")}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">₹{h.invested.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">₹{h.current_value.toLocaleString("en-IN")}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums ${h.pnl_pct >= 0 ? "text-status-good" : "text-status-critical"}`}>
                        {h.pnl_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {overlap && (
            <section>
              <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Look-Through Exposure (ETF Overlap)</h2>
              <p className="text-xs text-ink-muted mb-2">{overlap.note}</p>
              <div className="overflow-x-auto glass-card">
                <table className="w-full text-sm">
                  <thead className="bg-black/5 dark:bg-white/5 text-ink-muted text-xs uppercase">
                    <tr>
                      <th className="text-left px-3 py-2">Underlying</th>
                      <th className="text-right px-3 py-2">Look-Through Value</th>
                      <th className="text-right px-3 py-2">% of Portfolio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overlap.look_through_exposure.map((r) => (
                      <tr key={r.name} className="border-t border-black/5 dark:border-white/5">
                        <td className="px-3 py-1.5 font-medium">{r.name.replace(".NS", "")}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">₹{r.look_through_value.toLocaleString("en-IN")}</td>
                        <td className={`px-3 py-1.5 text-right tabular-nums ${r.pct_of_portfolio >= 10 ? "text-status-warning font-semibold" : ""}`}>
                          {r.pct_of_portfolio}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
