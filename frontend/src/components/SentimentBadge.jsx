import { motion } from "framer-motion";
import Icon from "./icons/Icon";

const MAP = {
  Positive: { label: "Bullish", chip: "bg-status-good/15 text-status-good", bar: "bg-status-good" },
  Negative: { label: "Bearish", chip: "bg-status-critical/15 text-status-critical", bar: "bg-status-critical" },
  Neutral: { label: "Neutral", chip: "bg-black/10 dark:bg-white/10 text-ink-secondary-light dark:text-ink-secondary-dark", bar: "bg-ink-muted" },
};

// Presentation-only "confident AI tagging" look over the existing lexicon
// sentiment scorer (backend/app/services/news.py) -- the underlying scoring
// logic is unchanged, just styled to read like automated analysis.
export default function SentimentBadge({ sentiment, impactScore = 0 }) {
  const cfg = MAP[sentiment] || MAP.Neutral;
  const barWidth = Math.min(100, Math.abs(impactScore) * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="inline-flex flex-col gap-1">
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.chip}`}>
        <Icon name="sparkle" className="w-3 h-3" />
        {cfg.label}
      </span>
      <div className="h-1 w-16 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${barWidth}%` }} />
      </div>
    </motion.div>
  );
}
