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

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# Dev-only default -- always set a real JWT_SECRET via env in any deployed instance.
JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-insecure-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "168"))  # 7 days

DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "data_store", "app.db"))
