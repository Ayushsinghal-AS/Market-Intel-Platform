import { useEffect, useState } from "react";
import { animate } from "framer-motion";
import { api } from "../api";
import Skeleton from "./ui/Skeleton";

const CX = 100;
const CY = 105;
const RADIUS = 82;
const NEEDLE_LEN = 66;

const BANDS = [
  { min: 0, max: 24, color: "#EF4444" },
  { min: 25, max: 44, color: "#f59e0b" },
  { min: 45, max: 55, color: "#9ca3af" },
  { min: 56, max: 75, color: "#84cc16" },
  { min: 76, max: 100, color: "#10B981" },
];

const COMPONENT_LABELS = {
  momentum: "Momentum",
  volatility: "Volatility",
  breadth: "Breadth",
  news_sentiment: "News Sentiment",
};

function angleForScore(score) {
  return 180 - score * 1.8;
}

function polarPoint(r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
}

function arcPath(r, startAngle, endAngle) {
  const start = polarPoint(r, startAngle);
  const end = polarPoint(r, endAngle);
  const largeArc = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function labelColor(label) {
  if (label === "Extreme Fear" || label === "Fear") return "text-status-critical";
  if (label === "Extreme Greed" || label === "Greed") return "text-status-good";
  return "text-ink-secondary-light dark:text-ink-secondary-dark";
}

export default function FearGreedGauge() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [animScore, setAnimScore] = useState(0);

  useEffect(() => {
    api.fearGreed().then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!data) return;
    const controls = animate(0, data.score, { duration: 1, ease: "easeOut", onUpdate: setAnimScore });
    return () => controls.stop();
  }, [data]);

  if (error) return null; // non-critical widget -- fail quietly rather than blocking the dashboard
  if (!data) {
    return (
      <div className="glass-card p-4 flex items-center justify-center">
        <Skeleton className="h-40 w-64" />
      </div>
    );
  }

  const needleAngle = angleForScore(animScore);
  const tip = polarPoint(NEEDLE_LEN, needleAngle);

  return (
    <div className="glass-card p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 130" className="w-full max-w-[280px]">
          {BANDS.map((b) => (
            <path
              key={b.min}
              d={arcPath(RADIUS, angleForScore(b.min), angleForScore(b.max))}
              stroke={b.color}
              strokeWidth={16}
              fill="none"
              strokeLinecap="butt"
            />
          ))}
          <line
            x1={CX}
            y1={CY}
            x2={tip.x}
            y2={tip.y}
            stroke="currentColor"
            className="text-ink-primary-light dark:text-ink-primary-dark"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={CX} cy={CY} r={5} fill="currentColor" className="text-ink-primary-light dark:text-ink-primary-dark" />
        </svg>
        <div className="text-3xl font-bold tabular-nums -mt-4">{Math.round(animScore)}</div>
        <div className={`text-sm font-semibold ${labelColor(data.label)}`}>{data.label}</div>
        <div className="text-xs text-ink-muted mt-1">Market Sentiment (Fear &amp; Greed)</div>
      </div>

      <div className="space-y-2">
        {Object.entries(data.components).map(([key, c]) => (
          <div key={key} className="text-xs">
            <div className="flex justify-between mb-0.5">
              <span className="text-ink-muted">{COMPONENT_LABELS[key] || key}</span>
              <span className="font-semibold tabular-nums">{c.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-series-blue-light dark:bg-series-blue-dark"
                style={{ width: `${c.score}%` }}
              />
            </div>
            <div className="text-ink-muted mt-0.5">{c.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
