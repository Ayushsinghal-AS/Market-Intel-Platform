import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

export default function AnimatedNumber({ value, decimals = 2, prefix = "", suffix = "", className = "" }) {
  const [display, setDisplay] = useState(value ?? 0);
  const prevValue = useRef(value ?? 0);

  useEffect(() => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return;
    const controls = animate(prevValue.current, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  if (value === null || value === undefined) return <span className={className}>—</span>;

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {display.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}
