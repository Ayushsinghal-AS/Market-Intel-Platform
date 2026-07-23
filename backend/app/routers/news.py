from fastapi import APIRouter

from app.services.news import get_news_with_sentiment

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/sentiment/{ticker}")
def news_sentiment(ticker: str, limit: int = 10):
    return get_news_with_sentiment(ticker, limit=limit)
