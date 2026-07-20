"""
News + sentiment layer. Headlines come from yfinance's `Ticker.news` (Yahoo's
own news feed for that symbol -- no scraping, no separate API key).

Sentiment is a small finance-tuned lexicon scorer, not an LLM call: it's fast,
free, and has zero external dependency, which matters for a resume demo you
want to keep runnable without secrets. Swapping this function's body for a
HuggingFace/OpenAI call is the documented Phase-2 upgrade (see root README)
without touching the router or response shape.
"""
import re
import yfinance as yf

from app.cache import cached
from app.config import CACHE_TTL_NEWS

POSITIVE_WORDS = {
    "beat", "beats", "surge", "surges", "rally", "rallies", "upgrade", "upgraded",
    "record", "growth", "profit", "profits", "gain", "gains", "bullish", "outperform",
    "expansion", "strong", "buy", "jump", "jumps", "soar", "soars", "high", "wins",
    "win", "boost", "boosts", "positive", "up", "rises", "rise", "rose",
}
NEGATIVE_WORDS = {
    "miss", "misses", "plunge", "plunges", "fall", "falls", "fell", "downgrade",
    "downgraded", "loss", "losses", "bearish", "underperform", "weak", "sell",
    "sell-off", "selloff", "drop", "drops", "slump", "slumps", "low", "cut", "cuts",
    "negative", "down", "decline", "declines", "probe", "fraud", "lawsuit", "scrutiny",
}

_WORD_RE = re.compile(r"[a-zA-Z']+")


def score_sentiment(text: str) -> dict:
    words = [w.lower() for w in _WORD_RE.findall(text)]
    pos_hits = sum(1 for w in words if w in POSITIVE_WORDS)
    neg_hits = sum(1 for w in words if w in NEGATIVE_WORDS)
    raw = pos_hits - neg_hits
    if raw > 0:
        label = "Positive"
    elif raw < 0:
        label = "Negative"
    else:
        label = "Neutral"
    denom = max(pos_hits + neg_hits, 1)
    impact_score = round(raw / denom, 2)  # -1..1
    return {"label": label, "impact_score": impact_score, "positive_hits": pos_hits, "negative_hits": neg_hits}


@cached(ttl=CACHE_TTL_NEWS)
def get_news_with_sentiment(ticker: str, limit: int = 10) -> dict:
    articles = yf.Ticker(ticker).news or []
    results = []
    pos = neg = neu = 0

    for item in articles[:limit]:
        content = item.get("content", item)  # yfinance news schema has shifted across versions
        title = content.get("title") or item.get("title") or ""
        publisher = (content.get("provider") or {}).get("displayName") if isinstance(content.get("provider"), dict) else item.get("publisher")
        link = (content.get("canonicalUrl") or {}).get("url") if isinstance(content.get("canonicalUrl"), dict) else item.get("link")
        summary = content.get("summary", "")

        sentiment = score_sentiment(f"{title}. {summary}")
        if sentiment["label"] == "Positive":
            pos += 1
        elif sentiment["label"] == "Negative":
            neg += 1
        else:
            neu += 1

        results.append({
            "title": title,
            "publisher": publisher,
            "link": link,
            "sentiment": sentiment["label"],
            "impact_score": sentiment["impact_score"],
        })

    total = max(len(results), 1)
    return {
        "ticker": ticker,
        "articles": results,
        "summary": {
            "positive": pos, "negative": neg, "neutral": neu,
            "overall_sentiment": "Positive" if pos > neg else ("Negative" if neg > pos else "Neutral"),
            "positive_pct": round(pos / total * 100, 1),
            "negative_pct": round(neg / total * 100, 1),
        },
    }
