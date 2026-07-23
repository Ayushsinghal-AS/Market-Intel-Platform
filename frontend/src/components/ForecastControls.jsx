import SliderInput from "./ui/SliderInput";

const HORIZONS = [
  { days: 7, label: "Next 7 Days" },
  { days: 30, label: "Next 30 Days" },
];

export default function ForecastControls({
  horizonDays,
  onHorizonChange,
  volatilityMultiplier,
  onVolatilityChange,
  extraGrowthPct,
  onGrowthChange,
}) {
  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex gap-1">
        {HORIZONS.map((h) => (
          <button
            key={h.days}
            onClick={() => onHorizonChange(h.days)}
            className={`flex-1 text-sm px-3 py-1.5 rounded-md transition-colors ${
              horizonDays === h.days ? "bg-series-blue-light dark:bg-series-blue-dark text-white" : "border border-black/10 dark:border-white/10"
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>
      <SliderInput
        label="Volatility Index"
        value={volatilityMultiplier}
        onChange={onVolatilityChange}
        min={0.5}
        max={3}
        step={0.1}
        suffix="x"
      />
      <SliderInput
        label="Expected Revenue Growth"
        value={extraGrowthPct}
        onChange={onGrowthChange}
        min={-20}
        max={40}
        step={1}
        suffix="%"
      />
    </div>
  );
}
