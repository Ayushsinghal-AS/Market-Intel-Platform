const BASE_URL = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8123";

// Nifty/ETF scans hit yfinance for many tickers and can legitimately take a
// while on a cold cache; other routes should come back fast. Either way, a
// hung backend request should surface as an error, not sit "pending" forever.
const DEFAULT_TIMEOUT_MS = 20_000;
const SLOW_TIMEOUT_MS = 45_000;
const SLOW_PATHS = ["/etf/scan", "/market/nifty-multi-timeframe", "/market/breadth", "/market/relative-strength", "/market/sector/"];

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };

  const timeoutMs = SLOW_PATHS.some((p) => path.startsWith(p)) ? SLOW_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers, signal: controller.signal });
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s: ${path}. The data source may be temporarily unreachable -- try again in a moment.`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${path}: ${body}`);
  }
  return res.json();
}

export const api = {
  health: () => request("/health"),

  heatmap: () => request("/market/heatmap"),
  breadth: () => request("/market/breadth"),
  relativeStrength: (windowDays = 63) => request(`/market/relative-strength?window_days=${windowDays}`),
  technical: (ticker) => request(`/market/technical/${ticker}`),
  sectorStocks: (sector) => request(`/market/sector/${encodeURIComponent(sector)}/stocks`),
  niftyMultiTimeframe: () => request("/market/nifty-multi-timeframe"),
  fearGreed: () => request("/market/fear-greed"),

  newsSentiment: (ticker) => request(`/news/sentiment/${ticker}`),

  analyzePortfolio: (holdings) =>
    request("/portfolio/analyze", { method: "POST", body: JSON.stringify({ holdings }) }),
  portfolioOverlap: (holdings) =>
    request("/portfolio/overlap", { method: "POST", body: JSON.stringify({ holdings }) }),
  backtest: (params) =>
    request("/backtest/ma-crossover", { method: "POST", body: JSON.stringify(params) }),

  resolveTicker: (q) => request(`/stocks/resolve?q=${encodeURIComponent(q)}`),
  stockOverview: (ticker) => request(`/stocks/${encodeURIComponent(ticker)}/overview`),
  stockNews: (ticker) => request(`/stocks/${encodeURIComponent(ticker)}/news`),
  stockPeers: (ticker) => request(`/stocks/${encodeURIComponent(ticker)}/peers`),
  liveQuote: (ticker) => request(`/stocks/${encodeURIComponent(ticker)}/live`),

  etfList: () => request("/etf/list"),
  etfScan: () => request("/etf/scan"),

  fnoChain: (index, expiry) => request(`/fno/chain?index=${index}${expiry ? `&expiry=${expiry}` : ""}`),
};
