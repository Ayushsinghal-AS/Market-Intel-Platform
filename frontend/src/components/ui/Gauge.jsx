import { useEffect, useState } from "react";
import { animate } from "framer-motion";

const CX = 100;
const CY = 105;
const NEEDLE_LEN = 66;

export const DEFAULT_BANDS = [
  { min: 0, max: 24, color: "#EF4444" },
  { min: 25, max: 44, color: "#f59e0b" },
  { min: 45, max: 55, color: "#9ca3af" },
  { min: 56, max: 75, color: "#84cc16" },
  { min: 76, max: 100, color: "#10B981" },
];

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

// Reusable semicircle band gauge with an animated needle -- shared by
// FearGreedGauge (market-wide sentiment) and SignalDial (per-stock verdict).
export default function Gauge({ score, bands = DEFAULT_BANDS, radius = 82, label, labelClassName = "", caption }) {
  const [animScore, setAnimScore] = useState(0);

  useEffect(() => {
    const controls = animate(0, score, { duration: 1, ease: "easeOut", onUpdate: setAnimScore });
    return () => controls.stop();
  }, [score]);

  const tip = polarPoint(NEEDLE_LEN, angleForScore(animScore));

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 130" className="w-full max-w-[280px]">
        {bands.map((b) => (
          <path
            key={b.min}
            d={arcPath(radius, angleForScore(b.min), angleForScore(b.max))}
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
      {label && <div className={`text-sm font-semibold ${labelClassName}`}>{label}</div>}
      {caption && <div className="text-xs text-ink-muted mt-1">{caption}</div>}
    </div>
  );
}
