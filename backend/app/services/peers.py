"""
Sector-peer comparison: given a Nifty 50 ticker, find other Nifty 50
constituents in the same sector and fetch their overview data for a
side-by-side comparison table.
"""
from concurrent.futures import ThreadPoolExecutor

from app.data.nifty50 import NIFTY50
from app.services.stock_explorer import get_overview

MAX_PEERS = 5


def _change_pct(overview: dict) -> float | None:
    price = overview.get("price")
    prev = overview.get("previous_close")
    if price is None or not prev:
        return None
    return round((price - prev) / prev * 100, 2)


def _to_peer_row(overview: dict) -> dict:
    return {
        "ticker": overview["ticker"],
        "name": overview.get("name"),
        "price": overview.get("price"),
        "change_pct": _change_pct(overview),
        "market_cap": overview.get("market_cap"),
        "pe_ratio": overview.get("pe_ratio"),
        "pb_ratio": overview.get("pb_ratio"),
        "roe_pct": overview.get("roe_pct"),
        "dividend_yield_pct": overview.get("dividend_yield_pct"),
    }


def get_peer_comparison(ticker: str) -> dict:
    sector = NIFTY50.get(ticker)
    if not sector:
        return {"ticker": ticker, "sector": None, "peers": [], "note": "Ticker is outside the tracked NIFTY50 universe"}

    peer_tickers = [t for t, s in NIFTY50.items() if s == sector and t != ticker][:MAX_PEERS]
    if not peer_tickers:
        return {
            "ticker": ticker,
            "sector": sector,
            "peers": [],
            "note": f"Limited peer universe: only 1 NIFTY50 constituent in {sector}",
        }

    all_tickers = [ticker] + peer_tickers
    # Fan out across tickers in parallel -- get_overview is a cached but
    # still-nontrivial per-ticker yfinance call, and the sequential
    # per-ticker loops elsewhere in this codebase are a known latency trap
    # (see market.py's sector/stocks route), so this mirrors nifty_scanner.py's
    # ThreadPoolExecutor pattern instead.
    with ThreadPoolExecutor(max_workers=len(all_tickers)) as pool:
        overviews = dict(zip(all_tickers, pool.map(get_overview, all_tickers)))

    peers = [_to_peer_row(overviews[t]) for t in peer_tickers if not overviews[t].get("error")]

    return {"ticker": ticker, "sector": sector, "peers": peers, "note": None}
