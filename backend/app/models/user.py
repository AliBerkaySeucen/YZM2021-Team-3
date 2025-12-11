from pydantic import BaseModel
import datetime


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
