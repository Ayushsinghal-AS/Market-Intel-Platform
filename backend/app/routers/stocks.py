from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.services.stock_explorer import resolve_ticker, get_overview
from app.services.news import get_news_with_sentiment

router = APIRouter(prefix="/stocks", tags=["stocks"], dependencies=[Depends(get_current_user)])


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
