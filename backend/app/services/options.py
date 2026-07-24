"""
Synthetic NIFTY/BANKNIFTY/SENSEX option chain: real Black-Scholes pricing and
Greeks computed over the REAL live index spot price (via market_data's
get_live_quote), but strikes' IV/OI/volume are illustrative -- there is no
free, reliable NSE/BSE option-chain feed this backend can call (verified:
yfinance returns zero option expiries for these indices). This is deliberately
NOT presented as live market data -- see the "note" field on every response.
"""
import hashlib
import math
import random
from datetime import date, timedelta

from app.cache import cached
from app.config import CACHE_TTL_FNO_CHAIN, RISK_FREE_RATE
from app.services import market_data

FNO_INDEX_TICKERS = {"NIFTY": "^NSEI", "BANKNIFTY": "^NSEBANK", "SENSEX": "^BSESN"}
STRIKE_INTERVALS = {"NIFTY": 50, "BANKNIFTY": 100, "SENSEX": 100}
BASE_IV = {"NIFTY": 0.13, "BANKNIFTY": 0.15, "SENSEX": 0.14}  # illustrative annualized vol
STRIKE_COUNT = 13  # odd, so ATM sits exactly in the middle

DISCLAIMER = (
    "Illustrative option chain -- strikes/IV/OI/volume are synthetic "
    "(Black-Scholes pricing over the real live index price); NSE does not "
    "expose a free, reliable option-chain feed for this app to use. "
    "Not real market data or trading advice."
)


def _norm_cdf(x: float) -> float:
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def _norm_pdf(x: float) -> float:
    return math.exp(-0.5 * x * x) / math.sqrt(2 * math.pi)


def bs_price(spot: float, strike: float, t_years: float, r: float, sigma: float, is_call: bool) -> float:
    if t_years <= 0 or sigma <= 0:
        return max(spot - strike, 0) if is_call else max(strike - spot, 0)
    sqrt_t = math.sqrt(t_years)
    d1 = (math.log(spot / strike) + (r + 0.5 * sigma ** 2) * t_years) / (sigma * sqrt_t)
    d2 = d1 - sigma * sqrt_t
    if is_call:
        return spot * _norm_cdf(d1) - strike * math.exp(-r * t_years) * _norm_cdf(d2)
    return strike * math.exp(-r * t_years) * _norm_cdf(-d2) - spot * _norm_cdf(-d1)


def bs_greeks(spot: float, strike: float, t_years: float, r: float, sigma: float, is_call: bool) -> dict:
    if t_years <= 0 or sigma <= 0:
        itm = (spot > strike) if is_call else (spot < strike)
        return {"delta": (1.0 if is_call else -1.0) if itm else 0.0, "gamma": 0.0, "theta": 0.0, "vega": 0.0}

    sqrt_t = math.sqrt(t_years)
    d1 = (math.log(spot / strike) + (r + 0.5 * sigma ** 2) * t_years) / (sigma * sqrt_t)
    d2 = d1 - sigma * sqrt_t
    pdf_d1 = _norm_pdf(d1)

    gamma = pdf_d1 / (spot * sigma * sqrt_t)
    vega = spot * pdf_d1 * sqrt_t / 100  # per 1% (0.01) change in vol

    if is_call:
        delta = _norm_cdf(d1)
        theta = (-(spot * pdf_d1 * sigma) / (2 * sqrt_t) - r * strike * math.exp(-r * t_years) * _norm_cdf(d2)) / 365
    else:
        delta = _norm_cdf(d1) - 1
        theta = (-(spot * pdf_d1 * sigma) / (2 * sqrt_t) + r * strike * math.exp(-r * t_years) * _norm_cdf(-d2)) / 365

    return {"delta": round(delta, 4), "gamma": round(gamma, 6), "theta": round(theta, 4), "vega": round(vega, 4)}


def get_expiries(count: int = 4) -> list[str]:
    """Next `count` upcoming Thursdays (NSE's standard weekly expiry day) --
    a plausible synthetic calendar, not scraped from a real expiry feed."""
    today = date.today()
    days_until_thu = (3 - today.weekday()) % 7  # Thursday == weekday 3
    first = today + timedelta(days=days_until_thu)
    return [(first + timedelta(weeks=i)).isoformat() for i in range(count)]


