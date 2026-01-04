from datetime import datetime, timedelta, timezone
from typing import Annotated, Any
import os
import secrets
from dotenv import load_dotenv
load_dotenv()

import jwt
from fastapi import Depends, APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from pydantic import BaseModel
from supabase import Client

# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = os.environ.get("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))  # Default: 7 days

password_hash = PasswordHash.recommended()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/get_access_token")


class Token(BaseModel):
    access_token : str
    token_type : str

class SecurityService:
    def __init__(self):
        pass

    def create_password_hash(self, password: str) -> str:
        return password_hash.hash(password)
    
    def verify_password(self, plain_password, hashed_password):
        return password_hash.verify(plain_password, hashed_password)

    # services/security.py

    def create_access_token(self, data: dict, expires_delta: timedelta | None = None):
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": encoded_jwt, "token_type": "bearer"}
    
    def get_current_user(self, token: Annotated[str, Depends(oauth2_scheme)]) -> str:
        creditenitals_exception = HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id is None:
                raise creditenitals_exception
            return user_id
        except InvalidTokenError:
            raise creditenitals_exception
        
security_service = SecurityService()

# Şifre sıfırlama fonksiyonları

def create_reset_token(supabase: Client, user_id: str) -> str:
    """
    Şifre sıfırlama token'ı oluştur ve database'e kaydet
    
    Args:
        supabase: Supabase client
        user_id: Kullanıcı ID'si
        
    Returns:
        str: Oluşturulan reset token
    """
    # Güvenli random token oluştur
    token = secrets.token_urlsafe(32)
    
    # Token 1 saat sonra expire olacak
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Database'e kaydet
    supabase.table("password_reset_tokens").insert({
        "user_id": user_id,
        "token": token,
        "expires_at": expires_at.isoformat()
    }).execute()
    
    return token


def verify_reset_token(supabase: Client, token: str) -> dict | None:
    """
    Reset token'ı doğrula
    
    Args:
        supabase: Supabase client
        token: Doğrulanacak token
        
    Returns:
        dict | None: Token geçerliyse token datası, değilse None
    """
    import logging
    logger = logging.getLogger(__name__)
    
    current_time = datetime.now(timezone.utc).isoformat()
    logger.info(f"Token doğrulama - Current time: {current_time}")
    logger.info(f"Token: {token[:20]}...")
    
    # Token'ı database'den bul
    result = supabase.table("password_reset_tokens")\
        .select("*")\
        .eq("token", token)\
        .execute()
    
    logger.info(f"Database sorgu sonucu (all tokens): {result.data}")
    
    # Filtreleme yap
    result_filtered = supabase.table("password_reset_tokens")\
        .select("*")\
        .eq("token", token)\
        .eq("used", False)\
        .gt("expires_at", current_time)\
        .execute()
    
    logger.info(f"Database sorgu sonucu (filtered): {result_filtered.data}")
    
    if result_filtered.data and len(result_filtered.data) > 0:
        return result_filtered.data[0]
    return None


def mark_token_used(supabase: Client, token: str):
    """
    Token'ı kullanılmış olarak işaretle (tek kullanımlık)
    
    Args:
        supabase: Supabase client
        token: İşaretlenecek token
    """
    supabase.table("password_reset_tokens")\
        .update({"used": True})\
        .eq("token", token)\
        .execute()
