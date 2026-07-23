import { useMarketHours } from "../../contexts/MarketHoursContext";

export default function LiveMarketBadge() {
  const { isMarketOpen } = useMarketHours();

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full shrink-0"
      title={
        isMarketOpen
          ? "Real price refreshes every ~12s during market hours; between refreshes the price shows simulated micro-movement for visual effect."
          : "Outside NSE trading hours (Mon–Fri, 9:15 AM–3:30 PM IST). Live prices are paused."
      }
    >
      <span className="relative flex h-2 w-2">
        {isMarketOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-good opacity-75" />}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isMarketOpen ? "bg-status-good" : "bg-status-critical"}`} />
      </span>
      <span className={isMarketOpen ? "text-status-good" : "text-status-critical"}>
        {isMarketOpen ? "LIVE MARKET" : "MARKET CLOSED"}
      </span>
    </div>
  );
}
