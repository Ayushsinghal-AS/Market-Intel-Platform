"""
Single seam for all Yahoo Finance access (via yfinance). Every other service
imports from here rather than calling yfinance directly, so caching, retry
and MultiIndex-column handling live in one place -- this is the pattern your
etf_scanner.py / nifty50_bot.py scripts had inlined per-script; centralizing
it is what lets the rest of the codebase stay short.
"""
import time

import pandas as pd
import yfinance as yf

from app.cache import cached
from app.config import CACHE_TTL_DAILY, CACHE_TTL_INTRADAY


def _flatten(df: pd.DataFrame, ticker: str) -> pd.DataFrame:
    """yfinance returns a MultiIndex column frame for multi-ticker/batched calls."""
    if isinstance(df.columns, pd.MultiIndex):
        try:
            return df.xs(ticker, level=1, axis=1)
        except KeyError:
            return df.xs(ticker, level=0, axis=1)
    return df


def with_retry(fn, attempts: int = 2, backoff: float = 1.0):
    """Generic retry for any single yfinance call (download, Ticker().info, ...).
    Bounded to 2 attempts with a short fixed backoff -- Yahoo's endpoint or DNS
    can hang for its own ~10s timeout per attempt, so this trades a bit of
    reliability for not compounding into a multi-minute request when the
    network is genuinely down, which previously showed up as a request stuck
    "pending" in the browser."""
    last_exc = None
    for attempt in range(attempts):
        try:
            return fn()
        except Exception as e:
            last_exc = e
        if attempt < attempts - 1:
            time.sleep(backoff)
    if last_exc:
        raise last_exc


def _download_with_retry(*args, attempts: int = 2, backoff: float = 1.0, **kwargs) -> pd.DataFrame:
    """Yahoo's endpoint occasionally returns a malformed/empty payload under
    load, which surfaces inside yfinance as a bare TypeError rather than a
    clean empty frame -- retry once with backoff before giving up, since a
    single transient hiccup shouldn't fail the whole request. `timeout` bounds
    each individual attempt so a DNS/network stall can't hang the request."""
    kwargs.setdefault("timeout", 8)
    last_exc = None
    for attempt in range(attempts):
        try:
            df = yf.download(*args, progress=False, auto_adjust=False, **kwargs)
            if not df.empty:
                return df
        except Exception as e:
            last_exc = e
        if attempt < attempts - 1:
            time.sleep(backoff)
    if last_exc:
        raise last_exc
    return pd.DataFrame()


@cached(ttl=CACHE_TTL_DAILY)
def get_history(ticker: str, period: str = "2y", interval: str = "1d") -> pd.DataFrame:
    df = _download_with_retry(ticker, period=period, interval=interval)
    if df.empty:
        return df
    # A live/partial trading-day bar can have a NaN Close even when other
    # columns are populated -- drop on Close specifically rather than "all",
    # since Close is what every downstream metric is computed from.
    df = _flatten(df, ticker).dropna(subset=["Close"])
    return df


@cached(ttl=CACHE_TTL_INTRADAY)
def get_intraday(ticker: str, period: str = "1d", interval: str = "15m") -> pd.DataFrame:
    df = _download_with_retry(ticker, period=period, interval=interval)
    if df.empty:
        return df
    return _flatten(df, ticker).dropna(subset=["Close"])


@cached(ttl=CACHE_TTL_DAILY)
def get_bulk_history(tickers: tuple, period: str = "1y") -> dict:
    """Batches one yf.download call across many tickers -- avoids N round trips
    for the heatmap/breadth/RS engines, which each need ~50 symbols."""
    data = _download_with_retry(list(tickers), period=period, group_by="column")
    out = {}
    if data.empty:
        return out
    close = data["Close"] if not isinstance(data.columns, pd.MultiIndex) else data["Close"]
    volume = data["Volume"]
    for t in tickers:
        if t not in close.columns:
            continue
        c = close[t].dropna()
        v = volume[t].dropna() if t in volume.columns else pd.Series(dtype=float)
        if c.empty:
            continue
        out[t] = {"close": c, "volume": v}
    return out


def ticker_exists(ticker: str) -> bool:
    """Single-attempt, short-timeout existence probe -- used when guessing
    between candidate tickers (e.g. RELIANCE vs RELIANCE.NS), where trying
    the next candidate fast matters more than retrying a bad guess."""
    try:
        df = yf.download(ticker, period="5d", interval="1d", progress=False, auto_adjust=False, timeout=5)
        return not df.empty
    except Exception:
        return False


def get_last_price(ticker: str) -> float | None:
    df = get_history(ticker, period="5d", interval="1d")
    if df.empty:
        return None
    return float(df["Close"].iloc[-1])
