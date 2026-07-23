import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../api";
import StatCard from "../components/StatCard";
import EquityCurveChart from "../components/EquityCurveChart";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import TiltCard from "../components/ui/TiltCard";
import { SkeletonStatGrid, SkeletonChartBlock, SkeletonTableRows } from "../components/ui/Skeleton";
import PeerComparisonTable from "../components/PeerComparisonTable";
import SentimentBadge from "../components/SentimentBadge";
import ForecastChart from "../components/ForecastChart";
import ForecastControls from "../components/ForecastControls";
import SignalDial from "../components/SignalDial";
import { useMarketHours } from "../contexts/MarketHoursContext";
import { useLivePrice } from "../hooks/useLivePrice";
import { useTickFlash } from "../hooks/useTickFlash";

function fmt(n, opts) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-IN", opts);
}

export default function StockDetail() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState(null);
  const { isMarketOpen } = useMarketHours();
  const livePrice = useLivePrice(ticker, isMarketOpen, data?.price);
  const priceFlash = useTickFlash(livePrice);
  const [horizonDays, setHorizonDays] = useState(7);
  const [volatilityMultiplier, setVolatilityMultiplier] = useState(1);
  const [extraGrowthPct, setExtraGrowthPct] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    api
      .stockOverview(ticker)
      .then(setData)
      .catch(() => setError("Could not find data for that stock. Try a ticker like RELIANCE.NS or a name like Infosys."))
      .finally(() => setLoading(false));

    setNews(null);
    api.stockNews(ticker).then(setNews).catch(() => {});
  }, [ticker]);

  const displayPrice = livePrice ?? data?.price;
  const changePct = data?.previous_close && displayPrice != null ? ((displayPrice - data.previous_close) / data.previous_close) * 100 : null;

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <button onClick={() => navigate("/stock")} className="text-xs text-ink-muted hover:underline">
        ← Search another stock
      </button>

      {loading && (
        <div className="space-y-6">
          <SkeletonStatGrid count={4} />
          <SkeletonChartBlock />
        </div>
      )}
      {error && <div className="text-status-critical text-sm">{error}</div>}

      {data && !loading && (
        <>
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <TiltCard className="glass-card p-4 mb-3">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold">{data.name}</h2>
                  <p className="text-xs text-ink-muted">
                    {data.ticker} · {data.sector || "—"} {data.industry ? `· ${data.industry}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-semibold transition-colors duration-300 ${
                      priceFlash === "up" ? "text-status-good" : priceFlash === "down" ? "text-status-critical" : ""
                    }`}
                    title={isMarketOpen ? "Live price: real sync every ~12s, simulated micro-movement between syncs" : "Market closed — showing last known price"}
                  >
                    ₹<AnimatedNumber value={displayPrice} decimals={2} />
                  </div>
                  {changePct != null && (
                    <div className={`text-xs tabular-nums ${changePct >= 0 ? "text-status-good" : "text-status-critical"}`}>
                      {changePct >= 0 ? "+" : ""}
                      {changePct.toFixed(2)}% · Prev close ₹{fmt(data.previous_close)}
                    </div>
                  )}
                </div>
              </div>
            </TiltCard>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Day Range" value={`${fmt(data.day_low)} – ${fmt(data.day_high)}`} />
              <StatCard label="52W Range" value={`${fmt(data.fifty_two_week_low)} – ${fmt(data.fifty_two_week_high)}`} />
              <StatCard label="Volume" value={fmt(data.volume)} sub={`avg ${fmt(data.average_volume)}`} />
              <StatCard label="Market Cap" value={data.market_cap ? `₹${fmt(data.market_cap / 1e7, { maximumFractionDigits: 0 })} Cr` : "—"} />
              <StatCard label="P/E Ratio" value={fmt(data.pe_ratio, { maximumFractionDigits: 2 })} />
              <StatCard label="P/B Ratio" value={fmt(data.pb_ratio, { maximumFractionDigits: 2 })} />
              <StatCard label="ROE" value={data.roe_pct != null ? `${data.roe_pct}%` : "—"} />
              <StatCard label="Revenue" value={data.revenue ? `₹${fmt(data.revenue / 1e7, { maximumFractionDigits: 0 })} Cr` : "—"} />
              <StatCard label="Profit Margin" value={data.profit_margin_pct != null ? `${data.profit_margin_pct}%` : "—"} />
              <StatCard label="Dividend Yield" value={data.dividend_yield_pct != null ? `${data.dividend_yield_pct}%` : "—"} />
              <StatCard label="Analyst View" value={data.analyst_recommendation} />
              <StatCard label="Analyst Target" value={data.analyst_target_price ? `₹${fmt(data.analyst_target_price)}` : "—"} />
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }}>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Price Chart (6M)</h2>
            <div className="glass-card p-4">
              <EquityCurveChart data={data.chart} lines={[{ key: "close", label: "Close", color: "blue" }]} />
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }}>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Technical Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <StatCard
                label="Verdict"
                value={data.technical.verdict}
                tone={data.technical.verdict.includes("BUY") ? "good" : data.technical.verdict.includes("SELL") ? "critical" : "neutral"}
                sub={`Confidence: ${data.technical.confidence}`}
              />
              <StatCard label="RSI (14)" value={data.technical.rsi} />
              <StatCard label="EMA 20 / 50 / 200" value={`${fmt(data.technical.ema20)} / ${fmt(data.technical.ema50)} / ${fmt(data.technical.ema200)}`} />
              <StatCard label="MACD" value={`${data.technical.macd} / ${data.technical.macd_signal}`} />
              <StatCard label="Bollinger Bands" value={`${fmt(data.technical.bollinger_lower)} – ${fmt(data.technical.bollinger_upper)}`} />
              <StatCard label="Stochastic %K" value={data.technical.stochastic_k ?? "—"} />
              <StatCard label="Support Levels" value={data.technical.support_levels.join(", ") || "—"} />
              <StatCard label="Resistance Levels" value={data.technical.resistance_levels.join(", ") || "—"} />
            </div>
            <div className="glass-card p-3 text-sm">
              <span className="text-ink-muted">Volume signal: </span>
              <span className="font-medium">{data.technical.volume_anomaly.label}</span>
              {data.technical.volume_anomaly.volume_ratio != null && (
                <span className="text-ink-muted"> (volume ratio {data.technical.volume_anomaly.volume_ratio}x)</span>
              )}
            </div>
            <div className="mt-2 text-xs text-ink-muted">Signals: {data.technical.signals.join(" · ")}</div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.12 }}>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">AI Price Forecast</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 glass-card p-4">
                <ForecastChart
                  chart={data.chart}
                  lastLivePrice={displayPrice}
                  horizonDays={horizonDays}
                  volatilityMultiplier={volatilityMultiplier}
                  extraGrowthPct={extraGrowthPct}
                />
              </div>
              <div className="space-y-4">
                <ForecastControls
                  horizonDays={horizonDays}
                  onHorizonChange={setHorizonDays}
                  volatilityMultiplier={volatilityMultiplier}
                  onVolatilityChange={setVolatilityMultiplier}
                  extraGrowthPct={extraGrowthPct}
                  onGrowthChange={setExtraGrowthPct}
                />
                <SignalDial verdict={data.technical.verdict} overallSentiment={news?.summary?.overall_sentiment ?? "Neutral"} />
              </div>
            </div>
            <p className="text-xs text-ink-muted mt-2">
              Statistical projection based on historical volatility &amp; trend — not a prediction of future prices or trading advice.
            </p>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.15 }}>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">Peer Comparison — {data.sector || "Sector"}</h2>
            <PeerComparisonTable
              ticker={data.ticker}
              subject={{
                ticker: data.ticker,
                name: data.name,
                price: data.price,
                change_pct: changePct,
                market_cap: data.market_cap,
                pe_ratio: data.pe_ratio,
                pb_ratio: data.pb_ratio,
                roe_pct: data.roe_pct,
                dividend_yield_pct: data.dividend_yield_pct,
              }}
            />
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.2 }}>
            <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wide">News &amp; Sentiment</h2>
            {!news && <SkeletonTableRows rows={4} cols={1} />}
            {news && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <StatCard label="Positive" value={news.summary.positive} tone="good" />
                  <StatCard label="Neutral" value={news.summary.neutral} />
                  <StatCard label="Negative" value={news.summary.negative} tone="critical" />
                </div>
                <div className="space-y-2">
                  {news.articles.map((a, i) => (
                    <div key={i} className="glass-card p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {a.link ? (
                          <a href={a.link} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline">
                            {a.title}
                          </a>
                        ) : (
                          <div className="text-sm font-medium">{a.title}</div>
                        )}
                        <div className="text-xs text-ink-muted mt-0.5">{a.publisher}</div>
                      </div>
                      <SentimentBadge sentiment={a.sentiment} impactScore={a.impact_score} />
                    </div>
                  ))}
                  {news.articles.length === 0 && <p className="text-sm text-ink-muted">No recent news found for this stock.</p>}
                </div>
              </>
            )}
          </motion.section>
        </>
      )}
    </div>
  );
}
