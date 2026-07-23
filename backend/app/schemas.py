from pydantic import BaseModel, Field


class Holding(BaseModel):
    ticker: str
    quantity: float
    buy_price: float
    buy_date: str = Field(description="YYYY-MM-DD")


class PortfolioRequest(BaseModel):
    holdings: list[Holding]


class OverlapHolding(BaseModel):
    ticker: str
    value: float


class OverlapRequest(BaseModel):
    holdings: list[OverlapHolding]


class BacktestRequest(BaseModel):
    ticker: str
    short_window: int = 50
    long_window: int = 200
    period: str = "5y"
