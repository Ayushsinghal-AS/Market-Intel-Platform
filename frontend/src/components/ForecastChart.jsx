import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../contexts/ThemeContext";
import { CHART_COLORS } from "../utils/chartTheme";
import { computeHistoricalStats, projectPrices } from "../utils/forecast";

const FORECAST_COLOR = "#a855f7"; // violet -- visually distinct from the blue/green series already used elsewhere

export default function ForecastChart({ chart, lastLivePrice, horizonDays, volatilityMultiplier, extraGrowthPct }) {
  const { isDark } = useTheme();
  const colors = CHART_COLORS[isDark ? "dark" : "light"];

  const mergedData = useMemo(() => {
    if (!chart?.length) return [];
    const stats = computeHistoricalStats(chart);
    const lastPrice = lastLivePrice ?? stats.lastPrice;
    const projected = projectPrices(lastPrice, stats.lastDate, stats.drift, stats.dailyVol, horizonDays, {
      volatilityMultiplier,
      extraAnnualGrowthPct: extraGrowthPct,
    });

    const historical = chart.slice(0, -1).map((d) => ({ date: d.date, close: d.close }));
    const connector = { date: stats.lastDate, close: lastPrice, expected: lastPrice, upper: lastPrice, lower: lastPrice, band: 0 };
    return [...historical, connector, ...projected];
  }, [chart, lastLivePrice, horizonDays, volatilityMultiplier, extraGrowthPct]);

  return (
    <div>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={mergedData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <filter id="forecastGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: colors.tick }} minTickGap={50} />
          <YAxis tick={{ fontSize: 11, fill: colors.tick }} width={48} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              backgroundColor: isDark ? "#111827" : "#fcfcfb",
              borderColor: colors.grid,
              color: isDark ? "#ffffff" : "#0b0b0b",
            }}
          />
          <Area dataKey="lower" stackId="confidence" stroke="none" fill="transparent" isAnimationActive={false} />
          <Area dataKey="band" stackId="confidence" stroke="none" fill={FORECAST_COLOR} fillOpacity={0.15} isAnimationActive={false} />
          <Line type="monotone" dataKey="close" stroke={colors.blue} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="expected"
            stroke={FORECAST_COLOR}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
            isAnimationActive={false}
            filter="url(#forecastGlow)"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 text-xs text-ink-muted mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.blue }} /> Historical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded border-t-2 border-dashed" style={{ borderColor: FORECAST_COLOR }} /> AI Forecast (expected)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded" style={{ backgroundColor: FORECAST_COLOR, opacity: 0.3 }} /> Confidence corridor
        </span>
      </div>
    </div>
  );
}
