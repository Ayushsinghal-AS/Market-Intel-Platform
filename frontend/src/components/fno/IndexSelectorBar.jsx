import AnimatedNumber from "../ui/AnimatedNumber";

const INDICES = ["NIFTY", "BANKNIFTY", "SENSEX"];

function pcrLabel(pcr) {
  if (pcr == null) return { text: "—", tone: "" };
  if (pcr > 1.2) return { text: "Put-heavy", tone: "text-status-critical" };
  if (pcr < 0.8) return { text: "Call-heavy", tone: "text-status-good" };
  return { text: "Balanced", tone: "text-ink-secondary-light dark:text-ink-secondary-dark" };
}

export default function IndexSelectorBar({ index, onIndexChange, spot, changePct, expiry, availableExpiries, onExpiryChange, pcr }) {
  const pcrInfo = pcrLabel(pcr);

  return (
    <div className="glass-card p-4 flex flex-wrap items-center gap-4">
      <div className="flex gap-1">
        {INDICES.map((idx) => (
          <button
            key={idx}
            onClick={() => onIndexChange(idx)}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              index === idx ? "bg-series-blue-light dark:bg-series-blue-dark text-white" : "border border-black/10 dark:border-white/10"
            }`}
          >
            {idx}
          </button>
        ))}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold tabular-nums">
          <AnimatedNumber value={spot} decimals={2} />
        </span>
        {changePct != null && (
          <span className={`text-xs tabular-nums ${changePct >= 0 ? "text-status-good" : "text-status-critical"}`}>
            {changePct >= 0 ? "+" : ""}
            {changePct.toFixed(2)}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-ink-muted">Expiry</span>
        <select
          value={expiry || ""}
          onChange={(e) => onExpiryChange(e.target.value)}
          className="rounded border border-black/10 dark:border-white/10 bg-transparent px-2 py-1"
        >
          {(availableExpiries || []).map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5 text-xs ml-auto">
        <span className="text-ink-muted">PCR</span>
        <span className="font-semibold tabular-nums">{pcr ?? "—"}</span>
        <span className={pcrInfo.tone}>({pcrInfo.text})</span>
      </div>
    </div>
  );
}
