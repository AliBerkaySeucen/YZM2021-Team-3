from pydantic import BaseModel
import datetime
from enum import Enum

class NodeDataFields(Enum):
    user_id : str = "user_id"
    image_id : str = "image_id"
    description : str = "description"
    node_id : str = "node_id"
    title : str = "title"
    tags : str = "tags"
    position_x : str = "position_x"
    position_y : str = "position_y"
    custom_date : str = "custom_date"

class NodeOp(BaseModel):
    user_id : int
    image_id : str

class NodeCreate(NodeOp):
    user_id : int
    image_id : str
    description : str
    title : str = "Untitled"
    tags : list[str] = []
    position_x : float | None = None
    position_y : float | None = None
    custom_date : datetime.datetime | None = None

class NodeUpdate(NodeOp):
    user_id : int
    node_id : str
    image_id : str
    description : str
    title : str | None = None
    tags : list[str] | None = None
    position_x : float | None = None
    position_y : float | None = None
    custom_date : datetime.datetime | None = None

class NodeInfoDelete(BaseModel):  # Simplified model for node info/delete operations
    user_id : int
    node_id : str

class NodePublic(BaseModel):
    user_id : int
    node_id : str
    image_id : str
    description : str
    created_at : datetime.datetime
    updated_at : datetime.datetime
    title : str = "Untitled"
    tags : list[str] = []
    position_x : float | None = None
    position_y : float | None = None
    custom_date : str | None = None