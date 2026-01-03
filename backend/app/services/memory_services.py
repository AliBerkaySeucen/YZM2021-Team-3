from models.memory import MemoOp, MemoDataFields as df, MemoPublic
from db.db import supabase
from typing import Any, Annotated, Literal
from enum import Enum

class MemoryService:
    def __init__(self):
        pass

    def _wrap_memo_op(self, payload : MemoOp):
        """Wraps MemoOp BaseModel as python dict"""
        return payload.model_dump()

    def create_memory(self, payload : MemoOp):
        memo_dump = self._wrap_memo_op(payload)
        db_response = supabase.table("memories").insert(memo_dump).execute()

        return db_response
    
    def update_memo(self, payload : MemoOp):
        memo_dump = self._wrap_memo_op(payload)
        db_response = supabase.table("memories")\
            .update({df.memo_id.value : memo_dump[df.memo_id.value], 
                    df.description.value : memo_dump[df.description.value]})\
            .eq(df.user_id.value, memo_dump[df.user_id.value]) \
            .eq(df.memo_id.value, memo_dump[df.memo_id.value]) \
            .execute()
        
        return db_response
    
    def delete_memo(self, payload : MemoOp):
        memo_dump = self._wrap_memo_op(payload)
        db_response = supabase.table("memories") \
            .delete() \
            .eq(df.user_id.value, memo_dump[df.user_id.value]) \
            .eq(df.memo_id.value, memo_dump[df.memo_id.value]) \
            .execute()

        return db_response

    def get_memo_info(self, payload : MemoOp):
        memo_dump = payload.model_dump()
        db_response = supabase.table("memories").select("*")\
            .eq(df.user_id.value, memo_dump[df.user_id.value]).eq(df.memo_id.value, memo_dump[df.memo_id.value]).execute()

        return db_response

    
    

memory_service = MemoryService()