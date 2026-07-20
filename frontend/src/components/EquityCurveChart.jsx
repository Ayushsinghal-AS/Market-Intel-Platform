import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Fixed categorical order (never cycled): slot 1 blue, slot 2 green.
const SERIES_COLORS = { blue: "#2a78d6", green: "#008300" };

export default function EquityCurveChart({ data, lines }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#898781" }} minTickGap={40} />
        <YAxis tick={{ fontSize: 11, fill: "#898781" }} width={48} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          labelStyle={{ fontWeight: 600 }}
        />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
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
