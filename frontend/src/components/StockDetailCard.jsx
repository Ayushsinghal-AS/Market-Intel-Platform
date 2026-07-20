import Sparkline from "./Sparkline";

function fmt(n, opts) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-IN", opts);
}

export default function StockDetailCard({ stock }) {
  const tech = stock.technical || {};
  const changePct = stock.previous_close ? ((stock.price - stock.previous_close) / stock.previous_close) * 100 : null;

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 bg-surface-light dark:bg-surface-dark p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold">{stock.ticker.replace(".NS", "")}</div>
          <div className="text-xs text-ink-muted">{stock.name}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold tabular-nums">₹{fmt(stock.price)}</div>
          {changePct != null && (
            <div className={`text-xs tabular-nums ${changePct >= 0 ? "text-status-good" : "text-status-critical"}`}>
              {changePct >= 0 ? "+" : ""}
              {changePct.toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      <Sparkline data={stock.chart} color={changePct >= 0 ? "#0ca30c" : "#d03b3b"} />

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mt-2">
        <div className="text-ink-muted">Prev Close</div>
        <div className="text-right tabular-nums">{fmt(stock.previous_close)}</div>
        <div className="text-ink-muted">Day Low / High</div>
        <div className="text-right tabular-nums">
          {fmt(stock.day_low)} / {fmt(stock.day_high)}
        </div>
        <div className="text-ink-muted">Volume</div>
        <div className="text-right tabular-nums">{fmt(stock.volume)}</div>
        <div className="text-ink-muted">P/E · P/B</div>
        <div className="text-right tabular-nums">
          {fmt(stock.pe_ratio, { maximumFractionDigits: 1 })} · {fmt(stock.pb_ratio, { maximumFractionDigits: 1 })}
        </div>
        <div className="text-ink-muted">ROE</div>
        <div className="text-right tabular-nums">{stock.roe_pct != null ? `${stock.roe_pct}%` : "—"}</div>
        <div className="text-ink-muted">Revenue</div>
        <div className="text-right tabular-nums">{stock.revenue ? `₹${fmt(stock.revenue / 1e7, { maximumFractionDigits: 0 })} Cr` : "—"}</div>
      </div>

      <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-ink-muted">Technical Verdict</span>
          <span className={`font-semibold ${tech.verdict?.includes("BUY") ? "text-status-good" : tech.verdict?.includes("SELL") ? "text-status-critical" : ""}`}>
            {tech.verdict}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-muted">RSI</span>
          <span className="tabular-nums">{tech.rsi}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-muted">Support</span>
          <span className="tabular-nums">{tech.support_levels?.join(", ") || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-muted">Resistance</span>
          <span className="tabular-nums">{tech.resistance_levels?.join(", ") || "—"}</span>
        </div>
      </div>
    </div>
  );
}
