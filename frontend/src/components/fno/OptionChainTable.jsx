function fmt(n, digits = 2) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtOi(n) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

function LegCells({ leg, viewMode, align, itm }) {
  const base = `px-2 py-1.5 tabular-nums ${align === "left" ? "text-left" : "text-right"} ${itm ? "bg-black/5 dark:bg-white/5" : ""}`;

  if (viewMode === "greeks") {
    return (
      <>
        <td className={base}>{leg.iv}%</td>
        <td className={base}>{leg.delta}</td>
        <td className={base}>{leg.gamma}</td>
        <td className={base}>{leg.theta}</td>
        <td className={base}>{leg.vega}</td>
      </>
    );
  }
  return (
    <>
      <td className={base}>{fmtOi(leg.oi)}</td>
      <td className={`${base} ${leg.oi_change_pct >= 0 ? "text-status-good" : "text-status-critical"}`}>
        {leg.oi_change_pct >= 0 ? "+" : ""}
        {leg.oi_change_pct}%
      </td>
      <td className={base}>{fmtOi(leg.volume)}</td>
      <td className={`${base} font-semibold`}>{fmt(leg.ltp)}</td>
    </>
  );
}

const COMPACT_HEADERS = ["OI", "Chg OI", "Volume", "LTP"];
const GREEKS_HEADERS = ["IV", "Delta", "Gamma", "Theta", "Vega"];

export default function OptionChainTable({ strikes, spot, viewMode, onSelectSignal }) {
  const headers = viewMode === "greeks" ? GREEKS_HEADERS : COMPACT_HEADERS;

  return (
    <div className="overflow-x-auto glass-card">
      <table className="w-full text-xs min-w-[720px]">
        <thead className="bg-black/5 dark:bg-white/5 text-ink-muted uppercase">
          <tr>
            {headers.map((h) => (
              <th key={`c-${h}`} className="px-2 py-2 text-right">
                {h}
              </th>
            ))}
            <th className="px-2 py-2 text-center bg-black/10 dark:bg-white/10">Strike</th>
            {headers.map((h) => (
              <th key={`p-${h}`} className="px-2 py-2 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {strikes.map((row) => {
            const callItm = row.strike < spot;
            const putItm = row.strike > spot;
            return (
              <tr key={row.strike} className="border-t border-black/5 dark:border-white/5">
                <LegCells leg={row.call} viewMode={viewMode} itm={callItm} />

                <td
                  className={`px-2 py-1.5 text-center font-semibold bg-black/10 dark:bg-white/10 ${
                    row.is_atm ? "text-series-blue-light dark:text-series-blue-dark" : ""
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {row.call.screener && (
                      <button
                        onClick={() => onSelectSignal(row.strike, "call", row.call)}
                        title="Notable Setup — Call"
                        className="relative flex h-2 w-2 shrink-0"
                      >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-good opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-status-good" />
                      </button>
                    )}
                    {row.strike}
                    {row.put.screener && (
                      <button
                        onClick={() => onSelectSignal(row.strike, "put", row.put)}
                        title="Notable Setup — Put"
                        className="relative flex h-2 w-2 shrink-0"
                      >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-good opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-status-good" />
                      </button>
                    )}
                  </div>
                </td>

                <LegCells leg={row.put} viewMode={viewMode} align="left" itm={putItm} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
