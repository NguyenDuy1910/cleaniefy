from __future__ import annotations

import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import auth_secret
from db.session import get_db
from models import User

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt${base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, encoded_salt, encoded_digest = stored.split("$", 2)
        digest = hashlib.scrypt(password.encode(), salt=base64.urlsafe_b64decode(encoded_salt), n=2**14, r=8, p=1)
        return hmac.compare_digest(digest, base64.urlsafe_b64decode(encoded_digest))
    except (ValueError, TypeError):
        return False


def create_access_token(user: User) -> str:
    payload = {"sub": user.id, "email": user.email, "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return jwt.encode(payload, auth_secret(), algorithm="HS256")


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please log in to continue.")
    try:
        user_id = jwt.decode(credentials.credentials, auth_secret(), algorithms=["HS256"])["sub"]
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session has expired. Please log in again.") from error
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your account no longer exists.")
    return user
