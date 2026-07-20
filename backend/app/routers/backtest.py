from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.schemas import BacktestRequest
from app.services.backtest import run_ma_crossover

router = APIRouter(prefix="/backtest", tags=["backtest"], dependencies=[Depends(get_current_user)])


@router.post("/ma-crossover")
def ma_crossover(req: BacktestRequest):
    return run_ma_crossover(req.ticker, req.short_window, req.long_window, req.period)
