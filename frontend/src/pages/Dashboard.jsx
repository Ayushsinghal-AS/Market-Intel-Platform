import { useEffect, useState } from "react";
import { api } from "../api";
import StatCard from "../components/StatCard";
import Heatmap from "../components/Heatmap";
import StockDetailCard from "../components/StockDetailCard";

export default function Dashboard() {
  const [heatmap, setHeatmap] = useState(null);
  const [breadth, setBreadth] = useState(null);
  const [rs, setRs] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedSector, setSelectedSector] = useState(null);
  const [sectorStocks, setSectorStocks] = useState(null);
  const [sectorLoading, setSectorLoading] = useState(false);
  const [sectorError, setSectorError] = useState(null);

  useEffect(() => {
    Promise.all([api.heatmap(), api.breadth(), api.relativeStrength()])
      .then(([h, b, r]) => {
        setHeatmap(h);
        setBreadth(b);
        setRs(r);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const selectSector = (sector) => {
    setSelectedSector(sector);
    setSectorStocks(null);
    setSectorError(null);
    setSectorLoading(true);
    api
      .sectorStocks(sector)
      .then((res) => setSectorStocks(res.stocks))
      .catch((e) => setSectorError(e.message))
      .finally(() => setSectorLoading(false));
  };

  if (loading) return <div className="p-6 text-ink-muted">Fetching live Nifty 50 data from Yahoo Finance…</div>;
  if (error) return <div className="p-6 text-status-critical">Failed to load: {error}</div>;

  const regimeTone = breadth.market_regime === "Bullish" ? "good" : breadth.market_regime === "Bearish" ? "critical" : "neutral";

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <section>
        <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Market Breadth</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Market Regime" value={breadth.market_regime} tone={regimeTone} />
          <StatCard label="Advance / Decline" value={`${breadth.advances} / ${breadth.declines}`} sub={`ratio ${breadth.advance_decline_ratio}`} />
          <StatCard label="% Above 50 DMA" value={`${breadth.pct_above_50dma}%`} />
          <StatCard label="% Above 200 DMA" value={`${breadth.pct_above_200dma}%`} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">
          Sector Heatmap — Nifty 50 (1D %) <span className="normal-case font-normal text-ink-muted">— click a sector for stock-level detail</span>
        </h2>
        <Heatmap tickers={heatmap.tickers} onSelectSector={selectSector} selectedSector={selectedSector} />
      </section>

      {selectedSector && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">{selectedSector} — Stock Detail</h2>
            <button onClick={() => setSelectedSector(null)} className="text-xs text-ink-muted hover:underline">
              Close
            </button>
          </div>
          {sectorLoading && <div className="text-ink-muted text-sm">Fetching fundamentals + technicals for {selectedSector}…</div>}
          {sectorError && <div className="text-status-critical text-sm">{sectorError}</div>}
          {sectorStocks && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sectorStocks.map((s) => (
                <StockDetailCard key={s.ticker} stock={s} />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">
          Relative Strength vs Nifty 50 ({rs.window_days}-day)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5 text-ink-muted text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2">Ticker</th>
                <th className="text-left px-3 py-2">Sector</th>
                <th className="text-right px-3 py-2">Return %</th>
                <th className="text-right px-3 py-2">RS Score</th>
                <th className="text-right px-3 py-2">RS Rating</th>
              </tr>
            </thead>
            <tbody>
              {rs.ranking.slice(0, 15).map((row) => (
                <tr key={row.ticker} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-3 py-1.5 font-medium">{row.ticker.replace(".NS", "")}</td>
                  <td className="px-3 py-1.5 text-ink-secondary-light dark:text-ink-secondary-dark">{row.sector}</td>
                  <td className={`px-3 py-1.5 text-right tabular-nums ${row.return_pct >= 0 ? "text-status-good" : "text-status-critical"}`}>
                    {row.return_pct}%
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{row.rs_score}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{row.rs_rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
