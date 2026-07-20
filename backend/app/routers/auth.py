import os

from fastapi import APIRouter, Depends, HTTPException

from app.auth import create_user, authenticate_user, create_access_token, get_current_user
from app.schemas import AuthRequest

router = APIRouter(prefix="/auth", tags=["auth"])

# Fixed, passwordless demo account so a client can open the deployed link without
# registering. Guest data lives in the same users table as real accounts.
GUEST_USERNAME = "guest"
GUEST_PASSWORD = os.getenv("GUEST_PASSWORD", "guest-demo-account")


@router.post("/register")
def register(req: AuthRequest):
    try:
        create_user(req.username, req.password)
    except ValueError as e:
        raise HTTPException(409, str(e))
    token = create_access_token(req.username)
    return {"access_token": token, "token_type": "bearer", "username": req.username}


@router.post("/login")
def login(req: AuthRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(401, "Invalid username or password")
    token = create_access_token(user["username"])
    return {"access_token": token, "token_type": "bearer", "username": user["username"]}


@router.post("/guest")
def guest_login():
    try:
        create_user(GUEST_USERNAME, GUEST_PASSWORD)
    except ValueError:
        pass  # guest account already provisioned
    token = create_access_token(GUEST_USERNAME)
    return {"access_token": token, "token_type": "bearer", "username": GUEST_USERNAME}


@router.get("/me")
def me(username: str = Depends(get_current_user)):
    return {"username": username}
