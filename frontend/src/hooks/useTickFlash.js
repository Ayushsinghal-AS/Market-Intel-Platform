import { useEffect, useRef, useState } from "react";

// Tracks a numeric value and briefly reports "up"/"down" right after it
// changes, so a consumer can flash the display green/red on a tick.
export function useTickFlash(value, duration = 500) {
  const [flash, setFlash] = useState(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value == null || prevRef.current == null || value === prevRef.current) {
      prevRef.current = value;
      return;
    }
    setFlash(value > prevRef.current ? "up" : "down");
    prevRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), duration);
    return () => clearTimeout(timer);
  }, [flash, duration]);

  return flash;
}
