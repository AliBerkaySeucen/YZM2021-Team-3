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

    def create_reset_token_jwt(self, user_id: int, expires_delta: timedelta = None) -> str:
        """Create a JWT token specifically for password reset"""
        if expires_delta is None:
            expires_delta = timedelta(hours=1)  # Reset tokens expire in 1 hour

        expire = datetime.now(timezone.utc) + expires_delta
        to_encode = {
            "sub": str(user_id),
            "exp": expire,
            "type": "password_reset"
        }
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def verify_reset_token(self, token: str) -> int:
        """Verify password reset token and return user_id"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            token_type: str = payload.get("type")

            if user_id is None or token_type != "password_reset":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid reset token"
                )

            return int(user_id)
        except InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )

security_service = SecurityService()
