from fastapi import APIRouter, HTTPException

from app.services.options import build_chain
from app.services.fno_signals import annotate_screener

router = APIRouter(prefix="/fno", tags=["fno"])


@router.get("/chain")
def chain(index: str = "NIFTY", expiry: str | None = None):
    result = build_chain(index.upper(), expiry)
    if result.get("error"):
        raise HTTPException(400, result["error"])
    return annotate_screener(index.upper(), result)
