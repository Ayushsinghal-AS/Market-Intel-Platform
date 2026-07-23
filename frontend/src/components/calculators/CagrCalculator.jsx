import { useMemo, useState } from "react";
import SliderInput from "../ui/SliderInput";
import StatCard from "../StatCard";

export default function CagrCalculator() {
  const [initial, setInitial] = useState(100000);
  const [final, setFinalValue] = useState(200000);
  const [years, setYears] = useState(5);

  const cagrPct = useMemo(() => {
    if (initial <= 0 || years <= 0) return null;
    return (Math.pow(final / initial, 1 / years) - 1) * 100;
  }, [initial, final, years]);

  return (
    <div className="space-y-6">
      <div className="glass-card p-4 space-y-4">
        <SliderInput label="Initial Value" value={initial} onChange={setInitial} min={1000} max={10000000} step={1000} prefix="₹" />
        <SliderInput label="Final Value" value={final} onChange={setFinalValue} min={1000} max={20000000} step={1000} prefix="₹" />
        <SliderInput label="Time Period" value={years} onChange={setYears} min={1} max={40} step={1} suffix=" yrs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Initial Value" value={`₹${initial.toLocaleString("en-IN")}`} />
        <StatCard label="Final Value" value={`₹${final.toLocaleString("en-IN")}`} />
        <StatCard
          label="CAGR"
          value={cagrPct != null ? `${cagrPct.toFixed(2)}%` : "—"}
          tone={cagrPct != null ? (cagrPct >= 0 ? "good" : "critical") : "neutral"}
        />
      </div>
    </div>
  );
}
