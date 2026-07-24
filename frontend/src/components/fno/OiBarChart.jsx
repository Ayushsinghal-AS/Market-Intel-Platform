function fmtOi(n) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export default function OiBarChart({ strikes }) {
  const maxOi = Math.max(...strikes.flatMap((s) => [s.call.oi, s.put.oi]), 1);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-medium text-series-blue-light dark:text-series-blue-dark">Call OI</span>
        <span className="text-ink-muted uppercase tracking-wide">Open Interest by Strike</span>
        <span className="font-medium text-status-critical">Put OI</span>
      </div>
      <div className="space-y-1">
        {strikes.map((row) => (
          <div key={row.strike} className={`grid grid-cols-[1fr_4.5rem_1fr] items-center gap-2 ${row.is_atm ? "font-semibold" : ""}`}>
            <div className="flex justify-end items-center gap-1.5">
              <span className="text-[10px] text-ink-muted tabular-nums">{fmtOi(row.call.oi)}</span>
              <div
                className="h-3 bg-series-blue-light dark:bg-series-blue-dark rounded-l"
                style={{ width: `${(row.call.oi / maxOi) * 100}%` }}
              />
            </div>
            <div className="text-xs text-center tabular-nums">{row.strike}</div>
            <div className="flex justify-start items-center gap-1.5">
              <div className="h-3 bg-status-critical rounded-r" style={{ width: `${(row.put.oi / maxOi) * 100}%` }} />
              <span className="text-[10px] text-ink-muted tabular-nums">{fmtOi(row.put.oi)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
