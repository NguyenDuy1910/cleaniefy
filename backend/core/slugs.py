from __future__ import annotations

import re
import unicodedata

from fastapi import HTTPException, status

RESERVED_PARTNER_SLUGS = frozenset({
    "admin", "api", "dashboard", "login", "logout", "signup", "register", "pricing", "features",
    "templates", "settings", "bookings", "about", "support", "help", "privacy", "terms", "assets",
    "static", "robots", "sitemap", "favicon", "_next", "demo",
})
SLUG_PATTERN = re.compile(r"^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$")


def validate_slug(slug: str) -> str:
    if not SLUG_PATTERN.fullmatch(slug):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Use 3–40 lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen.")
    if slug in RESERVED_PARTNER_SLUGS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="That Cleanie link is reserved.")
    return slug


def suggest_slug(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").lower()
    result = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-") or "cleaner"
    result = result[:40].strip("-")
    if len(result) < 3:
        result = f"{result}-cleaning"[:40]
    return result
