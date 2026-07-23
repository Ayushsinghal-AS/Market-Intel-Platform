from fastapi import APIRouter, HTTPException

from app.data.nifty50 import NIFTY50
from app.services import breadth, fear_greed, relative_strength, technical
from app.services.market_data import get_history
from app.services.nifty_scanner import get_multi_timeframe_dashboard
from app.services.stock_explorer import get_overview

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/heatmap")
def heatmap():
    return {"tickers": breadth.sector_heatmap()}


@router.get("/breadth")
def market_breadth():
    return breadth.compute_breadth()


@router.get("/relative-strength")
def relative_strength_ranking(window_days: int = 63):
    return {"window_days": window_days, "ranking": relative_strength.compute_relative_strength(window_days)}


@router.get("/sector/{sector}/stocks")
def sector_stocks(sector: str):
    tickers = [t for t, s in NIFTY50.items() if s == sector]
    if not tickers:
        raise HTTPException(404, f"Unknown sector '{sector}'")
    results = []
    for ticker in tickers:
        overview = get_overview(ticker)
        if not overview.get("error"):
            results.append(overview)
    return {"sector": sector, "stocks": results}


@router.get("/nifty-multi-timeframe")
def nifty_multi_timeframe():
    return get_multi_timeframe_dashboard()


@router.get("/fear-greed")
def fear_greed_index():
    return fear_greed.get_fear_greed_index()


@router.get("/technical/{ticker}")
def technical_readout(ticker: str):
    if ticker not in NIFTY50 and not ticker.upper().endswith(".NS"):
        raise HTTPException(400, "Use an NSE ticker, e.g. RELIANCE.NS")
    df = get_history(ticker, period="1y")
    if df.empty:
        raise HTTPException(404, f"No data found for {ticker}")
    return {"ticker": ticker, **technical.analyze(df)}
