from models.link import NodeLinkCreate, NodeLinkDelete, LinkDataFields as df
from db.db import supabase
from typing import Any, Annotated, Literal
from enum import Enum

class LinkService:
    def __init__(self):
        pass

    def create_link(self, payload : NodeLinkCreate):
        link_dump = payload.model_dump()
        db_response = supabase.table("nodelinks").insert(link_dump).execute()
        return db_response
    
    def delete_link(self, payload : NodeLinkDelete):
        link_dump = payload.model_dump()
        db_response = supabase.table("nodelinks").delete().eq(df.user_id, link_dump[df.user_id]).\
            eq(df.link_id, link_dump[df.link_id]).execute()
        return db_response
    

link_service = LinkService()