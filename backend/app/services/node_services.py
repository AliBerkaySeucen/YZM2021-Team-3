from models.node import NodeCreate, NodeInfoDelete, NodePublic, NodeUpdate, NodeOp, NodeDataFields as df
from db.db import supabase
from typing import Any, Annotated, Literal
from enum import Enum

class NodeService:
    def __init__(self):
        pass

    def _wrap_node_op(payload : NodeOp):
        """Wraps user_id and image_id fields of NodeOp for other special purpose models."""
        return payload.model_dump()

    def create_node(self, payload : NodeCreate):
        node_dump = self._wrap_node_op(payload)
        db_response = supabase.table("nodes").insert(node_dump).execute()

        return db_response
    
    def update_node(self, payload : NodeUpdate):
        node_dump = self._wrap_node_op(payload)
        db_response = supabase.table("nodes")\
            .update({df.image_id : node_dump[df.image_id], 
                    df.description : node_dump[df.description]})\
            .eq(df.user_id, node_dump[df.user_id]) \
            .eq(df.node_id, node_dump[df.node_id]) \
            .execute()
        
        return db_response
    
    def delete_node(self, payload : NodeInfoDelete):
        node_dump = self._wrap_node_op(payload)
        db_response = supabase.table("nodes") \
            .delete() \
            .eq(df.user_id, node_dump[df.user_id]) \
            .eq(df.node_id, node_dump[df.node_id]) \
            .execute()
        
        return db_response
    
    def get_node_info(self, payload : NodeInfoDelete):
        node_dump = self._wrap_node_op(payload)
        db_response = supabase.table("nodes").select("*")\
            .eq(df.user_id, node_dump[df.user_id]).eq(df.node_id, node_dump[df.node_id]).execute()
        
        return db_response


node_service = NodeService()