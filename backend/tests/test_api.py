from __future__ import annotations

from datetime import date, timedelta

from fastapi.testclient import TestClient

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
