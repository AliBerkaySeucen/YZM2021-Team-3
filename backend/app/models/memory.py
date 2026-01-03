from pydantic import BaseModel
import datetime
from typing import Optional
from enum import Enum

class MemoDataFields(Enum):
    user_id : str = "user_id"
    memo_id : str = "memo_id"
    memo_name : str = "memo_name"
    description : str = "description"


class MemoOp(BaseModel):
    user_id : int
    memo_id : Optional[int]
    memo_name : Optional[str]
    description : Optional[str]

class MemoPublic(BaseModel):
    user_id : int
    memo_id : int
    memo_name : str
    description : str
    created_at : datetime.datetime
    updated_at : datetime.datetime