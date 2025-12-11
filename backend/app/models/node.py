from pydantic import BaseModel
import datetime

class NodeCreate(BaseModel):
    user_id : int
    image_id : int
    description : str

class NodeUpdate(BaseModel):
    user_id : int
    node_id : int
    image_id : int
    description : int

class NodeDelete(BaseModel):
    user_id : int
    node_id : int

class NodePublic(BaseModel):
    user_id : int
    node_id : int
    image_id : int
    description : str
    created_at : datetime.datetime
    updated_at : datetime.datetime