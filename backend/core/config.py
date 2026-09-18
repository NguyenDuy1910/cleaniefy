from __future__ import annotations

import os
from functools import lru_cache


@lru_cache
def database_url() -> str:
    # Vercel's Neon integration supplies DATABASE_URL by default. Supporting the
    # prefixed name also makes `vercel integration add neon --prefix NEON_` work
    # without an application-code change.
    url = os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL") or "sqlite:///./cleanie.db"
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def auth_secret() -> str:
    return os.getenv("AUTH_SECRET", "local-development-secret-change-me")


def is_local_database() -> bool:
    return database_url().startswith("sqlite")


def blob_storage_credentials() -> tuple[str, str] | None:
    """Return the explicitly configured Vercel Blob store and its write token."""
    store_id = os.getenv("BLOB_STORE_ID", "").strip()
    token = os.getenv("BLOB_READ_WRITE_TOKEN", "").strip()
    if not store_id or not token:
        return None
    return store_id, token
