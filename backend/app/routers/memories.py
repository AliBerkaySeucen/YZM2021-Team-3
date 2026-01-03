from fastapi import APIRouter, Depends
from typing import Annotated, Any, Optional
from services.memory_services import memory_service
from services.security import security_service
from models.memory import MemoOp

router = APIRouter(prefix="/memories", tags=["Memories"])

@router.post("/create_memory")
async def create_memory(memo_id : int, memo_name : Optional[str] = None, description : Optional[str] = None,
                    verified_id : int = Depends(security_service.get_current_user)):
    """Creates memory given user_id, memo_id, memo_name and description"""
    payload = MemoOp(user_id=verified_id, memo_id=memo_id, memo_name=memo_name, description=description)
    response = memory_service.create_memory(payload=payload)
    return response

@router.put("/update_memo")
async def update_memo(memo_id : int, description : str,
                    verified_id : int = Depends(security_service.get_current_user)):
    """Updates description for memo given user_id and memo_id."""
    payload = MemoOp(user_id=verified_id, memo_id=memo_id, description=description)
    response = memory_service.update_memo(payload=payload)
    return response

@router.delete("/delete_memo")
async def delete_memo(memo_id : int,
                    verified_id : int = Depends(security_service.get_current_user)):
    """Deletes the memo for given user_id and memo_id"""
    payload = MemoOp(user_id=verified_id, memo_id=memo_id)
    response = memory_service.delete_memo(payload=payload)
    return response

@router.post("/get_memo_info")
async def get_memo_info(memo_id : int,
                        verified_id : int = Depends(security_service.get_current_user)):
    """Gets info of the asked memo."""
    payload = MemoOp(user_id=verified_id, memo_id=memo_id)
    response = memory_service.get_memo_info(payload=payload)
    return response