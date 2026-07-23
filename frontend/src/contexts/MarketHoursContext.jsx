import { createContext, useContext, useEffect, useState } from "react";

const MarketHoursContext = createContext(null);
const STORAGE_KEY = "mip_simulate_market_hours";

const IST_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const WEEKDAYS = new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);
const OPEN_MINUTES = 9 * 60 + 15; // 09:15 IST
const CLOSE_MINUTES = 15 * 60 + 30; // 15:30 IST

// NSE/BSE trading window is IST regardless of the viewer's local timezone,
// so this must read wall-clock IST via Intl rather than the browser's
// local Date getters.
function isRealMarketOpen(date = new Date()) {
  const parts = Object.fromEntries(IST_FORMATTER.formatToParts(date).map((p) => [p.type, p.value]));
  if (!WEEKDAYS.has(parts.weekday)) return false;
  const hour = Number(parts.hour) % 24; // some environments report midnight as "24"
  const minutesSinceMidnight = hour * 60 + Number(parts.minute);
  return minutesSinceMidnight >= OPEN_MINUTES && minutesSinceMidnight <= CLOSE_MINUTES;
}

export function MarketHoursProvider({ children }) {
  const [realOpen, setRealOpen] = useState(() => isRealMarketOpen());
  const [simulateOverride, setSimulateOverrideState] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");

  useEffect(() => {
    const id = setInterval(() => setRealOpen(isRealMarketOpen()), 30_000);
    return () => clearInterval(id);
  }, []);

  const setSimulateOverride = (value) => {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    setSimulateOverrideState(value);
  };

  const isMarketOpen = realOpen || simulateOverride;

  return (
    <MarketHoursContext.Provider value={{ isMarketOpen, realOpen, simulateOverride, setSimulateOverride }}>
      {children}
    </MarketHoursContext.Provider>
  );
}

export function useMarketHours() {
  const ctx = useContext(MarketHoursContext);
  if (!ctx) throw new Error("useMarketHours must be used within a MarketHoursProvider");
  return ctx;
}
