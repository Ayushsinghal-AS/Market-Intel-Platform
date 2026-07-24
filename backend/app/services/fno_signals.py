"""
Rule-based "notable setup" screener over a synthetic option chain --
deliberately NOT a probability-of-profit model. It flags legs whose real
Black-Scholes delta sits in a directional-but-not-extreme zone, whose
synthetic OI is in the top tier for that side, and whose direction agrees
with the index's real technical verdict (technical.analyze). Target/stop are
illustrative, scaled from the index's real support/resistance levels through
the leg's delta -- not a real options P&L model.
"""
from app.services import market_data, technical
from app.services.options import FNO_INDEX_TICKERS

DELTA_ZONE = (0.35, 0.55)
MAX_SIGNALS = 4


def _index_technical(index: str) -> dict | None:
    ticker = FNO_INDEX_TICKERS.get(index)
    if not ticker:
        return None
    df = market_data.get_history(ticker, period="1y")
    if df.empty:
        return None
    return technical.analyze(df)


def _nearest_above(levels: list[float], value: float) -> float | None:
    above = [lvl for lvl in levels if lvl > value]
    return min(above) if above else None


def _nearest_below(levels: list[float], value: float) -> float | None:
    below = [lvl for lvl in levels if lvl < value]
    return max(below) if below else None


STOP_LOSS_PREMIUM_FRACTION = 0.35  # illustrative: risk capped at 35% of the leg's current premium


def _build_screener(leg: dict, spot: float, index_target: float, verdict: str) -> dict:
    """Target is scaled from the index's real nearest support/resistance
    level through the leg's real delta -- can legitimately exceed the leg's
    current premium (options are convex; that's not a bug). Stop-loss is
    instead sized as a fixed fraction of the leg's OWN current premium (the
    standard "risk X% of premium" options convention), not as a fraction of
    the target move -- deriving it from the target would clamp to a
    near-zero floor whenever the target move is large relative to the
    premium, which is common and not itself a signal of anything. This is an
    illustrative sizing convention, not a real options P&L model."""
    delta = abs(leg["delta"])
    move_to_target = delta * abs(index_target - spot)
    target_price = round(leg["ltp"] + move_to_target, 2)
    stop_price = round(leg["ltp"] * (1 - STOP_LOSS_PREMIUM_FRACTION), 2)
    reward = target_price - leg["ltp"]
    risk = leg["ltp"] - stop_price
    rr = round(reward / risk, 2) if risk > 0 else None
    return {
        "label": "Notable Setup",
        "rationale": f"Delta {leg['delta']} in directional zone, OI in top tier, index verdict {verdict}",
        "target": target_price,
        "stop_loss": stop_price,
        "risk_reward": f"1:{rr}" if rr else "—",
        "horizon": "Intraday Quick Scalp" if move_to_target < leg["ltp"] * 0.5 else "Positional (till expiry)",
    }


def annotate_screener(index: str, chain: dict) -> dict:
    """Returns a NEW chain dict with `screener` attached to qualifying legs --
    does not mutate the input, since `chain` may be a cached object shared
    across requests."""
    if chain.get("error") or not chain.get("strikes"):
        return chain

    tech = _index_technical(index)
    if not tech:
        return chain

    verdict = tech["verdict"]
    wants_call = verdict in ("BUY", "STRONG BUY")
    wants_put = verdict in ("SELL", "STRONG SELL")
    if not (wants_call or wants_put):
        return chain

    spot = chain["spot"]
    resistances = tech["resistance_levels"]
    supports = tech["support_levels"]
    call_target = _nearest_above(resistances, spot)
    put_target = _nearest_below(supports, spot)

    call_ois = sorted((row["call"]["oi"] for row in chain["strikes"]), reverse=True)
    put_ois = sorted((row["put"]["oi"] for row in chain["strikes"]), reverse=True)
    call_oi_floor = call_ois[max(0, len(call_ois) // 3 - 1)] if call_ois else 0
    put_oi_floor = put_ois[max(0, len(put_ois) // 3 - 1)] if put_ois else 0

    new_rows = []
    flagged = 0
    for row in chain["strikes"]:
        new_row = {**row, "call": dict(row["call"]), "put": dict(row["put"])}

        if flagged < MAX_SIGNALS and wants_call and call_target:
            delta = new_row["call"]["delta"]
            if DELTA_ZONE[0] <= delta <= DELTA_ZONE[1] and new_row["call"]["oi"] >= call_oi_floor:
                new_row["call"]["screener"] = _build_screener(new_row["call"], spot, call_target, verdict)
                flagged += 1

        if flagged < MAX_SIGNALS and wants_put and put_target:
            delta = abs(new_row["put"]["delta"])
            if DELTA_ZONE[0] <= delta <= DELTA_ZONE[1] and new_row["put"]["oi"] >= put_oi_floor:
                new_row["put"]["screener"] = _build_screener(new_row["put"], spot, put_target, verdict)
                flagged += 1

        new_rows.append(new_row)

    return {**chain, "strikes": new_rows}
