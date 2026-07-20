"""
Market breadth: how many stocks are actually participating in a move, not just
the index level. Classic "internals" view used to tell a real rally from an
index pulled up by 3-4 heavyweights.
"""
from app.data.nifty50 import NIFTY50
from app.services.market_data import get_bulk_history


def compute_breadth() -> dict:
    tickers = tuple(NIFTY50.keys())
    bulk = get_bulk_history(tickers, period="1y")

    advances = declines = unchanged = 0
    above_50dma = above_200dma = 0
    counted = 0
    movers = []

    for ticker, series in bulk.items():
        close = series["close"]
        if len(close) < 2:
            continue
        counted += 1
        change = float(close.iloc[-1] - close.iloc[-2])
        pct = round((change / float(close.iloc[-2])) * 100, 2) if close.iloc[-2] else 0.0

        if change > 0:
            advances += 1
        elif change < 0:
            declines += 1
        else:
            unchanged += 1

        if len(close) >= 50 and close.iloc[-1] > close.rolling(50).mean().iloc[-1]:
            above_50dma += 1
        if len(close) >= 200 and close.iloc[-1] > close.rolling(200).mean().iloc[-1]:
            above_200dma += 1

        movers.append({
            "ticker": ticker,
            "sector": NIFTY50.get(ticker, "Other"),
            "change_pct": pct,
        })

    ad_ratio = round(advances / declines, 2) if declines else float("inf")
    pct_above_200 = round((above_200dma / counted) * 100, 1) if counted else 0.0
    pct_above_50 = round((above_50dma / counted) * 100, 1) if counted else 0.0

    if pct_above_200 >= 60 and advances > declines:
        regime = "Bullish"
    elif pct_above_200 <= 40 and declines > advances:
        regime = "Bearish"
    else:
        regime = "Sideways / Choppy"

    return {
        "universe_size": counted,
        "advances": advances,
        "declines": declines,
        "unchanged": unchanged,
        "advance_decline_ratio": ad_ratio,
        "pct_above_50dma": pct_above_50,
        "pct_above_200dma": pct_above_200,
        "market_regime": regime,
        "movers": sorted(movers, key=lambda m: m["change_pct"], reverse=True),
    }


def sector_heatmap() -> list[dict]:
    """1-day % change per stock, grouped by sector -- feeds the frontend heatmap grid."""
    breadth = compute_breadth()
    return breadth["movers"]
