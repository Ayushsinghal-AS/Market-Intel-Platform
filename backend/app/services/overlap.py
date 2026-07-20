"""
Portfolio overlap analyzer: if you own NIFTYBEES and RELIANCE directly, your
real single-stock exposure to Reliance is higher than either position alone
suggests. Free live ETF constituent data isn't available via yfinance, so this
uses a static snapshot of known top holdings for common Indian ETFs (refresh
periodically from the AMC's factsheet) -- documented as an approximation, not
real-time look-through.
"""

# ticker -> {holding_ticker: weight_pct}. Approximate, illustrative snapshot.
ETF_HOLDINGS_SNAPSHOT = {
    "NIFTYBEES.NS": {
        "HDFCBANK.NS": 12.9, "RELIANCE.NS": 9.2, "ICICIBANK.NS": 8.1,
        "INFY.NS": 5.9, "TCS.NS": 4.1, "BHARTIARTL.NS": 3.9,
        "ITC.NS": 3.7, "KOTAKBANK.NS": 3.0, "LT.NS": 3.0, "AXISBANK.NS": 2.9,
    },
    "BANKBEES.NS": {
        "HDFCBANK.NS": 28.9, "ICICIBANK.NS": 24.8, "SBIN.NS": 10.2,
        "KOTAKBANK.NS": 9.1, "AXISBANK.NS": 8.6, "INDUSINDBK.NS": 3.4,
    },
    "ITBEES.NS": {
        "TCS.NS": 27.5, "INFY.NS": 24.6, "HCLTECH.NS": 10.8,
        "TECHM.NS": 8.5, "WIPRO.NS": 8.1, "LTIM.NS": 6.4,
    },
    "JUNIORBEES.NS": {
        "ADANIENT.NS": 4.2, "DIVISLAB.NS": 3.1, "TATAPOWER.NS": 2.9,
        "PIDILITIND.NS": 2.7, "VEDL.NS": 2.6,
    },
    "GOLDBEES.NS": {"GOLD (commodity)": 100.0},
    "SILVERBEES.NS": {"SILVER (commodity)": 100.0},
}


def compute_overlap(holdings: list[dict]) -> dict:
    """holdings: [{ticker, value}] where `value` is current market value (INR).
    Returns look-through exposure per underlying name, aggregated across direct
    stock holdings and ETF holdings' implied stock exposure."""
    total_value = sum(h["value"] for h in holdings)
    if total_value <= 0:
        return {"error": "Total portfolio value must be > 0"}

    exposure: dict[str, float] = {}
    unmapped_etfs = []

    for h in holdings:
        ticker, value = h["ticker"], h["value"]
        if ticker in ETF_HOLDINGS_SNAPSHOT:
            for underlying, weight_pct in ETF_HOLDINGS_SNAPSHOT[ticker].items():
                exposure[underlying] = exposure.get(underlying, 0.0) + value * (weight_pct / 100)
        elif ticker.endswith(".NS") is False and "BEES" in ticker.upper():
            unmapped_etfs.append(ticker)
        else:
            # treat as a direct stock (or an ETF we don't have a snapshot for)
            exposure[ticker] = exposure.get(ticker, 0.0) + value

    rows = [
        {
            "name": name,
            "look_through_value": round(amount, 2),
            "pct_of_portfolio": round(amount / total_value * 100, 2),
        }
        for name, amount in exposure.items()
    ]
    rows.sort(key=lambda r: r["pct_of_portfolio"], reverse=True)

    concentration_flags = [r for r in rows if r["pct_of_portfolio"] >= 10.0]

    return {
        "total_portfolio_value": round(total_value, 2),
        "look_through_exposure": rows,
        "concentration_flags": concentration_flags,
        "note": (
            "ETF look-through uses a static illustrative holdings snapshot "
            "(see ETF_HOLDINGS_SNAPSHOT) since free real-time constituent "
            "data isn't available -- refresh from AMC factsheets for production use."
        ),
    }
