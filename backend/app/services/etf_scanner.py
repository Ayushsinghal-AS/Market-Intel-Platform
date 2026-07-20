"""
Ported from stock/ETF/etf_scanner.py: the RSI/EMA/VWAP-based ETF picker
strategy (Plan A "strict dip" -> Plan B "fallback SIP", avoiding yesterday's
category to force diversification). Telegram alerting and the hardcoded
bot token/chat ID from the original script are dropped entirely -- this
returns structured JSON for the API instead of pushing a notification.
"""
import csv
import json
import os
from datetime import datetime

import pandas as pd
import yfinance as yf

from app.cache import cached
from app.config import CACHE_TTL_DAILY
from app.services.market_data import _download_with_retry
from app.services.technical import rsi, ema

_ETF_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "etfs.csv")
_HISTORY_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data_store", "etf_history.json")

MIN_VALUE_CR = 2.0
PLAN_A_MIN_VOL = 500_000
PLAN_B_MIN_VOL = 15_000


def load_etf_list() -> dict:
    if not os.path.exists(_ETF_FILE):
        return {}
    with open(_ETF_FILE, newline="") as f:
        return {row["Ticker"].strip(): row["Category"].strip() for row in csv.DictReader(f)}


def _get_last_bought_category() -> str | None:
    if not os.path.exists(_HISTORY_FILE):
        return None
    try:
        with open(_HISTORY_FILE) as f:
            data = json.load(f)
        for entry in reversed(data):
            if entry.get("run_status") == "BUY":
                return entry.get("category")
    except (json.JSONDecodeError, OSError):
        pass
    return None


def _save_run_result(status: str, strategy: str, category=None, ticker=None, price=0, change_1d=0):
    os.makedirs(os.path.dirname(_HISTORY_FILE), exist_ok=True)
    history = []
    if os.path.exists(_HISTORY_FILE):
        try:
            with open(_HISTORY_FILE) as f:
                history = json.load(f)
        except (json.JSONDecodeError, OSError):
            history = []

    today = str(datetime.now().date())
    entry = {
        "run_date": today, "run_time": datetime.now().strftime("%H:%M:%S"),
        "run_status": status, "strategy_used": strategy, "category": category,
        "ticker": ticker, "price": price, "change_1d": change_1d,
    }
    history = [h for h in history if h.get("run_date") != today] + [entry]
    with open(_HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)


def _get_vwap_status(ticker: str):
    try:
        df = _download_with_retry(ticker, period="1d", interval="15m")
        if df.empty:
            return 0, "Unknown"
        if isinstance(df.columns, pd.MultiIndex):
            price, vol = df["Close"][ticker], df["Volume"][ticker]
        else:
            price, vol = df["Close"], df["Volume"]
        vwap = (price * vol).cumsum() / vol.cumsum()
        status = "Bullish (Price > VWAP)" if price.iloc[-1] > vwap.iloc[-1] else "Bearish (Price < VWAP)"
        return round(float(vwap.iloc[-1]), 2), status
    except Exception:
        return 0, "Unknown"


@cached(ttl=CACHE_TTL_DAILY)
def scan_etfs() -> pd.DataFrame:
    etf_dict = load_etf_list()
    tickers = list(etf_dict.keys())
    data = _download_with_retry(tickers, period="1y")
    if data.empty:
        return pd.DataFrame()

    close, volume = data["Close"], data["Volume"]
    latest_date = close.index[-1].date()
    rows = []

    for ticker in tickers:
        try:
            if ticker not in close.columns:
                continue
            prices, vols = close[ticker].dropna(), volume[ticker].dropna()
            if len(prices) < 200:
                continue

            curr_price, curr_vol = prices.iloc[-1], vols.iloc[-1]
            prev_price = prices.iloc[-2]
            change_1d = (curr_price - prev_price) / prev_price * 100

            target_date = prices.index[-1] - pd.Timedelta(days=30)
            idx_30d = prices.index.get_indexer([target_date], method="nearest")[0]
            price_30d = prices.iloc[idx_30d]
            change_30d = (curr_price - price_30d) / price_30d * 100

            val_cr = (curr_price * curr_vol) / 1e7
            rsi_val = float(rsi(prices).iloc[-1])
            ema50_val = float(ema(prices, 50).iloc[-1])

            rows.append({
                "ticker": ticker, "category": etf_dict.get(ticker, "Other"),
                "price": round(float(curr_price), 2), "change_1d_pct": round(float(change_1d), 2),
                "change_30d_pct": round(float(change_30d), 2), "volume": int(curr_vol),
                "value_cr": round(float(val_cr), 2), "rsi": round(rsi_val, 2) if rsi_val == rsi_val else None,
                "ema50": round(ema50_val, 2), "data_date": str(latest_date),
            })
        except Exception:
            continue

    return pd.DataFrame(rows)


