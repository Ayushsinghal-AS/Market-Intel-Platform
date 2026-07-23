import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { heatColor, textColorFor } from "../utils/colors";
import { useTheme } from "../contexts/ThemeContext";
import Icon from "./icons/Icon";

export default function Heatmap({ tickers, onSelectSector, selectedSector }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  const bySector = tickers.reduce((acc, t) => {
    (acc[t.sector] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(bySector).map(([sector, stocks]) => (
        <div key={sector}>
          <button
            onClick={() => onSelectSector?.(sector)}
            className={`text-xs font-medium mb-1.5 hover:underline ${selectedSector === sector ? "text-series-blue-light dark:text-series-blue-dark" : "text-ink-muted"}`}
          >
            {sector} {onSelectSector && "→"}
          </button>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
            {stocks.map((s) => (
              <motion.div
                key={s.ticker}
                role="button"
                onClick={() => onSelectSector?.(sector)}
                onMouseEnter={() => setHovered(s.ticker)}
                onMouseLeave={() => setHovered((h) => (h === s.ticker ? null : h))}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="relative rounded-md px-2 py-3 flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                style={{ backgroundColor: heatColor(s.change_pct, isDark), color: textColorFor(s.change_pct, isDark) }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/stock/${s.ticker}`);
                  }}
                  title={`Open ${s.ticker}`}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded opacity-60 hover:opacity-100 hover:bg-black/10"
                >
                  <Icon name="arrowUpRight" className="w-3 h-3" strokeWidth={2.5} />
                </button>
                <span className="text-xs font-semibold">{s.ticker.replace(".NS", "")}</span>
                <span className="text-xs tabular-nums">
                  {s.change_pct > 0 ? "+" : ""}
                  {s.change_pct}%
                </span>

                <AnimatePresence>
                  {hovered === s.ticker && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md glass-card px-2 py-1 text-[11px] text-ink-primary-light dark:text-ink-primary-dark shadow-lg pointer-events-none"
                    >
                      <div className="font-semibold">{s.ticker}</div>
                      <div className="text-ink-muted">{s.sector}</div>
                      <div className={s.change_pct >= 0 ? "text-status-good" : "text-status-critical"}>
                        {s.change_pct > 0 ? "+" : ""}
                        {s.change_pct}%
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
