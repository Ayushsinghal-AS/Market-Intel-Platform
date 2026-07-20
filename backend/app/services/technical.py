"""
Technical indicator math. RSI/EMA formulas mirror app/../stock/ETF/etf_scanner.py's
calculate_indicators(); this module generalizes them (adds MACD, Bollinger Bands,
Stochastic and a simple swing-pivot support/resistance scan) and adds a rule-based
verdict so /market/technical/{ticker} returns something a resume screener can
actually read, not just raw numbers.
"""
import pandas as pd
import numpy as np


def rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    delta = prices.diff()
    gain = delta.where(delta > 0, 0.0).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0.0)).rolling(window=period).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def ema(prices: pd.Series, span: int) -> pd.Series:
    return prices.ewm(span=span, adjust=False).mean()


def macd(prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    macd_line = ema(prices, fast) - ema(prices, slow)
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    return macd_line, signal_line, macd_line - signal_line


def bollinger_bands(prices: pd.Series, window: int = 20, num_std: float = 2.0):
    mid = prices.rolling(window).mean()
    std = prices.rolling(window).std()
    return mid + num_std * std, mid, mid - num_std * std


def stochastic_k(high: pd.Series, low: pd.Series, close: pd.Series, window: int = 14) -> pd.Series:
    low_n = low.rolling(window).min()
    high_n = high.rolling(window).max()
    return 100 * (close - low_n) / (high_n - low_n)


def _safe(value, digits=2):
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    return round(float(value), digits)


def find_swing_levels(prices: pd.Series, window: int = 10, lookback: int = 120):
    """Naive pivot-based support/resistance: a swing high/low is a point that is
    the local extremum within +/-window bars. Good enough for a dashboard hint,
    not a substitute for proper fractal/zig-zag pattern detection."""
    recent = prices.tail(lookback)
    supports, resistances = [], []
    values = recent.values
    for i in range(window, len(values) - window):
        segment = values[i - window:i + window + 1]
        if values[i] == segment.min():
            supports.append(round(float(values[i]), 2))
        if values[i] == segment.max():
            resistances.append(round(float(values[i]), 2))
    return sorted(set(supports))[-3:], sorted(set(resistances), reverse=True)[:3]


def volume_anomaly(df: pd.DataFrame, window: int = 20) -> dict:
    """Generalizes the whale/volume-spike heuristic from stock/Silver/silver_buying.py
    (there hardcoded to SLV) to any OHLCV frame: flags unusually high volume
    alongside the day's price move, which is the simplest real signal for
    "someone big is trading this" without needing order-book data."""
    volume = df["Volume"]
    close = df["Close"]
    if len(volume) < window + 1:
        return {"volume_ratio": None, "label": "Insufficient data"}

    avg_vol = float(volume.iloc[-window - 1:-1].mean())
    last_vol = float(volume.iloc[-1])
    change_pct = float((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2] * 100)
    ratio = round(last_vol / avg_vol, 2) if avg_vol else None

    label = "Normal activity"
    if ratio is not None:
        if change_pct < -1 and ratio > 2.5:
            label = "Whale accumulation? (heavy volume on a dip)"
        elif change_pct < -2 and ratio > 1.5:
            label = "Panic-selling risk (drop + high volume)"
        elif change_pct > 1 and ratio > 2.0:
            label = "Strong institutional buying (up + high volume)"
        elif ratio > 3.0:
            label = "Volume explosion (watch for a breakout)"

    return {"volume_ratio": ratio, "change_pct": round(change_pct, 2), "label": label}


def analyze(df: pd.DataFrame) -> dict:
    """Full technical readout for one OHLCV frame. Returns indicator values,
    a support/resistance zone and a simple weighted BUY/SELL/NEUTRAL verdict
    (same voting pattern as etf_scanner.py's analyze_selected_etf, generalized)."""
    close = df["Close"]
    high, low = df["High"], df["Low"]

    rsi_series = rsi(close)
    ema20, ema50, ema200 = ema(close, 20), ema(close, 50), ema(close, 200)
    macd_line, signal_line, hist = macd(close)
    upper_bb, mid_bb, lower_bb = bollinger_bands(close)
    stoch = stochastic_k(high, low, close)
    supports, resistances = find_swing_levels(close)

    price = float(close.iloc[-1])
    latest_rsi = float(rsi_series.iloc[-1]) if not np.isnan(rsi_series.iloc[-1]) else 50.0
    latest_ema50 = float(ema50.iloc[-1])
    latest_ema200 = float(ema200.iloc[-1]) if len(close) >= 200 else None

    buy_votes = sell_votes = 0
    signals = []

    if latest_rsi < 30:
        buy_votes += 2; signals.append("RSI oversold")
    elif latest_rsi > 70:
        sell_votes += 1; signals.append("RSI overbought")
    else:
        signals.append("RSI neutral")

    if price > latest_ema50:
        buy_votes += 1; signals.append("Above EMA50")
    else:
        sell_votes += 1; signals.append("Below EMA50")

    if latest_ema200 is not None:
        if latest_ema50 > latest_ema200:
            buy_votes += 1; signals.append("Golden trend (EMA50>EMA200)")
        else:
            sell_votes += 1; signals.append("Death trend (EMA50<EMA200)")

    if float(hist.iloc[-1]) > 0:
        buy_votes += 1; signals.append("MACD bullish")
    else:
        sell_votes += 1; signals.append("MACD bearish")

    score = buy_votes - sell_votes
    if score >= 3:
        verdict, confidence = "STRONG BUY", "High"
    elif score >= 1:
        verdict, confidence = "BUY", "Medium"
    elif score <= -3:
        verdict, confidence = "STRONG SELL", "High"
    elif score <= -1:
        verdict, confidence = "SELL", "Medium"
    else:
        verdict, confidence = "NEUTRAL", "Low"

    return {
        "price": round(price, 2),
        "rsi": round(latest_rsi, 2),
        "ema20": round(float(ema20.iloc[-1]), 2),
        "ema50": round(latest_ema50, 2),
        "ema200": round(latest_ema200, 2) if latest_ema200 is not None else None,
        "macd": _safe(macd_line.iloc[-1], 4),
        "macd_signal": _safe(signal_line.iloc[-1], 4),
        "bollinger_upper": _safe(upper_bb.iloc[-1]),
        "bollinger_lower": _safe(lower_bb.iloc[-1]),
        "stochastic_k": round(float(stoch.iloc[-1]), 2) if not np.isnan(stoch.iloc[-1]) else None,
        "support_levels": supports,
        "resistance_levels": resistances,
        "verdict": verdict,
        "confidence": confidence,
        "signals": signals,
        "volume_anomaly": volume_anomaly(df),
    }
