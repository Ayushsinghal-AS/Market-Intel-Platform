import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import StatCard from "../StatCard";
import { useTheme } from "../../contexts/ThemeContext";
import { CHART_COLORS } from "../../utils/chartTheme";

const OPTION_TYPES = ["Call", "Put"];
const POSITIONS = ["Long", "Short"];
const POINTS = 41;

function payoffAt(optionType, position, strike, premium, spot) {
  const intrinsic = optionType === "Call" ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0);
  const longPayoff = intrinsic - premium;
  return position === "Long" ? longPayoff : -longPayoff;
}

export default function OptionsPayoffVisualizer() {
  const { isDark } = useTheme();
  const colors = CHART_COLORS[isDark ? "dark" : "light"];
  const [optionType, setOptionType] = useState("Call");
  const [position, setPosition] = useState("Long");
  const [strike, setStrike] = useState(1000);
  const [premium, setPremium] = useState(25);

  const { chartData, breakeven, maxProfit, maxLoss, zeroOffset } = useMemo(() => {
    const low = strike * 0.7;
    const high = strike * 1.3;
    const step = (high - low) / (POINTS - 1);
    const chartData = Array.from({ length: POINTS }, (_, i) => {
      const spot = low + step * i;
      return { spot: Math.round(spot), payoff: Math.round(payoffAt(optionType, position, strike, premium, spot) * 100) / 100 };
    });

    const payoffs = chartData.map((d) => d.payoff);
    const dataMax = Math.max(...payoffs, 0);
    const dataMin = Math.min(...payoffs, 0);
    // Fraction from the top of the y-domain where the payoff line crosses
    // zero -- used to split a single gradient into a green-above/red-below
    // fill without needing two separately-clipped <Area> shapes.
    const zeroOffset = dataMax === dataMin ? 0 : dataMax / (dataMax - dataMin);

    const isLongCall = optionType === "Call" && position === "Long";
    const isShortCall = optionType === "Call" && position === "Short";
    const isLongPut = optionType === "Put" && position === "Long";
    const isShortPut = optionType === "Put" && position === "Short";

    const breakeven = optionType === "Call" ? strike + premium : strike - premium;
    const maxProfit = isLongCall ? "Unlimited" : isShortCall ? `₹${premium}` : isLongPut ? `₹${(strike - premium).toLocaleString("en-IN")}` : `₹${premium}`;
    const maxLoss = isLongCall ? `₹${premium}` : isShortCall ? "Unlimited" : isLongPut ? `₹${premium}` : `₹${(strike - premium).toLocaleString("en-IN")}`;

    return { chartData, breakeven, maxProfit, maxLoss, zeroOffset };
  }, [optionType, position, strike, premium]);

  return (
    <div className="space-y-6">
      <div className="glass-card p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-ink-muted block mb-1.5">Option Type</label>
            <div className="flex gap-1">
              {OPTION_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setOptionType(t)}
                  className={`flex-1 text-sm px-3 py-1.5 rounded-md transition-colors ${
                    optionType === t ? "bg-series-blue-light dark:bg-series-blue-dark text-white" : "border border-black/10 dark:border-white/10"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-muted block mb-1.5">Position</label>
            <div className="flex gap-1">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPosition(p)}
                  className={`flex-1 text-sm px-3 py-1.5 rounded-md transition-colors ${
                    position === p ? "bg-series-blue-light dark:bg-series-blue-dark text-white" : "border border-black/10 dark:border-white/10"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-ink-muted block mb-1.5">Strike Price (₹)</label>
            <input
              type="number"
              value={strike}
              onChange={(e) => setStrike(Number(e.target.value))}
              className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted block mb-1.5">Premium (₹)</label>
            <input
              type="number"
              value={premium}
              onChange={(e) => setPremium(Number(e.target.value))}
              className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-ink-muted">Single-leg payoff only. Multi-leg strategies (spreads, straddles) aren't modeled here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Breakeven" value={`₹${breakeven.toLocaleString("en-IN")}`} />
        <StatCard label="Max Profit" value={maxProfit} tone="good" />
        <StatCard label="Max Loss" value={maxLoss} tone="critical" />
      </div>

      <div className="glass-card p-4">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="payoffSplit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                <stop offset={`${zeroOffset * 100}%`} stopColor="#10B981" stopOpacity={0.05} />
                <stop offset={`${zeroOffset * 100}%`} stopColor="#EF4444" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="payoffStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset={`${zeroOffset * 100}%`} stopColor="#10B981" />
                <stop offset={`${zeroOffset * 100}%`} stopColor="#EF4444" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis dataKey="spot" tick={{ fontSize: 11, fill: colors.tick }} minTickGap={30} />
            <YAxis tick={{ fontSize: 11, fill: colors.tick }} width={48} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                backgroundColor: isDark ? "#111827" : "#fcfcfb",
                borderColor: colors.grid,
                color: isDark ? "#ffffff" : "#0b0b0b",
              }}
            />
            <ReferenceLine y={0} stroke={colors.tick} strokeDasharray="4 4" />
            <ReferenceLine x={strike} stroke={colors.tick} strokeDasharray="2 2" label={{ value: "Strike", fontSize: 10, fill: colors.tick }} />
            <Area
              type="monotone"
              dataKey="payoff"
              stroke="url(#payoffStroke)"
              strokeWidth={2}
              fill="url(#payoffSplit)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
