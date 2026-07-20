"""
Minimal but real auth: SQLite user store, PBKDF2-HMAC password hashing (no
bcrypt/passlib dependency), JWT bearer tokens via PyJWT. Enough to gate a
demo app behind actual login/registration without pulling in a full auth
framework -- Postgres + a proper session/refresh-token flow is the Phase 2
upgrade (see root README).
"""
import hashlib
import os
import sqlite3
import time
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import DB_PATH, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRY_HOURS

_bearer = HTTPBearer(auto_error=False)


def _get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TEXT NOT NULL
        )"""
    )
    return conn


def _hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000).hex()


def create_user(username: str, password: str) -> dict:
    conn = _get_conn()
    try:
        existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if existing:
            raise ValueError("Username already taken")
        salt = os.urandom(16).hex()
        password_hash = _hash_password(password, salt)
        conn.execute(
            "INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)",
            (username, password_hash, salt, datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()
        return {"username": username}
    finally:
        conn.close()


def authenticate_user(username: str, password: str) -> dict | None:
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT username, password_hash, salt FROM users WHERE username = ?", (username,)
        ).fetchone()
        if not row:
            return None
        db_username, password_hash, salt = row
        if _hash_password(password, salt) != password_hash:
            return None
        return {"username": db_username}
    finally:
        conn.close()


def create_access_token(username: str) -> str:
    payload = {
        "sub": username,
        "iat": int(time.time()),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> str:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    return payload["sub"]
