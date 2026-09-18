from __future__ import annotations

import os
from functools import lru_cache


@lru_cache
def database_url() -> str:
    url = os.getenv("DATABASE_URL", "sqlite:///./cleanie.db")
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def auth_secret() -> str:
    return os.getenv("AUTH_SECRET", "local-development-secret-change-me")


def is_local_database() -> bool:
    return database_url().startswith("sqlite")
