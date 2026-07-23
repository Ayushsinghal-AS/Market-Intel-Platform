import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../contexts/ThemeContext";
import { CHART_COLORS } from "../utils/chartTheme";

export default function EquityCurveChart({ data, lines }) {
  const { isDark } = useTheme();
  // Fixed categorical order (never cycled): slot 1 blue, slot 2 green.
  const SERIES_COLORS = CHART_COLORS[isDark ? "dark" : "light"];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={SERIES_COLORS.grid}
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: SERIES_COLORS.tick }}
          minTickGap={40}
        />
        <YAxis tick={{ fontSize: 11, fill: SERIES_COLORS.tick }} width={48} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            backgroundColor: isDark ? "#111827" : "#fcfcfb",
            borderColor: SERIES_COLORS.grid,
            color: isDark ? "#ffffff" : "#0b0b0b",
          }}
          labelStyle={{ fontWeight: 600, color: isDark ? "#ffffff" : "#0b0b0b" }}
        />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: SERIES_COLORS.tick }} />}
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={SERIES_COLORS[line.color] || SERIES_COLORS.blue}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
