import os
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = PROJECT_ROOT / "app"
sys.path.insert(0, str(APP_ROOT))

os.environ.setdefault("SUPABASE_URL", "http://test-supabase.local")
os.environ.setdefault("SUPABASE_KEY", "test-supabase-key")

from main import app  # noqa: E402
from services.security import security_service  # noqa: E402
import db.db as db_module  # noqa: E402
import services.image_services as image_services  # noqa: E402
import services.link_services as link_services  # noqa: E402
import services.node_services as node_services  # noqa: E402
import services.user_services as user_services  # noqa: E402


class FakeResponse:
    def __init__(self, data):
        self.data = data

    def __getitem__(self, key):
        if key == "data":
            return self.data
        raise KeyError(key)


@pytest.fixture()
def test_user_id():
    return 12345


@pytest.fixture()
def mock_supabase(monkeypatch):
    table_mock = MagicMock()
    table_mock.insert.return_value = table_mock
    table_mock.update.return_value = table_mock
    table_mock.select.return_value = table_mock
    table_mock.delete.return_value = table_mock
    table_mock.eq.return_value = table_mock
    table_mock.execute.return_value = FakeResponse(data=[])

    bucket_mock = MagicMock()
    bucket_mock.create_signed_upload_url.return_value = {"signedUrl": "https://example.com/upload"}
    bucket_mock.create_signed_url.return_value = {"signedUrl": "https://example.com/signed"}
    bucket_mock.remove.return_value = [{"name": "test.png"}]

    storage_mock = MagicMock()
    storage_mock.from_.return_value = bucket_mock

    supabase_mock = MagicMock()
    supabase_mock.table.return_value = table_mock
    supabase_mock.storage = storage_mock

    for module in (
        db_module,
        image_services,
        link_services,
        node_services,
        user_services,
    ):
        monkeypatch.setattr(module, "supabase", supabase_mock)

    return supabase_mock


@pytest.fixture()
def test_client(mock_supabase, test_user_id):
    app.dependency_overrides[security_service.get_current_user] = lambda: test_user_id
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
