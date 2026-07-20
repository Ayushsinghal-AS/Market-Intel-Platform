import { useState } from "react";
import { api } from "../api";
import StatCard from "../components/StatCard";
import EquityCurveChart from "../components/EquityCurveChart";

function fmt(n, opts) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-IN", opts);
}

export default function StockExplorer() {
  const [query, setQuery] = useState("RELIANCE");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const overview = await api.stockOverview(query.trim());
      setData(overview);
    } catch (e) {
      setError("Could not find data for that stock. Try a ticker like RELIANCE.NS or a name like Infosys.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <section>
        <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Stock Explorer</h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Ticker or company name (e.g. RELIANCE, TCS.NS, Infosys)"
            className="flex-1 rounded border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
          />
          <button
            onClick={search}
            disabled={loading}
            className="text-sm px-4 py-2 rounded bg-series-blue-light dark:bg-series-blue-dark text-white disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
        {error && <div className="text-status-critical text-sm mt-2">{error}</div>}
      </section>

      {data && (
        <>
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold">{data.name}</h2>
                <p className="text-xs text-ink-muted">
                  {data.ticker} · {data.sector || "—"} {data.industry ? `· ${data.industry}` : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold tabular-nums">₹{fmt(data.price)}</div>
                <div className="text-xs text-ink-muted">Prev close ₹{fmt(data.previous_close)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Day Range" value={`${fmt(data.day_low)} – ${fmt(data.day_high)}`} />
              <StatCard label="52W Range" value={`${fmt(data.fifty_two_week_low)} – ${fmt(data.fifty_two_week_high)}`} />
              <StatCard label="Volume" value={fmt(data.volume)} sub={`avg ${fmt(data.average_volume)}`} />
              <StatCard label="Market Cap" value={data.market_cap ? `₹${fmt(data.market_cap / 1e7, { maximumFractionDigits: 0 })} Cr` : "—"} />
              <StatCard label="P/E Ratio" value={fmt(data.pe_ratio, { maximumFractionDigits: 2 })} />
              <StatCard label="P/B Ratio" value={fmt(data.pb_ratio, { maximumFractionDigits: 2 })} />
              <StatCard label="ROE" value={data.roe_pct != null ? `${data.roe_pct}%` : "—"} />
              <StatCard label="Revenue" value={data.revenue ? `₹${fmt(data.revenue / 1e7, { maximumFractionDigits: 0 })} Cr` : "—"} />
              <StatCard label="Profit Margin" value={data.profit_margin_pct != null ? `${data.profit_margin_pct}%` : "—"} />
              <StatCard label="Dividend Yield" value={data.dividend_yield_pct != null ? `${data.dividend_yield_pct}%` : "—"} />
              <StatCard label="Analyst View" value={data.analyst_recommendation} />
              <StatCard label="Analyst Target" value={data.analyst_target_price ? `₹${fmt(data.analyst_target_price)}` : "—"} />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Price Chart (6M)</h2>
            <EquityCurveChart data={data.chart} lines={[{ key: "close", label: "Close", color: "blue" }]} />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Technical Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <StatCard
                label="Verdict"
                value={data.technical.verdict}
                tone={data.technical.verdict.includes("BUY") ? "good" : data.technical.verdict.includes("SELL") ? "critical" : "neutral"}
                sub={`Confidence: ${data.technical.confidence}`}
              />
              <StatCard label="RSI (14)" value={data.technical.rsi} />
              <StatCard label="EMA 20 / 50 / 200" value={`${fmt(data.technical.ema20)} / ${fmt(data.technical.ema50)} / ${fmt(data.technical.ema200)}`} />
              <StatCard label="MACD" value={`${data.technical.macd} / ${data.technical.macd_signal}`} />
              <StatCard label="Bollinger Bands" value={`${fmt(data.technical.bollinger_lower)} – ${fmt(data.technical.bollinger_upper)}`} />
              <StatCard label="Stochastic %K" value={data.technical.stochastic_k ?? "—"} />
              <StatCard label="Support Levels" value={data.technical.support_levels.join(", ") || "—"} />
              <StatCard label="Resistance Levels" value={data.technical.resistance_levels.join(", ") || "—"} />
            </div>
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 text-sm">
              <span className="text-ink-muted">Volume signal: </span>
              <span className="font-medium">{data.technical.volume_anomaly.label}</span>
              {data.technical.volume_anomaly.volume_ratio != null && (
                <span className="text-ink-muted"> (volume ratio {data.technical.volume_anomaly.volume_ratio}x)</span>
              )}
            </div>
            <div className="mt-2 text-xs text-ink-muted">Signals: {data.technical.signals.join(" · ")}</div>
          </section>
        </>
      )}
    </div>
  );
}
