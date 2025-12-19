from pydantic import BaseModel
from enum import Enum

class LinkDataFields(Enum):
    user_id : str = "user_id"
    source_node_id : str = "source_node_id"
    target_node_id : str = "target_node_id"
    link_id : str = "link_id"

class NodeLinkCreate(BaseModel):
    user_id : int
    source_node_id : str
    target_node_id : str

class NodeLinkDelete(BaseModel):
    user_id : int
    link_id : int