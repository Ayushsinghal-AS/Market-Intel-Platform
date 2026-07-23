from fastapi import APIRouter

from app.services.etf_scanner import load_etf_list, run_strategy

router = APIRouter(prefix="/etf", tags=["etf"])


@router.get("/list")
def list_etfs():
    return {"etfs": load_etf_list()}


@router.get("/scan")
def scan():
    return run_strategy()
