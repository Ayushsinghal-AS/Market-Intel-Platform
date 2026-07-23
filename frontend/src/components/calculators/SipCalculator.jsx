import { useMemo, useState } from "react";
import SliderInput from "../ui/SliderInput";
import StatCard from "../StatCard";
import EquityCurveChart from "../EquityCurveChart";

// Annuity-due future value (SIP invested at the start of each month).
function sipFutureValue(monthly, annualRatePct, months) {
  const i = annualRatePct / 12 / 100;
  if (i === 0) return monthly * months;
  return monthly * (((1 + i) ** months - 1) / i) * (1 + i);
}

export default function SipCalculator() {
  const [monthly, setMonthly] = useState(10000);
  const [annualRate, setAnnualRate] = useState(12);
  const [years, setYears] = useState(10);

  const { invested, maturity, gain, chartData } = useMemo(() => {
    const months = years * 12;
    const maturity = sipFutureValue(monthly, annualRate, months);
    const invested = monthly * months;
    const chartData = Array.from({ length: years }, (_, idx) => {
      const y = idx + 1;
      return {
        date: `Yr ${y}`,
        invested: Math.round(monthly * y * 12),
        value: Math.round(sipFutureValue(monthly, annualRate, y * 12)),
      };
    });
    return { invested, maturity, gain: maturity - invested, chartData };
  }, [monthly, annualRate, years]);

  return (
    <div className="space-y-6">
      <div className="glass-card p-4 space-y-4">
        <SliderInput label="Monthly Investment" value={monthly} onChange={setMonthly} min={500} max={200000} step={500} prefix="₹" />
        <SliderInput label="Expected Annual Return" value={annualRate} onChange={setAnnualRate} min={1} max={30} step={0.5} suffix="%" />
        <SliderInput label="Time Period" value={years} onChange={setYears} min={1} max={40} step={1} suffix=" yrs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Invested Amount" value={`₹${invested.toLocaleString("en-IN")}`} />
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
