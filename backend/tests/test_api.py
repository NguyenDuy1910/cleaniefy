from __future__ import annotations

from datetime import date, timedelta
import os
from types import SimpleNamespace

from fastapi.testclient import TestClient

# Keep the test suite entirely local even when backend/.env contains a direct
# Neon URL. This must happen before importing the application and its engine.
os.environ["NEON_DATABASE_URL"] = "sqlite:///./cleanie-test.db"

from core.config import database_url
from main import app


def auth_header(client: TestClient, email: str, password: str = "cleanie-demo") -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def next_available(client: TestClient, slug: str, service_id: str) -> str:
    for offset in range(1, 15):
        response = client.get(f"/api/v1/public/partners/{slug}/availability", params={"date": (date.today() + timedelta(days=offset)).isoformat(), "service_id": service_id})
        assert response.status_code == 200, response.text
        if response.json()["slots"]:
            return response.json()["slots"][0]
    raise AssertionError("seeded partner should have an available slot in the next two weeks")


def test_public_page_only_exposes_published_partner():
    with TestClient(app) as client:
        response = client.get("/api/v1/public/partners/jessica")
        assert response.status_code == 200
        body = response.json()
        assert body["site"]["template"] == "clean"
        assert body["partner"]["status"] == "published"
        assert client.get("/api/v1/public/partners/no-such-cleaner").status_code == 404


def test_reserved_slug_and_tenant_isolation():
    with TestClient(app) as client:
        jessica = auth_header(client, "jessica@example.com")
        assert client.get("/api/v1/partners/slug-availability?slug=dashboard").json()["available"] is False
        service = client.post("/api/v1/partners/me/services", headers=jessica, json={"name": "Move-out clean", "description": "Empty home reset", "priceCents": 22000, "durationMinutes": 180, "active": True})
        assert service.status_code == 201
        warm = auth_header(client, "warm@example.com")
        forbidden = client.patch(f"/api/v1/partners/me/services/{service.json()['id']}", headers=warm, json={"name": "Not yours"})
        assert forbidden.status_code == 404


def test_booking_conflict_is_rejected_transactionally():
    with TestClient(app) as client:
        public = client.get("/api/v1/public/partners/jessica").json()
        service_id = public["services"][0]["id"]
        slot = next_available(client, "jessica", service_id)
        payload = {"serviceId": service_id, "scheduledStart": slot, "customerName": "Taylor Client", "customerPhone": "555-0100", "customerAddress": "42 Booking Lane"}
        first = client.post("/api/v1/public/partners/jessica/bookings", json=payload)
        assert first.status_code == 201, first.text
        second = client.post("/api/v1/public/partners/jessica/bookings", json=payload)
        assert second.status_code == 409
        assert "just booked" in second.json()["detail"]


def test_media_upload_uses_the_configured_blob_store(monkeypatch):
    captured: dict[str, object] = {}

    class FakeBlobClient:
        def __init__(self, token: str):
            captured["token"] = token

        async def put(self, path: str, body: bytes, **options):
            captured.update({"path": path, "body": body, "options": options})
            return SimpleNamespace(url="https://cleanie-media.public.blob.vercel-storage.com/partners/test/before/image.png")

    monkeypatch.setenv("BLOB_STORE_ID", "cleanie-media")
    monkeypatch.setenv("BLOB_READ_WRITE_TOKEN", "vercel_blob_rw_cleanie-media_example")
    monkeypatch.setattr("vercel.blob.AsyncBlobClient", FakeBlobClient)
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/partners/me/media",
            headers=auth_header(client, "jessica@example.com"),
            data={"purpose": "before"},
            files={"file": ("before image.png", b"png-data", "image/png")},
        )

    assert response.status_code == 200, response.text
    assert response.json()["url"].startswith("https://cleanie-media.public.blob.vercel-storage.com/")
    assert captured["token"] == "vercel_blob_rw_cleanie-media_example"
    assert str(captured["path"]).endswith("/before/before-image.png")
    assert captured["options"] == {"access": "public", "add_random_suffix": True, "content_type": "image/png"}


def test_media_upload_rejects_missing_blob_configuration(monkeypatch):
    monkeypatch.delenv("BLOB_STORE_ID", raising=False)
    monkeypatch.delenv("BLOB_READ_WRITE_TOKEN", raising=False)
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/partners/me/media",
            headers=auth_header(client, "jessica@example.com"),
            data={"purpose": "before"},
            files={"file": ("before.png", b"png-data", "image/png")},
        )

    assert response.status_code == 503
    assert response.json()["detail"] == "Image storage is not configured."


def test_extended_template_selection_persists_a_backend_preset():
    with TestClient(app) as client:
        headers = auth_header(client, "jessica@example.com")
        original = client.get("/api/v1/partners/me", headers=headers).json()["site"]
        response = client.put("/api/v1/partners/me/theme", headers=headers, json={"template": "eco-calm"})
        assert response.status_code == 200, response.text
        assert response.json()["template"] == "eco-calm"
        assert response.json()["theme"]["primaryColor"] == "#4f6f52"
        restore = client.put("/api/v1/partners/me/theme", headers=headers, json=original)
        assert restore.status_code == 200, restore.text


def test_all_seeded_template_pages_render_from_the_public_api():
    expected_templates = {
        "jessica": "clean",
        "warm-demo": "warm-home",
        "sparkle": "pro",
        "fresh-start": "fresh-start",
        "signature-clean": "signature",
        "green-room": "eco-calm",
        "move-ready": "move-ready",
        "bright-home": "bright-home",
        "studio-luxe": "studio-luxe",
        "neighborly": "neighborly",
    }
    with TestClient(app) as client:
        for slug, template in expected_templates.items():
            response = client.get(f"/api/v1/public/partners/{slug}")
            assert response.status_code == 200, response.text
            assert response.json()["site"]["template"] == template


def test_neon_database_url_is_the_direct_hosted_database_setting(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://ignored:ignored@legacy.example/ignored")
    monkeypatch.setenv("NEON_DATABASE_URL", "postgresql://neon:password@ep-example-pooler.neon.tech/neondb?sslmode=require")
    database_url.cache_clear()
    try:
        assert database_url() == "postgresql+psycopg://neon:password@ep-example-pooler.neon.tech/neondb?sslmode=require"
    finally:
        database_url.cache_clear()
