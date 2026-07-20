"""
Portfolio-level risk & return metrics: XIRR/CAGR, Sharpe/Sortino, Max Drawdown,
Beta, annualized volatility. No external xirr/quant lib -- XIRR is a plain
bisection on the NPV function so the whole engine stays dependency-light.
"""
from datetime import date, datetime
import numpy as np
import pandas as pd

from app.config import RISK_FREE_RATE, TRADING_DAYS_PER_YEAR, INDEX_TICKER
from app.services.market_data import get_history


def _xnpv(rate: float, cashflows: list[tuple[date, float]]) -> float:
    t0 = cashflows[0][0]
    return sum(cf / (1 + rate) ** ((d - t0).days / 365.0) for d, cf in cashflows)


def xirr(cashflows: list[tuple[date, float]], low: float = -0.999, high: float = 10.0, tol: float = 1e-6) -> float | None:
    """Bisection root-find on XNPV(rate) = 0. Cashflows must contain at least
    one negative (outflow/buy) and one positive (inflow/current value) entry."""
    if len(cashflows) < 2:
        return None
    f_low, f_high = _xnpv(low, cashflows), _xnpv(high, cashflows)
    if f_low * f_high > 0:
        return None  # no sign change -> no real root in range
    for _ in range(200):
        mid = (low + high) / 2
        f_mid = _xnpv(mid, cashflows)
        if abs(f_mid) < tol:
            return mid
        if f_low * f_mid < 0:
            high = mid
        else:
            low, f_low = mid, f_mid
    return mid


def cagr(start_value: float, end_value: float, years: float) -> float | None:
    if start_value <= 0 or years <= 0:
        return None
    return (end_value / start_value) ** (1 / years) - 1


def daily_returns(prices: pd.Series) -> pd.Series:
    return prices.pct_change().dropna()


def sharpe_ratio(returns: pd.Series, risk_free_rate: float = RISK_FREE_RATE) -> float | None:
    if returns.std() == 0 or returns.empty:
        return None
    daily_rf = risk_free_rate / TRADING_DAYS_PER_YEAR
    excess = returns - daily_rf
    return float(excess.mean() / returns.std() * np.sqrt(TRADING_DAYS_PER_YEAR))


def sortino_ratio(returns: pd.Series, risk_free_rate: float = RISK_FREE_RATE) -> float | None:
    daily_rf = risk_free_rate / TRADING_DAYS_PER_YEAR
    downside = returns[returns < daily_rf] - daily_rf
    downside_std = downside.std()
    if not downside_std or returns.empty:
        return None
    excess = returns - daily_rf
    return float(excess.mean() / downside_std * np.sqrt(TRADING_DAYS_PER_YEAR))


def max_drawdown(prices: pd.Series) -> float | None:
    if prices.empty:
        return None
    cum_max = prices.cummax()
    drawdown = (prices - cum_max) / cum_max
    return float(drawdown.min())


def annualized_volatility(returns: pd.Series) -> float | None:
    if returns.empty:
        return None
    return float(returns.std() * np.sqrt(TRADING_DAYS_PER_YEAR))


def beta(returns: pd.Series, index_returns: pd.Series) -> float | None:
    aligned = pd.concat([returns, index_returns], axis=1, join="inner").dropna()
    if len(aligned) < 2:
        return None
    cov = aligned.cov().iloc[0, 1]
    var = aligned.iloc[:, 1].var()
    if var == 0:
        return None
    return float(cov / var)


def analyze_portfolio(holdings: list[dict]) -> dict:
    """holdings: [{ticker, quantity, buy_price, buy_date (YYYY-MM-DD)}]
    Builds a value-weighted daily portfolio return series from each holding's
    own price history since its buy date, then derives every metric off that
    series plus an XIRR computed from the raw buy/sell cashflows."""
    cashflows: list[tuple[date, float]] = []
    per_holding = []
    price_frames = {}

    for h in holdings:
        ticker = h["ticker"]
        buy_date = datetime.strptime(h["buy_date"], "%Y-%m-%d").date()
        qty = float(h["quantity"])
        buy_price = float(h["buy_price"])

        df = get_history(ticker, period="5y")
        if df.empty:
            continue
        df = df[df.index.date >= buy_date]
        if df.empty:
            continue

        current_price = float(df["Close"].iloc[-1])
        invested = qty * buy_price
        current_value = qty * current_price

        cashflows.append((buy_date, -invested))
        price_frames[ticker] = df["Close"] * qty  # position value series

        per_holding.append({
            "ticker": ticker,
            "quantity": qty,
            "buy_price": buy_price,
            "buy_date": h["buy_date"],
            "current_price": round(current_price, 2),
            "invested": round(invested, 2),
            "current_value": round(current_value, 2),
            "pnl": round(current_value - invested, 2),
            "pnl_pct": round((current_value - invested) / invested * 100, 2) if invested else None,
        })

    if not per_holding:
        return {"error": "No valid holdings (check tickers/buy_date)"}

    portfolio_value_series = pd.concat(price_frames.values(), axis=1).sum(axis=1, skipna=True).dropna()
    portfolio_value_series = portfolio_value_series[portfolio_value_series > 0]

    total_invested = sum(h["invested"] for h in per_holding)
    total_current = sum(h["current_value"] for h in per_holding)
    cashflows.append((date.today(), total_current))

    earliest_buy = min(datetime.strptime(h["buy_date"], "%Y-%m-%d").date() for h in per_holding)
    years_held = max((date.today() - earliest_buy).days / 365.0, 1 / 365)

    returns = daily_returns(portfolio_value_series)
    index_df = get_history(INDEX_TICKER, period="5y")
    index_returns = daily_returns(index_df["Close"]) if not index_df.empty else pd.Series(dtype=float)

    return {
        "holdings": per_holding,
        "total_invested": round(total_invested, 2),
        "total_current_value": round(total_current, 2),
        "absolute_pnl": round(total_current - total_invested, 2),
        "absolute_pnl_pct": round((total_current - total_invested) / total_invested * 100, 2) if total_invested else None,
        "cagr_pct": round(cagr(total_invested, total_current, years_held) * 100, 2) if cagr(total_invested, total_current, years_held) is not None else None,
        "xirr_pct": round(x * 100, 2) if (x := xirr(cashflows)) is not None else None,
        "sharpe_ratio": round(s, 3) if (s := sharpe_ratio(returns)) is not None else None,
        "sortino_ratio": round(s, 3) if (s := sortino_ratio(returns)) is not None else None,
        "max_drawdown_pct": round(m * 100, 2) if (m := max_drawdown(portfolio_value_series)) is not None else None,
        "annualized_volatility_pct": round(v * 100, 2) if (v := annualized_volatility(returns)) is not None else None,
        "beta_vs_nifty": round(b, 3) if (b := beta(returns, index_returns)) is not None else None,
        "equity_curve": [
            {"date": str(d.date()), "value": round(float(v), 2)}
            for d, v in portfolio_value_series.items()
        ][-500:],  # cap payload size
    }
