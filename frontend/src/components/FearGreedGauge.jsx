import { useEffect, useState } from "react";
import { api } from "../api";
import Gauge from "./ui/Gauge";
import Skeleton from "./ui/Skeleton";
import TiltCard from "./ui/TiltCard";

const COMPONENT_LABELS = {
  momentum: "Momentum",
  volatility: "Volatility",
  breadth: "Breadth",
  news_sentiment: "News Sentiment",
};

function labelColor(label) {
  if (label === "Extreme Fear" || label === "Fear") return "text-status-critical";
  if (label === "Extreme Greed" || label === "Greed") return "text-status-good";
  return "text-ink-secondary-light dark:text-ink-secondary-dark";
}

export default function FearGreedGauge() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.fearGreed().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return null; // non-critical widget -- fail quietly rather than blocking the dashboard
  if (!data) {
    return (
      <div className="glass-card p-4 flex items-center justify-center">
        <Skeleton className="h-40 w-64" />
      </div>
    );
  }

  return (
    <TiltCard className="glass-card p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
      <Gauge score={data.score} label={data.label} labelClassName={labelColor(data.label)} caption="Market Sentiment (Fear & Greed)" />

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
    </TiltCard>
  );
}
