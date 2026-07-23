import Gauge from "./ui/Gauge";

// Derived entirely from data StockDetail already fetches -- no new backend
// call. Base score comes from the existing technical.analyze() verdict
// (backend/app/services/technical.py), nudged by the existing news-sentiment
// summary; same 5-band gauge as FearGreedGauge via the shared Gauge primitive.
const VERDICT_BASE_SCORE = {
  "STRONG SELL": 10,
  SELL: 30,
  NEUTRAL: 50,
  BUY: 70,
  "STRONG BUY": 90,
};

const SENTIMENT_NUDGE = { Positive: 10, Negative: -10, Neutral: 0 };

const BUCKETS = [
  { max: 24, label: "Strong Sell" },
  { max: 44, label: "Sell" },
  { max: 55, label: "Hold" },
  { max: 75, label: "Buy" },
  { max: 100, label: "Strong Buy" },
];

function labelForScore(score) {
  return BUCKETS.find((b) => score <= b.max)?.label ?? "Hold";
}

function labelClassFor(label) {
  if (label === "Strong Sell" || label === "Sell") return "text-status-critical";
  if (label === "Strong Buy" || label === "Buy") return "text-status-good";
  return "text-ink-secondary-light dark:text-ink-secondary-dark";
}

export default function SignalDial({ verdict, overallSentiment }) {
  const base = VERDICT_BASE_SCORE[verdict] ?? 50;
  const nudge = SENTIMENT_NUDGE[overallSentiment] ?? 0;
  const score = Math.max(0, Math.min(100, base + nudge));
  const label = labelForScore(score);

  return (
    <div className="glass-card p-4">
      <Gauge score={score} label={label} labelClassName={labelClassFor(label)} caption="AI Technical Signal" />
      <p className="text-xs text-ink-muted text-center mt-1">Technical verdict ({verdict}) + news sentiment ({overallSentiment})</p>
    </div>
  );
}
