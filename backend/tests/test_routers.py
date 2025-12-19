import sys
from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
APP_PATH = ROOT / "backend" / "app"
sys.path.insert(0, str(APP_PATH))

from main import app  # noqa: E402
from services.security import security_service  # noqa: E402
from services.user_services import user_service  # noqa: E402
from services.image_services import image_service  # noqa: E402
from services.node_services import node_service  # noqa: E402
from services.link_services import link_service  # noqa: E402


@pytest.fixture
def client():
    app.dependency_overrides[security_service.get_current_user] = lambda: 42
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_create_user_valid_payload(client, monkeypatch):
    def fake_create_user(payload):
        return {
            "user_id": 1,
            "first_name": payload.first_name,
            "surname": payload.surname,
            "email": payload.email,
            "created_at": "2024-01-01T00:00:00",
        }

    monkeypatch.setattr(user_service, "create_user", fake_create_user)

    payload = {
        "first_name": "Ada",
        "surname": "Lovelace",
        "email": "ada@example.com",
        "password": "secret",
    }
    response = client.post("/users/create_user", json=payload)

    assert response.status_code == 200
    assert response.json()["email"] == "ada@example.com"


def test_create_user_missing_fields_returns_422(client):
    payload = {"first_name": "Ada", "surname": "Lovelace", "password": "secret"}
    response = client.post("/users/create_user", json=payload)

    assert response.status_code == 422


def test_get_access_token_valid_credentials(client, monkeypatch):
    def fake_login_user(payload):
        return {"access_token": "token", "token_type": "bearer"}

    monkeypatch.setattr(user_service, "login_user", fake_login_user)

    response = client.post(
        "/users/get_access_token",
        data={"username": "ada@example.com", "password": "secret"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "token"


def test_get_access_token_invalid_credentials_returns_404(client, monkeypatch):
    def fake_login_user(payload):
        raise HTTPException(status_code=404, detail="Email or password do not match!")

    monkeypatch.setattr(user_service, "login_user", fake_login_user)

    response = client.post(
        "/users/get_access_token",
        data={"username": "ada@example.com", "password": "wrong"},
    )

    assert response.status_code == 404


def test_get_upload_url_authorized_flow(client, monkeypatch):
    def fake_get_upload_url(payload):
        return "https://example.com/signed-url"

    monkeypatch.setattr(image_service, "get_upload_url", fake_get_upload_url)

    response = client.post("/images/get_upload_url", params={"file_name": "image.png"})

    assert response.status_code == 200
    assert response.json() == "https://example.com/signed-url"


def test_create_node_valid_payload(client, monkeypatch):
    def fake_create_node(payload):
        return {"status": "ok", "image_id": payload.image_id}

    monkeypatch.setattr(node_service, "create_node", fake_create_node)

    response = client.post(
        "/nodes/create_node",
        params={"image_id": "img-123", "description": "node"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_node_missing_fields_returns_422(client):
    response = client.post("/nodes/create_node", params={"image_id": "img-123"})

    assert response.status_code == 422


def test_create_link_valid_payload(client, monkeypatch):
    def fake_create_link(payload):
        return {"status": "ok", "source": payload.source_node_id}

    monkeypatch.setattr(link_service, "create_link", fake_create_link)

    response = client.post(
        "/nodelinks/create_link",
        params={"source_node_id": "node-1", "target_node_id": "node-2"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_link_missing_fields_returns_422(client):
    response = client.post("/nodelinks/create_link", params={"source_node_id": "node-1"})

    assert response.status_code == 422
