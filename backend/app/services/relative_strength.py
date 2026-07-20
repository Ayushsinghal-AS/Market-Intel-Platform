"""
IBD-style relative strength, simplified: rank each stock's trailing return
against the index's trailing return over the same window, then percentile-rank
the whole universe so "RS Rating" reads 0-99 like the familiar screener metric.
"""
from app.config import INDEX_TICKER
from app.data.nifty50 import NIFTY50
from app.services.market_data import get_bulk_history, get_history


def _trailing_return(close, days: int) -> float | None:
    if len(close) <= days:
        return None
    return float((close.iloc[-1] - close.iloc[-days - 1]) / close.iloc[-days - 1] * 100)


def compute_relative_strength(window_days: int = 63) -> list[dict]:
    """window_days=63 ~ 1 trading quarter, the standard RS lookback."""
    index_df = get_history(INDEX_TICKER, period="1y")
    index_return = _trailing_return(index_df["Close"], window_days) if not index_df.empty else None

    tickers = tuple(NIFTY50.keys())
    bulk = get_bulk_history(tickers, period="1y")

    rows = []
    for ticker, series in bulk.items():
        stock_return = _trailing_return(series["close"], window_days)
        if stock_return is None or index_return is None:
            continue
        rs_score = stock_return - index_return  # excess return vs benchmark, in pct points
        rows.append({
            "ticker": ticker,
            "sector": NIFTY50.get(ticker, "Other"),
            "return_pct": round(stock_return, 2),
            "index_return_pct": round(index_return, 2),
            "rs_score": round(rs_score, 2),
        })

    rows.sort(key=lambda r: r["rs_score"], reverse=True)
    n = len(rows)
    for i, row in enumerate(rows):
        row["rs_rating"] = round(100 - (i / max(n - 1, 1)) * 99) if n > 1 else 99

    return rows
