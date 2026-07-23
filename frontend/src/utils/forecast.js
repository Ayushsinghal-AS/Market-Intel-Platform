// Statistical price projection (random-walk-with-drift over real historical
// returns) -- NOT a trained machine-learning model. The "AI Forecast" framing
// in the UI is presentational only, same honesty precedent as
// SentimentBadge.jsx's "AI-look" styling over a real lexicon scorer.

const CONFIDENCE_Z = 1; // ~68% band width in log-return standard deviations
const TRADING_DAYS_PER_YEAR = 252;

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / (values.length || 1);
}

function stdev(values) {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

function toLogReturns(closes) {
  const returns = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0 && closes[i] > 0) returns.push(Math.log(closes[i] / closes[i - 1]));
  }
  return returns;
}

// Computes drift (mean daily log return) and daily volatility (stdev of daily
// log returns) from a stock's real historical close-price series.
export function computeHistoricalStats(chart) {
  const closes = (chart || []).map((d) => d.close).filter((c) => c != null);
  const returns = toLogReturns(closes);
  return {
    drift: mean(returns),
    dailyVol: stdev(returns) || 0.01,
    lastPrice: closes[closes.length - 1] ?? null,
    lastDate: chart?.[chart.length - 1]?.date ?? null,
  };
}

function addTradingDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00`);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) added += 1;
  }
  return date.toISOString().slice(0, 10);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Projects `horizonDays` trading days forward from `lastPrice`/`lastDate`
// using a lognormal random-walk-with-drift model. `volatilityMultiplier` and
// `extraAnnualGrowthPct` are the user-facing "Volatility Index" and "Expected
// Revenue Growth %" sliders -- they perturb the real historical drift/vol,
// they don't replace them.
export function projectPrices(lastPrice, lastDate, drift, dailyVol, horizonDays, options = {}) {
  const { volatilityMultiplier = 1, extraAnnualGrowthPct = 0 } = options;
  const extraDailyDrift = extraAnnualGrowthPct / 100 / TRADING_DAYS_PER_YEAR;
  const points = [];

  for (let t = 1; t <= horizonDays; t++) {
    const totalDrift = (drift + extraDailyDrift) * t;
    const band = CONFIDENCE_Z * dailyVol * volatilityMultiplier * Math.sqrt(t);
    const expected = lastPrice * Math.exp(totalDrift);
    const upper = expected * Math.exp(band);
    const lower = expected * Math.exp(-band);
    points.push({
      date: addTradingDays(lastDate, t),
      expected: round2(expected),
      upper: round2(upper),
      lower: round2(lower),
      band: round2(upper - lower),
    });
  }
  return points;
}
