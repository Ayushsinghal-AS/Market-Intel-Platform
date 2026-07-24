import os

# Risk-free rate used for Sharpe/Sortino (Indian 10Y G-Sec approx). Override via env for other markets.
RISK_FREE_RATE = float(os.getenv("RISK_FREE_RATE", "0.07"))

TRADING_DAYS_PER_YEAR = 252

INDEX_TICKER = "^NSEI"  # Nifty 50 index, used as the market benchmark for beta/RS

# In-memory cache TTLs (seconds). Swap CacheStore for a Redis-backed one in prod —
# see app/cache.py for the single seam that needs to change.
CACHE_TTL_INTRADAY = 60 * 5      # fast-moving: breadth, heatmap
CACHE_TTL_DAILY = 60 * 30        # daily bars, technicals
CACHE_TTL_NEWS = 60 * 15
CACHE_TTL_LIVE = 12              # single-ticker live-quote polling (StockDetail hero price)
CACHE_TTL_FNO_CHAIN = 15         # synthetic option chain recompute (spot itself is separately cached at CACHE_TTL_LIVE)

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
