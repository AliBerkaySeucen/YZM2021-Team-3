from datetime import datetime, timedelta, timezone
from typing import Annotated, Any
import os
from dotenv import load_dotenv
load_dotenv()

import jwt
from fastapi import Depends, APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from pydantic import BaseModel

# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = os.environ.get("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES")

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