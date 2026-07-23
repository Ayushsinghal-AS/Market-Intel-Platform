from fastapi import APIRouter, HTTPException

from app.services.stock_explorer import resolve_ticker, get_overview
from app.services.news import get_news_with_sentiment
from app.services.peers import get_peer_comparison
from app.services.market_data import get_live_quote

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/resolve")
def resolve(q: str):
    ticker = resolve_ticker(q)
    if not ticker:
        raise HTTPException(404, f"Could not resolve '{q}' to a ticker")
    return {"query": q, "ticker": ticker}


@router.get("/{ticker}/overview")
def overview(ticker: str):
    resolved = resolve_ticker(ticker) or ticker
    result = get_overview(resolved)
    if result.get("error"):
        raise HTTPException(404, result["error"])
    return result


@router.get("/{ticker}/news")
def news(ticker: str, limit: int = 8):
    resolved = resolve_ticker(ticker) or ticker
    return get_news_with_sentiment(resolved, limit=limit)


@router.get("/{ticker}/peers")
def peers(ticker: str):
    resolved = resolve_ticker(ticker) or ticker
    return get_peer_comparison(resolved)


@router.get("/{ticker}/live")
def live(ticker: str):
    # This endpoint is designed to be polled every ~12s (see useLivePrice),
    # so skip resolve_ticker's uncached network probing when the caller
    # already passed a fully-qualified ticker (e.g. "RELIANCE.NS" from a
    # loaded overview, or the "^NSEI" index symbol) -- only fall back to
    # resolution for a bare name/symbol.
    is_qualified = "." in ticker or ticker.startswith("^")
    resolved = ticker if is_qualified else (resolve_ticker(ticker) or ticker)
    result = get_live_quote(resolved)
    if result.get("error"):
        raise HTTPException(404, result["error"])
    return result
