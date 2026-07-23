import { useEffect, useRef, useState } from "react";
import { api } from "../api";

const REAL_SYNC_MS = 12_000; // matches backend CACHE_TTL_LIVE
const JITTER_MS = 1500;
const JITTER_MAGNITUDE = 0.0005; // +/- 0.05% of the last real price -- cosmetic only

// Real price comes from /stocks/{ticker}/live every ~12s (backend-cached,
// cheap). Between real syncs, while the market is open, this nudges the
// displayed price by a small bounded random delta purely for visual motion --
// it always re-anchors to the real value on the next sync and never drifts
// away from it. Off-market-hours it fetches once and stays static.
export function useLivePrice(ticker, isMarketOpen, fallbackPrice) {
  const [price, setPrice] = useState(fallbackPrice ?? null);
  const realPriceRef = useRef(fallbackPrice ?? null);

  useEffect(() => {
    let cancelled = false;
    realPriceRef.current = fallbackPrice ?? null;
    setPrice(fallbackPrice ?? null);

    const syncReal = () => {
      api
        .liveQuote(ticker)
        .then((res) => {
          if (cancelled || res.error) return;
          realPriceRef.current = res.price;
          setPrice(res.price);
        })
        .catch(() => {});
    };

    syncReal();
    if (!isMarketOpen) return () => { cancelled = true; };

    const realInterval = setInterval(syncReal, REAL_SYNC_MS);
    const jitterInterval = setInterval(() => {
      if (realPriceRef.current == null) return;
      const delta = realPriceRef.current * JITTER_MAGNITUDE * (Math.random() * 2 - 1);
      setPrice(Math.round((realPriceRef.current + delta) * 100) / 100);
    }, JITTER_MS);

    return () => {
      cancelled = true;
      clearInterval(realInterval);
      clearInterval(jitterInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, isMarketOpen]);

  return price;
}
