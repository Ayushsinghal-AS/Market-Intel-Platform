from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.services.news import get_news_with_sentiment

router = APIRouter(prefix="/news", tags=["news"], dependencies=[Depends(get_current_user)])


@router.get("/sentiment/{ticker}")
def news_sentiment(ticker: str, limit: int = 10):
    return get_news_with_sentiment(ticker, limit=limit)
