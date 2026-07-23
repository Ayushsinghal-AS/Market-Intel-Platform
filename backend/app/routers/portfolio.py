from fastapi import APIRouter

from app.schemas import PortfolioRequest, OverlapRequest
from app.services import portfolio as portfolio_service
from app.services import overlap as overlap_service

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.post("/analyze")
def analyze(req: PortfolioRequest):
    return portfolio_service.analyze_portfolio([h.model_dump() for h in req.holdings])


@router.post("/overlap")
def overlap(req: OverlapRequest):
    return overlap_service.compute_overlap([h.model_dump() for h in req.holdings])
