import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function Sparkline({ data, dataKey = "close", color = "#2a78d6" }) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
