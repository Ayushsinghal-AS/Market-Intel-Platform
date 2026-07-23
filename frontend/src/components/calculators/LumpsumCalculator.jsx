import { useMemo, useState } from "react";
import SliderInput from "../ui/SliderInput";
import StatCard from "../StatCard";
import EquityCurveChart from "../EquityCurveChart";

export default function LumpsumCalculator() {
  const [principal, setPrincipal] = useState(100000);
  const [annualRate, setAnnualRate] = useState(12);
  const [years, setYears] = useState(10);

  const { maturity, gain, chartData } = useMemo(() => {
    const r = annualRate / 100;
    const maturity = principal * (1 + r) ** years;
    const chartData = Array.from({ length: years }, (_, idx) => {
      const y = idx + 1;
      return { date: `Yr ${y}`, invested: principal, value: Math.round(principal * (1 + r) ** y) };
    });
    return { maturity, gain: maturity - principal, chartData };
  }, [principal, annualRate, years]);

  return (
    <div className="space-y-6">
      <div className="glass-card p-4 space-y-4">
        <SliderInput label="Investment Amount" value={principal} onChange={setPrincipal} min={1000} max={10000000} step={1000} prefix="₹" />
        <SliderInput label="Expected Annual Return" value={annualRate} onChange={setAnnualRate} min={1} max={30} step={0.5} suffix="%" />
        <SliderInput label="Time Period" value={years} onChange={setYears} min={1} max={40} step={1} suffix=" yrs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Invested Amount" value={`₹${principal.toLocaleString("en-IN")}`} />
        <StatCard label="Est. Maturity Value" value={`₹${Math.round(maturity).toLocaleString("en-IN")}`} tone="good" />
        <StatCard label="Est. Gain" value={`₹${Math.round(gain).toLocaleString("en-IN")}`} tone="good" />
      </div>

      <div className="glass-card p-4">
        <EquityCurveChart
          data={chartData}
          lines={[
            { key: "invested", label: "Invested", color: "green" },
            { key: "value", label: "Portfolio Value", color: "blue" },
          ]}
        />
      </div>
    </div>
  );
}
