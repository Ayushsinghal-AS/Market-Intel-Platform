from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routers import market, portfolio, news, backtest, auth, stocks, etf

app = FastAPI(
    title="Market Intelligence Platform API",
    description="Real-time Nifty 50 analytics: breadth, relative strength, "
                "portfolio risk metrics, ETF overlap, news sentiment and a "
                "moving-average-crossover backtester -- all sourced from Yahoo Finance.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(market.router)
app.include_router(portfolio.router)
app.include_router(news.router)
app.include_router(backtest.router)
app.include_router(stocks.router)
app.include_router(etf.router)


@app.get("/health")
def health():
    return {"status": "ok"}
