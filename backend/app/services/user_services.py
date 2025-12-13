from __future__ import annotations

import base64
import os
import secrets
import hashlib
from typing import Any

from models.user import UserCreate, UserLogin, UserPublic
from db.db import supabase


def _hash_password(password: str, salt: str | None = None) -> str:
    """PBKDF2-HMAC-SHA256 with a salt; returns base64 string."""
    salt_bytes = (salt or os.getenv("PASSWORD_SALT") or "static-salt").encode()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt_bytes, 100_000)
    return base64.b64encode(digest).decode()

def _mutate_dict(mapping: dict, old_key: str | Any, new_key: str | Any, new_value : Any):
    mutated_dict = {}
    for k, v in mapping.items():
        if k == old_key:
            mutated_dict[new_key] = new_value
        else:
            mutated_dict[k] = v
    return mutated_dict

class UserService:
    def __init__(self, salt: str | None = None):
        self._salt = salt

    def create_user(self, payload: UserCreate) -> UserPublic:
        hashed = _hash_password(payload.password, self._salt)
        raw_input = payload.model_dump()
        modified_user = _mutate_dict(raw_input, old_key="password", new_key="password_hash", new_value=hashed)
        try:
            response = supabase.table("users").insert(modified_user).execute()
        except Exception as e:
            # PRINT THE REAL ERROR so you can debug it
            print(f"❌ SUPABASE ERROR: {e}")
            print(f"Payload keys being sent: {modified_user.keys()}")
            
            raise e
        if response.data:
            return response.data[0] 
        return None
        


user_service = UserService()