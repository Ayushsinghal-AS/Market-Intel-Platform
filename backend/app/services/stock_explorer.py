"""
"Enter any stock, get current real data" -- the feature stock_analyzer.py /
ai_stock_analyser.py in the repo's stock/ folder aimed for with hand-rolled
dummy data and a hardcoded OpenAI key. This does the same job for real,
sourced entirely from yfinance: ticker resolution by name or symbol,
fundamentals, technicals, and a price chart, all live.
"""
import csv
import math
import os

import yfinance as yf

from app.cache import cached
from app.config import CACHE_TTL_DAILY
from app.data.nifty50 import NIFTY50
from app.services import technical
from app.services.market_data import get_history, ticker_exists, with_retry

_TICKERMAP_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "tickermap.csv")


def _load_name_map() -> dict:
    mapping = {}
    if os.path.exists(_TICKERMAP_PATH):
        with open(_TICKERMAP_PATH, newline="") as f:
            for row in csv.DictReader(f):
                mapping[row["name"].strip().lower()] = row["ticker"].strip()
    return mapping


_NAME_MAP = _load_name_map()


def resolve_ticker(query: str) -> str | None:
    """Accepts a raw ticker (RELIANCE.NS, AAPL), a bare NSE symbol (RELIANCE),
    or a company name (from the local name map) and returns a yfinance-valid
    ticker, or None if nothing resolves."""
    q = query.strip()
    if not q:
        return None

    if q.upper() in NIFTY50:
        return q.upper()

    for name, ticker in _NAME_MAP.items():
        if q.lower() in name:
            return ticker

    candidates = [q.upper()] if "." in q else [f"{q.upper()}.NS", q.upper()]
    for candidate in candidates:
        if ticker_exists(candidate):
            return candidate
    return None


def _clean(value):
    """yfinance's `.info` returns NaN (not None) for a lot of missing numeric
    fields on thinly-covered tickers -- NaN isn't valid JSON, so this turns it
    into null before it ever reaches a response."""
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


@cached(ttl=CACHE_TTL_DAILY)
def get_overview(ticker: str) -> dict:
    try:
        raw_info = with_retry(lambda: yf.Ticker(ticker).info) or {}
    except Exception:
        raw_info = {}
    info = {k: _clean(v) for k, v in raw_info.items()}
    df = get_history(ticker, period="1y")
    if df.empty:
        return {"error": f"No price data for {ticker}"}

    tech = technical.analyze(df)
    chart = [
        {"date": str(d.date()), "close": round(float(c), 2)}
        for d, c in df["Close"].dropna().tail(180).items()
    ]

    return {
        "ticker": ticker,
        "name": info.get("longName") or info.get("shortName") or ticker,
        "sector": info.get("sector") or NIFTY50.get(ticker),
        "industry": info.get("industry"),
        "price": round(float(df["Close"].iloc[-1]), 2),
        "previous_close": info.get("previousClose"),
        "day_low": info.get("dayLow"),
        "day_high": info.get("dayHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "volume": info.get("volume") or (int(df["Volume"].dropna().iloc[-1]) if "Volume" in df and not df["Volume"].dropna().empty else None),
        "average_volume": info.get("averageVolume"),
        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE"),
        "pb_ratio": info.get("priceToBook"),
        "roe_pct": round(info["returnOnEquity"] * 100, 2) if info.get("returnOnEquity") is not None else None,
        "revenue": info.get("totalRevenue"),
        "profit_margin_pct": round(info["profitMargins"] * 100, 2) if info.get("profitMargins") is not None else None,
        "dividend_yield_pct": round(info["dividendYield"], 2) if info.get("dividendYield") is not None else None,
        "analyst_recommendation": (info.get("recommendationKey") or "none").replace("_", " ").upper(),
        "analyst_target_price": info.get("targetMeanPrice"),
        "technical": tech,
        "chart": chart,
    }
