from pydantic import BaseModel
import datetime
from enum import Enum

class NodeDataFields(Enum):
    user_id : str = "user_id"
    image_id : str = "image_id"
    description : str = "description"
    node_id : str = "node_id"

class NodeOp(BaseModel):
    user_id : int
    image_id : str

class NodeCreate(NodeOp):
    user_id : int
    image_id : str
    description : str

class NodeUpdate(NodeOp):
    user_id : int
    node_id : str
    image_id : str
    description : str

class NodeInfoDelete(NodeOp): # THIS MIGHT CREATE PROBLEM, IGNORING FOR NOW
    user_id : int
    node_id : str

class NodePublic(BaseModel):
    user_id : int
    node_id : str
    image_id : str
    description : str
    created_at : datetime.datetime
    updated_at : datetime.datetime