from pydantic import BaseModel
import datetime

class NodeLinkCreate(BaseModel):
    user_id : int
    link_id : int
    source_node_id : int
    target_node_id : int
    created_at : datetime.time

class NodeLinkDelete(BaseModel):
    user_id : int
    link_id : int