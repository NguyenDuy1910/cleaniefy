from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


# Load developer secrets from backend/.env without replacing variables supplied
# by Vercel, the shell, or CI. A missing file is intentionally a no-op.
load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)


@lru_cache
def database_url() -> str:
    # The hosted backend talks directly to Neon through this one explicit
    # connection variable. SQLite is intentionally local-only demo/test mode.
    url = os.getenv("NEON_DATABASE_URL")
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
