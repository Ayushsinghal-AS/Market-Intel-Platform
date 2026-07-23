import AnimatedNumber from "./ui/AnimatedNumber";

export default function StatCard({ label, value, sub, tone = "neutral", animate = false, decimals = 0, prefix = "", suffix = "" }) {
  const toneClass = {
    good: "text-status-good",
    critical: "text-status-critical",
    neutral: "text-ink-primary-light dark:text-ink-primary-dark",
  }[tone];

  return (
    <div className="glass-card p-4">
      <div className="text-xs uppercase tracking-wide text-ink-muted mb-1">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${toneClass}`}>
        {animate && typeof value === "number" ? (
          <AnimatedNumber value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
        ) : (
          value
        )}
      </div>
      {sub && <div className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark mt-1">{sub}</div>}
    </div>
  );
}