def _seed(*parts) -> int:
    digest = hashlib.md5("|".join(str(p) for p in parts).encode()).hexdigest()
    return int(digest[:8], 16)


def _iv_skew(strike: float, spot: float, base_iv: float) -> float:
    moneyness = abs(strike - spot) / spot
    return base_iv + moneyness * 0.6  # simple smile: further from ATM -> higher IV


def _synthetic_oi_volume(rng: random.Random, distance_rank: int) -> tuple[int, int]:
    """Bell-shaped OI/volume peaking at the ATM strike (distance_rank=0),
    deterministic per the caller's seeded rng -- illustrative, not real."""
    weight = math.exp(-0.5 * (distance_rank / 2.5) ** 2)
    base_oi = rng.randint(50_000, 400_000) * weight
    base_vol = base_oi * rng.uniform(0.15, 0.4)
    return round(base_oi), round(base_vol)


def _change_pct(ticker: str, price: float) -> float | None:
    df = market_data.get_history(ticker, period="5d")
    if df.empty or len(df) < 2:
        return None
    prev_close = float(df["Close"].iloc[-2])
    return round((price - prev_close) / prev_close * 100, 2) if prev_close else None


@cached(ttl=CACHE_TTL_FNO_CHAIN)
def build_chain(index: str, expiry: str | None = None) -> dict:
    if index not in FNO_INDEX_TICKERS:
        return {"error": f"Unknown index '{index}'. Use NIFTY, BANKNIFTY, or SENSEX."}

    ticker = FNO_INDEX_TICKERS[index]
    quote = market_data.get_live_quote(ticker)
    if quote.get("error"):
        return {"error": quote["error"]}
    spot = quote["price"]

    expiries = get_expiries()
    expiry = expiry if expiry in expiries else expiries[0]
    days_to_expiry = max((date.fromisoformat(expiry) - date.today()).days, 1)
    t_years = days_to_expiry / 365

    interval = STRIKE_INTERVALS[index]
    atm_strike = round(spot / interval) * interval
    half = STRIKE_COUNT // 2
    strikes = [atm_strike + (i - half) * interval for i in range(STRIKE_COUNT)]

    rng = random.Random(_seed(index, expiry))  # deterministic within a cache window

    rows = []
    for i, strike in enumerate(strikes):
        distance_rank = abs(i - half)
        iv = _iv_skew(strike, spot, BASE_IV[index])
        call_oi, call_vol = _synthetic_oi_volume(rng, distance_rank)
        put_oi, put_vol = _synthetic_oi_volume(rng, distance_rank)

        call_price = bs_price(spot, strike, t_years, RISK_FREE_RATE, iv, True)
        put_price = bs_price(spot, strike, t_years, RISK_FREE_RATE, iv, False)

        rows.append({
            "strike": strike,
            "is_atm": strike == atm_strike,
            "call": {
                "ltp": round(call_price, 2), "iv": round(iv * 100, 1),
                "oi": call_oi, "oi_change_pct": rng.randint(-15, 25),
                "volume": call_vol,
                **bs_greeks(spot, strike, t_years, RISK_FREE_RATE, iv, True),
            },
            "put": {
                "ltp": round(put_price, 2), "iv": round(iv * 100, 1),
                "oi": put_oi, "oi_change_pct": rng.randint(-15, 25),
                "volume": put_vol,
                **bs_greeks(spot, strike, t_years, RISK_FREE_RATE, iv, False),
            },
        })

    total_call_oi = sum(r["call"]["oi"] for r in rows)
    total_put_oi = sum(r["put"]["oi"] for r in rows)
    pcr = round(total_put_oi / total_call_oi, 2) if total_call_oi else None

    return {
        "index": index,
        "spot": spot,
        "change_pct": _change_pct(ticker, spot),
        "expiry": expiry,
        "available_expiries": expiries,
        "pcr": pcr,
        "strikes": rows,
        "note": DISCLAIMER,
    }
