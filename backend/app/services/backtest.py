"""
Lightweight vectorized backtester for a single strategy: SMA crossover
(long-only, fully-invested-or-flat). Deliberately simple -- the point is to
show a clean, correct backtest loop with realistic metrics (CAGR, Sharpe, MDD,
win rate) benchmarked against buy-and-hold, not to ship a full event-driven
engine.
"""
import numpy as np
import pandas as pd

from app.services.market_data import get_history
from app.services.portfolio import (
    daily_returns, sharpe_ratio, max_drawdown, annualized_volatility, cagr,
)


def run_ma_crossover(ticker: str, short_window: int = 50, long_window: int = 200, period: str = "5y") -> dict:
    df = get_history(ticker, period=period)
    if df.empty or len(df) < long_window + 5:
        return {"error": f"Not enough history for {ticker} to backtest {long_window}-day window"}

    close = df["Close"].copy()
    short_ma = close.rolling(short_window).mean()
    long_ma = close.rolling(long_window).mean()

    # Signal: 1 = long, 0 = flat. Enter the day AFTER a crossover to avoid look-ahead.
    signal = (short_ma > long_ma).astype(int)
    position = signal.shift(1).fillna(0)

    strat_returns = daily_returns(close) * position.reindex(close.index).shift(0)[1:]
    strat_returns = strat_returns.dropna()
    buyhold_returns = daily_returns(close)

    strat_equity = (1 + strat_returns).cumprod()
    buyhold_equity = (1 + buyhold_returns).cumprod()

    # Trades: count each 0->1 transition as one entry
    crossings = position.diff().fillna(0)
    entries = int((crossings == 1).sum())

    # Win rate: of the return-days spent in a position, how many single positions
    # (entry-to-exit segments) ended net positive.
    trade_returns = []
    in_trade = False
    entry_equity = None
    for dt, pos in position.items():
        if pos == 1 and not in_trade:
            in_trade = True
            entry_equity = strat_equity.get(dt, None)
        if pos == 0 and in_trade:
            in_trade = False
            exit_equity = strat_equity.get(dt, None)
            if entry_equity and exit_equity:
                trade_returns.append(exit_equity / entry_equity - 1)
    if in_trade and entry_equity:
        trade_returns.append(strat_equity.iloc[-1] / entry_equity - 1)

    win_rate = round(sum(1 for r in trade_returns if r > 0) / len(trade_returns) * 100, 1) if trade_returns else None

    years = len(close) / 252
    strat_cagr = cagr(1.0, float(strat_equity.iloc[-1]), years) if not strat_equity.empty else None
    bh_cagr = cagr(1.0, float(buyhold_equity.iloc[-1]), years) if not buyhold_equity.empty else None

    equity_curve = [
        {
            "date": str(d.date()),
            "strategy": round(float(strat_equity.get(d, np.nan)), 4) if d in strat_equity.index else None,
            "buy_and_hold": round(float(v), 4),
        }
        for d, v in buyhold_equity.items()
    ]

    return {
        "ticker": ticker,
        "params": {"short_window": short_window, "long_window": long_window, "period": period},
        "trades": entries,
        "win_rate_pct": win_rate,
        "strategy": {
            "cagr_pct": round(strat_cagr * 100, 2) if strat_cagr is not None else None,
            "sharpe_ratio": (lambda s: round(s, 3) if s is not None else None)(sharpe_ratio(strat_returns)),
            "max_drawdown_pct": (lambda m: round(m * 100, 2) if m is not None else None)(max_drawdown(strat_equity)),
            "volatility_pct": (lambda v: round(v * 100, 2) if v is not None else None)(annualized_volatility(strat_returns)),
            "final_multiple": round(float(strat_equity.iloc[-1]), 3) if not strat_equity.empty else None,
        },
        "buy_and_hold": {
            "cagr_pct": round(bh_cagr * 100, 2) if bh_cagr is not None else None,
            "sharpe_ratio": (lambda s: round(s, 3) if s is not None else None)(sharpe_ratio(buyhold_returns)),
            "max_drawdown_pct": (lambda m: round(m * 100, 2) if m is not None else None)(max_drawdown(buyhold_equity)),
            "final_multiple": round(float(buyhold_equity.iloc[-1]), 3) if not buyhold_equity.empty else None,
        },
        "equity_curve": equity_curve[-750:],  # cap payload size (~3y of daily bars)
    }
