from __future__ import annotations

from typing import Any, Literal, Union
from fastapi import HTTPException
from datetime import timedelta

from models.user import UserCreate, UserLogin, UserPublic, UserDataFields as df
from db.db import supabase
from services.security import security_service

ResetOptions = Literal["password", "email", "first_name", "surname"]


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

    def create_user(self, payload: UserCreate):
        hashed = security_service.create_password_hash(payload.password)
        raw_input = payload.model_dump()
        modified_user = _mutate_dict(raw_input, old_key="password", new_key="password_hash", new_value=hashed)
        try:
            response = supabase.table("users").insert(modified_user).execute()
        except Exception as e:
            logger.error(f"Supabase error during user creation: {e}")
            raise e
        if response.data:
            return response.data[0] 
        return None
    
    def login_user(self, payload: UserLogin):
        request_in = payload.model_dump()
        try:
            response = supabase.table("users").select("user_id", "password_hash").eq("email", request_in["email"]).execute()
            user_data = response.data[0]
            hashed_password = user_data["password_hash"]
            user_id = user_data["user_id"] 
        except Exception as e:
            logger.error(f"Supabase error during login: {e}")
            raise e

        if security_service.verify_password(payload.password, hashed_password):
            token_payload = {
                "sub": str(user_id), 
                "email": request_in["email"]
            }
            token = security_service.create_access_token(token_payload, expires_delta=timedelta(minutes=30))
            return token
        else:
            raise HTTPException(status_code=404, detail="Email or password do not match!")
        
    def reset_user_info(self, user_id : int, new_val : str, reset_mode : ResetOptions):
        """Resets first_name, surname, email or password (only 1 of them) with the given new_val"""
        mode = ""
        if reset_mode == "password":
            mode = "password_hash"
            new_val = security_service.create_password_hash(password=new_val)
        else:
            mode = reset_mode
        
        db_response = supabase.table("users")\
            .update({mode : new_val}).eq("user_id", value=user_id).execute()
        
        return db_response
    
    def get_user_info(self, user_id : int):
        # Convert column names to comma-separated string
        user_public_cols = ", ".join(UserPublic.model_fields.keys())
        db_response = supabase.table("users").select(user_public_cols)\
            .eq("user_id", user_id).execute()
        return db_response.data[0] if db_response.data else None
    
    def upgrade_to_premium(self, user_id: int):
        """Upgrades user to premium with unlimited memories"""
        db_response = supabase.table("users")\
            .update({"is_premium": True, "memory_limit": 999999})\
            .eq("user_id", user_id).execute()
        return {"success": True, "message": "Upgraded to premium successfully"}
        
        


user_service = UserService()