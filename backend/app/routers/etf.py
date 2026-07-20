from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.services.etf_scanner import load_etf_list, run_strategy

router = APIRouter(prefix="/etf", tags=["etf"], dependencies=[Depends(get_current_user)])


@router.get("/list")
def list_etfs():
    return {"etfs": load_etf_list()}


@router.get("/scan")
def scan():
    return run_strategy()
