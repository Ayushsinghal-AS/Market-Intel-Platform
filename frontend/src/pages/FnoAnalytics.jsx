import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api";
import IndexSelectorBar from "../components/fno/IndexSelectorBar";
import OptionChainTable from "../components/fno/OptionChainTable";
import OiBarChart from "../components/fno/OiBarChart";
import SignalModal from "../components/fno/SignalModal";
import TradeHealthBar from "../components/fno/TradeHealthBar";
import { SkeletonStatGrid, SkeletonTableRows } from "../components/ui/Skeleton";
import Icon from "../components/icons/Icon";
import { useMarketHours } from "../contexts/MarketHoursContext";

// Matches the backend's CACHE_TTL_FNO_CHAIN -- polling faster than the
// server-side recompute cadence would just re-fetch the same cached response.
const POLL_MS = 15_000;

export default function FnoAnalytics() {
  const [index, setIndex] = useState("NIFTY");
  const [expiry, setExpiry] = useState(null);
  const [viewMode, setViewMode] = useState("compact");
  const [chain, setChain] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedSignal, setSelectedSignal] = useState(null); // { strike, side, leg }
  const [tracked, setTracked] = useState([]); // [{ strike, side, entry, target, stopLoss }]
  const { isMarketOpen } = useMarketHours();
  const expiryRef = useRef(expiry);
  expiryRef.current = expiry;

  const loadChain = useCallback(
    (showSpinner) => {
      if (showSpinner) setLoading(true);
      setError(null);
      api
        .fnoChain(index, expiryRef.current)
        .then((res) => {
          setChain(res);
          setLastUpdated(new Date());
          if (!expiryRef.current) setExpiry(res.expiry);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    },
    [index]
  );

  // Fetch immediately on index/expiry change...
  useEffect(() => {
    loadChain(true);
  }, [loadChain, expiry]);

  // ...then keep it live while the market's open, same cadence as the
  // backend's chain cache, so the page doesn't just sit on a stale snapshot.
  useEffect(() => {
    if (!isMarketOpen) return;
    const id = setInterval(() => loadChain(false), POLL_MS);
    return () => clearInterval(id);
  }, [loadChain, isMarketOpen]);

  const switchIndex = (next) => {
    setIndex(next);
    setExpiry(null); // resolve to that index's nearest expiry
  };

  const track = (strike, side, leg) => {
    setTracked((prev) => {
      if (prev.some((p) => p.strike === strike && p.side === side)) return prev;
      return [...prev, { strike, side, entry: leg.ltp, target: leg.screener.target, stopLoss: leg.screener.stop_loss }];
    });
  };

  const dismissTracked = (strike, side) => {
    setTracked((prev) => prev.filter((p) => !(p.strike === strike && p.side === side)));
  };

  const currentPriceFor = (strike, side) => {
    const row = chain?.strikes?.find((s) => s.strike === strike);
    return row ? row[side].ltp : undefined;
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-lg font-bold">FnO Options Analytics</h1>
        <p className="text-xs text-ink-muted">NIFTY 50 · BANKNIFTY · SENSEX option chain, Greeks &amp; screener</p>
      </div>

      <div className="glass-card p-3 flex items-start gap-2 border border-status-warning/40">
        <Icon name="shield" className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
        <p className="text-xs text-ink-secondary-light dark:text-ink-secondary-dark">
          {chain?.note ||
            "Illustrative option chain — strikes/IV/OI/volume are synthetic (Black-Scholes over the real live index price); no free, reliable NSE/BSE option-chain feed exists for this app to use. The screener below is a rule-based educational tool, not a probability claim or trading advice."}
        </p>
      </div>

      {loading && !chain && (
        <div className="space-y-4">
          <SkeletonStatGrid count={4} />
          <SkeletonTableRows rows={8} cols={9} />
        </div>
      )}
      {error && <div className="text-status-critical text-sm">{error}</div>}

      {chain && !chain.error && (
        <>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <IndexSelectorBar
              index={index}
              onIndexChange={switchIndex}
              spot={chain.spot}
              changePct={chain.change_pct}
              expiry={expiry}
              availableExpiries={chain.available_expiries}
              onExpiryChange={setExpiry}
              pcr={chain.pcr}
            />
            <div className="flex items-center gap-2 mt-2 text-[11px] text-ink-muted">
              <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? "bg-status-good animate-pulse" : "bg-ink-muted"}`} />
              <span>
                {isMarketOpen ? `Auto-refreshing every ${POLL_MS / 1000}s` : "Auto-refresh paused (market closed)"}
                {lastUpdated && ` · Last updated ${lastUpdated.toLocaleTimeString("en-IN")}`}
              </span>
              <button
                onClick={() => loadChain(false)}
                disabled={loading}
                className="ml-1 flex items-center gap-1 hover:text-ink-primary-light dark:hover:text-ink-primary-dark disabled:opacity-50"
              >
                <Icon name="history" className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                Refresh now
              </button>
            </div>
          </motion.div>

          {tracked.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tracked.map((p) => (
                <TradeHealthBar
                  key={`${p.strike}-${p.side}`}
                  position={p}
                  currentPrice={currentPriceFor(p.strike, p.side)}
                  onDismiss={() => dismissTracked(p.strike, p.side)}
                />
              ))}
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">Option Chain</h2>
              <div className="flex gap-1">
                {[
                  { key: "compact", label: "Compact" },
                  { key: "greeks", label: "Greeks" },
                ].map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setViewMode(v.key)}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                      viewMode === v.key ? "bg-series-blue-light dark:bg-series-blue-dark text-white" : "border border-black/10 dark:border-white/10"
                    }`}
                  >
                    {v.label} View
                  </button>
                ))}
              </div>
            </div>
            <OptionChainTable
              strikes={chain.strikes}
              spot={chain.spot}
              viewMode={viewMode}
              onSelectSignal={(strike, side, leg) => setSelectedSignal({ strike, side, leg })}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }}>
            <h2 className="text-sm font-semibold text-ink-muted mb-2 uppercase tracking-wide">OI Distribution</h2>
            <OiBarChart strikes={chain.strikes} />
          </motion.div>
        </>
      )}

      <SignalModal
        open={!!selectedSignal}
        onClose={() => setSelectedSignal(null)}
        strike={selectedSignal?.strike}
        side={selectedSignal?.side}
        leg={selectedSignal?.leg}
        onTrack={() => selectedSignal && track(selectedSignal.strike, selectedSignal.side, selectedSignal.leg)}
      />
    </div>
  );
}
