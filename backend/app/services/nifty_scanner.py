"""
Ported from stock/Nifty50/nifty50_bot.py: a multi-timeframe (1m/5m/10m/15m/1h/1d)
technical verdict dashboard on the Nifty 50 index itself, voting across five
EMAs (10/20/50/100/200) plus RSI/MACD/Stochastic oscillators. The 10m timeframe
is resampled from 5m bars since yfinance doesn't serve a native 10m interval --
same trick as the original script. Telegram alerting is dropped for the API.
"""
import math
from concurrent.futures import ThreadPoolExecutor

import pandas as pd

from app.cache import cached
from app.config import CACHE_TTL_INTRADAY
from app.services.market_data import get_history, get_intraday

INDEX_TICKER = "^NSEI"
EMA_SPANS = [10, 20, 50, 100, 200]


def _calculate_technicals(df: pd.DataFrame) -> pd.DataFrame:
    if len(df) < 50:
        return df
    for span in EMA_SPANS:
        df[f"EMA_{span}"] = df["Close"].ewm(span=span, adjust=False).mean()

    delta = df["Close"].diff()
    gain = delta.where(delta > 0, 0).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    df["RSI"] = 100 - (100 / (1 + gain / loss))

    ema12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema26 = df["Close"].ewm(span=26, adjust=False).mean()
    df["MACD"] = ema12 - ema26
    df["MACD_Signal"] = df["MACD"].ewm(span=9, adjust=False).mean()

    low14, high14 = df["Low"].rolling(14).min(), df["High"].rolling(14).max()
    df["Stoch_K"] = 100 * (df["Close"] - low14) / (high14 - low14)
    return df


def _get_signal_verdict(df: pd.DataFrame) -> dict | None:
    try:
        current = df.iloc[-1]
        price = current["Close"]
        ma_buy = ma_sell = 0
        for span in EMA_SPANS:
            col = f"EMA_{span}"
            if col in df.columns:
                if price > current[col]:
                    ma_buy += 1
                else:
                    ma_sell += 1

        osc_buy = osc_sell = 0
        if current["RSI"] < 30:
            osc_buy += 1
        elif current["RSI"] > 70:
            osc_sell += 1
        if current["MACD"] > current["MACD_Signal"]:
            osc_buy += 1
        else:
            osc_sell += 1
        if current["Stoch_K"] < 20:
            osc_buy += 1
        elif current["Stoch_K"] > 80:
            osc_sell += 1

        score = (ma_buy - ma_sell) + (osc_buy - osc_sell)
        if score >= 4:
            verdict = "STRONG BUY"
        elif score >= 1:
            verdict = "BUY"
        elif score <= -4:
            verdict = "STRONG SELL"
        elif score <= -1:
            verdict = "SELL"
        else:
            verdict = "NEUTRAL"

        def _safe(v):
            return round(float(v), 2) if v is not None and math.isfinite(v) else None

        return {
            "price": _safe(price),
            "verdict": verdict,
            "rsi": _safe(current["RSI"]),
            "ema50": _safe(current["EMA_50"]) if "EMA_50" in current else None,
            "ma_signal": "BUY" if ma_buy > ma_sell else "SELL",
            "oscillator_signal": "BUY" if osc_buy > osc_sell else "SELL",
        }
    except Exception:
        return None


def _fetch_timeframe(interval: str) -> dict | None:
    period_map = {"1m": "5d", "5m": "5d", "15m": "1mo", "1h": "1y"}
    try:
        if interval == "10m":
            df = get_intraday(INDEX_TICKER, period="5d", interval="5m")
            if df.empty:
                return None
            agg = {"Open": "first", "High": "max", "Low": "min", "Close": "last", "Volume": "sum"}
            df = df.resample("10min").agg(agg).dropna(subset=["Close"])
        elif interval == "1d":
            df = get_history(INDEX_TICKER, period="2y", interval="1d")
            if df.empty:
                return None
        else:
            df = get_intraday(INDEX_TICKER, period=period_map[interval], interval=interval)
            if df.empty:
                return None

        df = _calculate_technicals(df.copy())
        return _get_signal_verdict(df)
    except Exception:
        return None


def _get_day_stats() -> dict | None:
    try:
        df = get_history(INDEX_TICKER, period="1mo", interval="1d")
        if df.empty:
            return None
        today = df.iloc[-1]
        day_high, day_low, curr = today["High"], today["Low"], today["Close"]
        range_pct = (curr - day_low) / (day_high - day_low) * 100
        ret_1w = (curr - df.iloc[-6]["Close"]) / df.iloc[-6]["Close"] * 100
        ret_1m = (curr - df.iloc[0]["Close"]) / df.iloc[0]["Close"] * 100
        def _safe(v, digits=2):
            return round(float(v), digits) if v is not None and math.isfinite(v) else None

        return {
            "price": _safe(curr), "high": _safe(day_high), "low": _safe(day_low),
            "range_position_pct": _safe(range_pct, 1), "return_1w_pct": _safe(ret_1w),
            "return_1m_pct": _safe(ret_1m),
        }
    except Exception:
        return None


TIMEFRAMES = ["1m", "5m", "10m", "15m", "1h", "1d"]


@cached(ttl=CACHE_TTL_INTRADAY)
def get_multi_timeframe_dashboard() -> dict:
    # 7 independent network calls (day stats + 6 timeframes) -- run them
    # concurrently instead of sequentially, since a single call can take
    # several seconds under network/DNS flakiness and sequential adds up fast.
    with ThreadPoolExecutor(max_workers=len(TIMEFRAMES) + 1) as pool:
        stats_future = pool.submit(_get_day_stats)
        tf_futures = {tf: pool.submit(_fetch_timeframe, tf) for tf in TIMEFRAMES}
        stats = stats_future.result()
        timeframes = {tf: future.result() for tf, future in tf_futures.items()}

    if not stats:
        return {"error": "Could not fetch Nifty 50 index data"}
    return {"day_stats": stats, "timeframes": timeframes}
