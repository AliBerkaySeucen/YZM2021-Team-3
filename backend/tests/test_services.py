import pathlib
import sys

import pytest
from fastapi import HTTPException

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1] / "app"))

from models.image import ImageFilename
from models.link import LinkDataFields as link_df
from models.link import NodeLinkDelete
from models.node import NodeDataFields as node_df
from models.node import NodeUpdate
from models.user import UserCreate, UserLogin
from services import image_services, link_services, node_services, user_services
from services.image_services import ImageService
from services.link_services import LinkService
from services.node_services import NodeService
from services.user_services import UserService


class DummyResponse:
    def __init__(self, data):
        self.data = data


class TableChain:
    def __init__(self, response=None, exc=None):
        self.response = response
        self.exc = exc

    def insert(self, *args, **kwargs):
        return self

    def update(self, *args, **kwargs):
        return self

    def delete(self, *args, **kwargs):
        return self

    def select(self, *args, **kwargs):
        return self

    def eq(self, *args, **kwargs):
        return self

    def execute(self):
        if self.exc:
            raise self.exc
        return self.response


class StorageBucket:
    def __init__(self, response):
        self.response = response

    def create_signed_upload_url(self, path):
        return self.response


class StorageStub:
    def __init__(self, response):
        self.response = response

    def from_(self, name):
        return StorageBucket(self.response)


class SupabaseStub:
    def __init__(self, table_chain=None, storage=None):
        self._table_chain = table_chain
        self.storage = storage

    def table(self, name):
        return self._table_chain


def test_create_user_success(monkeypatch):
    payload = UserCreate(
        first_name="Sam",
        surname="Smith",
        email="sam@example.com",
        password="secret",
    )
    response = DummyResponse([{"user_id": 1, "email": "sam@example.com"}])
    supabase_stub = SupabaseStub(table_chain=TableChain(response=response))

    monkeypatch.setattr(user_services, "supabase", supabase_stub)
    monkeypatch.setattr(
        user_services.security_service,
        "create_password_hash",
        lambda password: "hashed-secret",
    )

    service = UserService()
    assert service.create_user(payload) == {"user_id": 1, "email": "sam@example.com"}


def test_create_user_supabase_error(monkeypatch):
    payload = UserCreate(
        first_name="Sam",
        surname="Smith",
        email="sam@example.com",
        password="secret",
    )
    supabase_stub = SupabaseStub(table_chain=TableChain(exc=RuntimeError("supabase down")))

    monkeypatch.setattr(user_services, "supabase", supabase_stub)
    monkeypatch.setattr(
        user_services.security_service,
        "create_password_hash",
        lambda password: "hashed-secret",
    )

    service = UserService()
    with pytest.raises(RuntimeError, match="supabase down"):
        service.create_user(payload)


def test_login_user_valid_password(monkeypatch):
    payload = UserLogin(email="sam@example.com", password="secret")
    response = DummyResponse([{"user_id": 12, "password_hash": "hashed-secret"}])
    supabase_stub = SupabaseStub(table_chain=TableChain(response=response))

    monkeypatch.setattr(user_services, "supabase", supabase_stub)
    monkeypatch.setattr(
        user_services.security_service, "verify_password", lambda raw, hashed: True
    )
    monkeypatch.setattr(
        user_services.security_service,
        "create_access_token",
        lambda payload, expires_delta: "token-12",
    )

    service = UserService()
    assert service.login_user(payload) == "token-12"


def test_login_user_invalid_password(monkeypatch):
    payload = UserLogin(email="sam@example.com", password="wrong")
    response = DummyResponse([{"user_id": 12, "password_hash": "hashed-secret"}])
    supabase_stub = SupabaseStub(table_chain=TableChain(response=response))

    monkeypatch.setattr(user_services, "supabase", supabase_stub)
    monkeypatch.setattr(
        user_services.security_service, "verify_password", lambda raw, hashed: False
    )

    service = UserService()
    with pytest.raises(HTTPException) as exc_info:
        service.login_user(payload)

    assert exc_info.value.detail == "Email or password do not match!"


def test_get_upload_url_success(monkeypatch):
    payload = ImageFilename(user_id=1, file_name="photo.png")
    supabase_stub = SupabaseStub(storage=StorageStub({"signedUrl": "https://url"}))

    monkeypatch.setattr(image_services, "supabase", supabase_stub)

    service = ImageService()
    assert service.get_upload_url(payload) == "https://url"


def test_get_upload_url_no_response(monkeypatch):
    payload = ImageFilename(user_id=1, file_name="photo.png")
    supabase_stub = SupabaseStub(storage=StorageStub(None))

    monkeypatch.setattr(image_services, "supabase", supabase_stub)

    service = ImageService()
    with pytest.raises(HTTPException) as exc_info:
        service.get_upload_url(payload)

    assert exc_info.value.detail == "Failed to generate URL from Supabase"


def test_update_node_success(monkeypatch):
    payload = NodeUpdate(
        user_id=1, node_id="node-1", image_id="img-1", description="desc"
    )
    response = DummyResponse([{"updated": True}])
    supabase_stub = SupabaseStub(table_chain=TableChain(response=response))

    monkeypatch.setattr(node_services, "supabase", supabase_stub)

    service = NodeService()
    monkeypatch.setattr(
        service,
        "_wrap_node_op",
        lambda payload: {
            node_df.user_id: 1,
            node_df.node_id: "node-1",
            node_df.image_id: "img-1",
            node_df.description: "desc",
        },
    )

    assert service.update_node(payload) == response


def test_update_node_supabase_error(monkeypatch):
    payload = NodeUpdate(
        user_id=1, node_id="node-1", image_id="img-1", description="desc"
    )
    supabase_stub = SupabaseStub(table_chain=TableChain(exc=RuntimeError("db error")))

    monkeypatch.setattr(node_services, "supabase", supabase_stub)

    service = NodeService()
    monkeypatch.setattr(
        service,
        "_wrap_node_op",
        lambda payload: {
            node_df.user_id: 1,
            node_df.node_id: "node-1",
            node_df.image_id: "img-1",
            node_df.description: "desc",
        },
    )

    with pytest.raises(RuntimeError, match="db error"):
        service.update_node(payload)


def test_delete_link_success(monkeypatch):
    payload = NodeLinkDelete(user_id=1, link_id=3)
    response = DummyResponse([{"deleted": True}])
    supabase_stub = SupabaseStub(table_chain=TableChain(response=response))

    monkeypatch.setattr(link_services, "supabase", supabase_stub)

    service = LinkService()
    assert service.delete_link(payload) == response


def test_delete_link_supabase_error(monkeypatch):
    payload = NodeLinkDelete(user_id=1, link_id=3)
    supabase_stub = SupabaseStub(table_chain=TableChain(exc=RuntimeError("delete fail")))

    monkeypatch.setattr(link_services, "supabase", supabase_stub)

    service = LinkService()
    with pytest.raises(RuntimeError, match="delete fail"):
        service.delete_link(payload)
