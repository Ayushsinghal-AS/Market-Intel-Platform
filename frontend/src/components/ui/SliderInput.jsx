export default function SliderInput({ label, value, onChange, min, max, step = 1, prefix = "", suffix = "" }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-ink-muted">{label}</label>
        <div className="flex items-center gap-1 text-sm font-semibold tabular-nums">
          {prefix && <span className="text-ink-muted">{prefix}</span>}
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-24 rounded border border-black/10 dark:border-white/10 bg-transparent px-1.5 py-0.5 text-right text-sm"
          />
          {suffix && <span className="text-ink-muted">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-series-blue-light dark:accent-series-blue-dark"
      />
    </div>
  );
}