def _analyze_pick(row: dict) -> dict:
    buy_votes = sell_votes = 0
    signals = []
    rsi_val, ema50, price = row["rsi"], row["ema50"], row["price"]

    if rsi_val is not None and rsi_val < 30:
        buy_votes += 2; signals.append("RSI Oversold")
    elif rsi_val is not None and rsi_val > 70:
        sell_votes += 1; signals.append("RSI Overbought")
    else:
        signals.append("RSI Neutral")

    if price > ema50:
        buy_votes += 1; signals.append("Above EMA50")
    else:
        sell_votes += 1; signals.append("Below EMA50")

    vwap_price, vwap_status = _get_vwap_status(row["ticker"])
    if "Bullish" in vwap_status:
        buy_votes += 1
    else:
        sell_votes += 1

    score = buy_votes - sell_votes
    if score >= 2:
        verdict, confidence = "BUY", ("High" if score >= 3 else "Medium")
    elif score <= -1:
        verdict, confidence = "WEAK / SELL", "Medium"
    else:
        verdict, confidence = "NEUTRAL", "Low"

    return {
        "verdict": verdict, "confidence": confidence, "buy_votes": buy_votes,
        "sell_votes": sell_votes, "vwap": vwap_price, "vwap_status": vwap_status, "signals": signals,
    }


def run_strategy() -> dict:
    df = scan_etfs()
    if df.empty:
        return {"error": "Could not fetch ETF data"}

    last_category = _get_last_bought_category()
    valid = df[(df["volume"] > PLAN_B_MIN_VOL) & (df["value_cr"] > MIN_VALUE_CR)].copy()
    if valid.empty:
        return {"error": "No liquid ETFs found today", "all_etfs": df.to_dict("records")}

    strict = valid[
        (valid["change_1d_pct"] <= -1.0) & (valid["change_30d_pct"] <= -2.5) &
        (valid["volume"] > PLAN_A_MIN_VOL) & (valid["category"] != last_category)
    ]

    strategy_name, pool = "STRICT DIP (Plan A)", strict
    if pool.empty:
        strategy_name, pool = "FALLBACK (Daily SIP)", valid[valid["category"] != last_category]

    if pool.empty:
        _save_run_result("NO_TRADE", "NONE")
        return {
            "strategy": "NONE", "selected": None,
            "reason": "All liquid ETFs match yesterday's category -- no trade to force diversification.",
            "all_etfs": df.sort_values("change_1d_pct").to_dict("records"),
        }

    winner = pool.sort_values("change_1d_pct").iloc[0].to_dict()
    ai_analysis = _analyze_pick(winner)
    _save_run_result("BUY", strategy_name, winner["category"], winner["ticker"], winner["price"], winner["change_1d_pct"])

    return {
        "strategy": strategy_name,
        "selected": {**winner, "analysis": ai_analysis},
        "reason": f"Selected {winner['ticker']} for the lowest 1D change ({winner['change_1d_pct']}%) among eligible ETFs.",
        "all_etfs": df.sort_values("change_1d_pct").to_dict("records"),
    }
