from __future__ import annotations

from typing import Any
from fastapi import HTTPException
from datetime import timedelta

from models.user import UserCreate, UserLogin, UserPublic
from db.db import supabase
from services.security import security_service


def _mutate_dict(mapping: dict, old_key: str | Any, new_key: str | Any, new_value : Any):
    mutated_dict = {}
    for k, v in mapping.items():
        if k == old_key:
            mutated_dict[new_key] = new_value
        else:
            mutated_dict[k] = v
    return mutated_dict

class UserService:
    def __init__(self):
        pass

    def create_user(self, payload: UserCreate) -> UserPublic:
        hashed = security_service.create_password_hash(payload.password)
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
    
    def login_user(self, payload: UserLogin):
        request_in = payload.model_dump()
        try:
            response = supabase.table("users").select("user_id", "password_hash").eq("email", request_in["email"]).execute()
            hashed_password = response.data[0]["password_hash"]
        except Exception as e:
            print(f"Supabase Error: {e}")
            raise e

        print(hashed_password)
        if security_service.verify_password(payload.password, hashed_password):
            token = security_service.create_access_token(request_in, expires_delta=timedelta(minutes=15))
            return token
        else:
            raise HTTPException(status_code=404, detail="Email or password do not match!")
        
        


user_service = UserService()