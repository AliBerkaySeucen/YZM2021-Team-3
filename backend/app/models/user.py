from pydantic import BaseModel
import datetime
from enum import Enum

class UserDataFields(Enum):
    first_name: str = "first_name"
    surname: str = "surname"
    email: str = "email"
    password: str = "password_hash"
    user_id : str = "user_id"
    premium: str = "premium"
    nodes_added: str = "nodes_added"


class UserCreate(BaseModel):
    first_name: str
    surname: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserPublic(BaseModel):
    user_id: int
    first_name: str
    surname: str
    email: str
    created_at: datetime.datetime
    premium: bool = False
    nodes_added: int = 30
