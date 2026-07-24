import Icon from "../icons/Icon";

// Illustrative, client-only tracker: captures the leg's synthetic B-S price
// at the moment "Track this idea" was clicked as an entry reference, then
// compares it against the same leg's price on each subsequent chain refetch
// (the ~5min cache cadence -- option legs aren't part of the Phase 3
// tick-by-tick equity live-price engine). Resets on page leave; not a real
// persisted position.
export default function TradeHealthBar({ position, currentPrice, onDismiss }) {
  const { strike, side, entry, target, stopLoss } = position;
  const price = currentPrice ?? entry;

  const hitTarget = price >= target;
  const hitStop = price <= stopLoss;
  const range = Math.max(target - stopLoss, 0.01);
  const progressPct = Math.max(0, Math.min(100, ((price - stopLoss) / range) * 100));

  let status = { label: "TRACKING", tone: "text-ink-secondary-light dark:text-ink-secondary-dark", bar: "bg-series-blue-light dark:bg-series-blue-dark" };
  if (hitTarget) status = { label: "PROFIT TARGET REACHED", tone: "text-status-good", bar: "bg-status-good" };
  else if (hitStop) status = { label: "SELL / TRAIL STOP-LOSS", tone: "text-status-critical", bar: "bg-status-critical" };

  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-semibold">
            {strike} {side.toUpperCase()}
          </div>
          <div className="text-xs text-ink-muted">Illustrative idea tracker — not a real position</div>
        </div>
        <button onClick={onDismiss} className="text-ink-muted hover:text-ink-primary-light dark:hover:text-ink-primary-dark">
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      <div className={`text-xs font-semibold mb-2 ${status.tone}`}>{status.label}</div>

      <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mb-1.5">
        <div className={`h-full rounded-full transition-all duration-500 ${status.bar}`} style={{ width: `${progressPct}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-ink-muted tabular-nums">
        <span>SL {stopLoss}</span>
        <span>Entry {entry}</span>
        <span>Target {target}</span>
      </div>
      <div className="text-xs mt-2 tabular-nums">
        Current: <span className="font-semibold">₹{price}</span>
      </div>
    </div>
  );
}
