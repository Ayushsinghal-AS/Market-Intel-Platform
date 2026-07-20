export default function StatCard({ label, value, sub, tone = "neutral" }) {
  const toneClass = {
    good: "text-status-good",
    critical: "text-status-critical",
    neutral: "text-ink-primary-light dark:text-ink-primary-dark",
  }[tone];

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 bg-surface-light dark:bg-surface-dark p-4">
      <div className="text-xs uppercase tracking-wide text-ink-muted mb-1">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      {sub && <div className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark mt-1">{sub}</div>}
    </div>
  );
}
