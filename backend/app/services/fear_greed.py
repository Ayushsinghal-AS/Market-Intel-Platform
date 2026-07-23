"""
A simplified Fear & Greed gauge (CNN's index has 7 inputs; this uses 4 that
are cheap to derive from data the app already fetches elsewhere) combining
index momentum, realized volatility, market breadth, and large-cap news
sentiment into a single 0-100 score.
"""
import math
from concurrent.futures import ThreadPoolExecutor

from app.config import CACHE_TTL_INTRADAY, INDEX_TICKER
from app.cache import cached
from app.services import breadth, news
from app.services.market_data import get_history

# A handful of large, liquid Nifty 50 constituents used as a news-sentiment
# proxy for "the market" -- fetched in parallel (see nifty_scanner.py's
# get_multi_timeframe_dashboard for the same fan-out pattern), since 8
# sequential yfinance `.news` calls would otherwise add up fast.
SENTIMENT_SAMPLE_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "INFY.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS",
]

VOL_LOW_PCT = 10.0   # annualized vol at/below this -> greed score ceiling
VOL_HIGH_PCT = 35.0  # annualized vol at/above this -> fear score floor
MOMENTUM_BAND_PCT = 10.0  # +/- this many % from the 125-DMA spans the full score range


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _label_for(score: float) -> str:
    if score <= 24:
        return "Extreme Fear"
    if score <= 44:
        return "Fear"
    if score <= 55:
        return "Neutral"
    if score <= 75:
        return "Greed"
    return "Extreme Greed"


def _momentum_and_volatility() -> tuple[dict, dict]:
    df = get_history(INDEX_TICKER, period="1y")
    if df.empty or len(df) < 130:
        empty = {"score": 50, "detail": "Insufficient index history"}
        return empty, empty

    close = df["Close"]
    last = float(close.iloc[-1])
    ma125 = float(close.rolling(125).mean().iloc[-1])
    pct_diff = (last - ma125) / ma125 * 100 if ma125 else 0.0
    momentum_score = round(_clamp(50 + (pct_diff / MOMENTUM_BAND_PCT) * 50))
    momentum = {
        "score": momentum_score,
        "detail": f"Nifty 50 is {pct_diff:+.1f}% vs its 125-day average",
    }

    returns = close.pct_change().dropna().tail(20)
    daily_vol = float(returns.std())
    annualized_vol_pct = daily_vol * math.sqrt(252) * 100 if daily_vol == daily_vol else 0.0
    span = VOL_HIGH_PCT - VOL_LOW_PCT
    vol_score = round(_clamp(100 - ((annualized_vol_pct - VOL_LOW_PCT) / span) * 100))
    volatility = {
        "score": vol_score,
        "detail": f"20-day annualized volatility {annualized_vol_pct:.1f}%",
    }
    return momentum, volatility


def _breadth_component() -> dict:
    b = breadth.compute_breadth()
    score = round((b["pct_above_50dma"] + b["pct_above_200dma"]) / 2)
    return {
        "score": score,
        "detail": f"{b['pct_above_50dma']}% of Nifty 50 above 50-DMA, A/D ratio {b['advance_decline_ratio']}",
    }


def _news_sentiment_component() -> dict:
    def _score_one(ticker: str):
        try:
            summary = news.get_news_with_sentiment(ticker, limit=10)["summary"]
            return 50 + (summary["positive_pct"] - summary["negative_pct"]) / 2
        except Exception:
            return None

    with ThreadPoolExecutor(max_workers=len(SENTIMENT_SAMPLE_TICKERS)) as pool:
        scores = [s for s in pool.map(_score_one, SENTIMENT_SAMPLE_TICKERS) if s is not None]

    if not scores:
        return {"score": 50, "detail": "News sentiment unavailable"}

    positive_count = sum(1 for s in scores if s > 55)
    score = round(sum(scores) / len(scores))
    return {
        "score": score,
        "detail": f"Positive sentiment in {positive_count}/{len(scores)} tracked large-cap headlines",
    }


@cached(ttl=CACHE_TTL_INTRADAY)
def get_fear_greed_index() -> dict:
    momentum, volatility = _momentum_and_volatility()
    breadth_component = _breadth_component()
    news_component = _news_sentiment_component()

    components = {
        "momentum": momentum,
        "volatility": volatility,
        "breadth": breadth_component,
        "news_sentiment": news_component,
    }
    overall = round(sum(c["score"] for c in components.values()) / len(components))

    return {"score": overall, "label": _label_for(overall), "components": components}
