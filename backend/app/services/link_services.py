from models.link import NodeLinkCreate, NodeLinkDelete, LinkDataFields as df
from db.db import supabase
from typing import Any, Annotated, Literal
from enum import Enum

class LinkService:
    def __init__(self):
        pass

    def create_link(self, payload: NodeLinkCreate):
        link_dump = payload.model_dump()
        db_response = supabase.table("nodelinks").insert(link_dump).execute()
        return db_response.data[0] if db_response.data else None
    
    def list_links(self, user_id: int):
        """Get all links for a user"""
        db_response = supabase.table("nodelinks").select("*")\
            .eq(df.user_id.value, user_id)\
            .order("created_at", desc=True)\
            .execute()
        return db_response.data if db_response.data else []
    
    def delete_link(self, payload: NodeLinkDelete):
        link_dump = payload.model_dump()
        db_response = supabase.table("nodelinks").delete()\
            .eq(df.user_id.value, link_dump[df.user_id.value])\
            .eq(df.link_id.value, link_dump[df.link_id.value])\
            .execute()
        return {"message": "Link deleted successfully"}
    

link_service = LinkService()