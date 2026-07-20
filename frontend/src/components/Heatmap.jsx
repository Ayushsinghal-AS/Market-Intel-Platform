import { heatColor, textColorFor } from "../utils/colors";

export default function Heatmap({ tickers, onSelectSector, selectedSector }) {
  const bySector = tickers.reduce((acc, t) => {
    (acc[t.sector] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(bySector).map(([sector, stocks]) => (
        <div key={sector}>
          <button
            onClick={() => onSelectSector?.(sector)}
            className={`text-xs font-medium mb-1.5 hover:underline ${selectedSector === sector ? "text-series-blue-light dark:text-series-blue-dark" : "text-ink-muted"}`}
          >
            {sector} {onSelectSector && "→"}
          </button>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
            {stocks.map((s) => (
              <div
                key={s.ticker}
                role="button"
                onClick={() => onSelectSector?.(sector)}
                title={`${s.ticker}: ${s.change_pct > 0 ? "+" : ""}${s.change_pct}% — click for sector detail`}
                className="rounded-md px-2 py-3 flex flex-col items-center justify-center gap-0.5 transition-transform hover:scale-[1.03] cursor-pointer"
                style={{ backgroundColor: heatColor(s.change_pct), color: textColorFor(s.change_pct) }}
              >
                <span className="text-xs font-semibold">{s.ticker.replace(".NS", "")}</span>
                <span className="text-xs tabular-nums">
                  {s.change_pct > 0 ? "+" : ""}
                  {s.change_pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
