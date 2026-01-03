from fastapi import APIRouter, Depends
from typing import Annotated, Any, Optional
from services.node_services import node_service
from services.security import security_service
from models.node import NodeUpdate, NodeInfoDelete, NodeCreate, NodeDataFields

router = APIRouter(prefix="/nodes", tags=["Nodes"])

@router.post("/create_node")
async def create_node(description : str, image_id : Optional[str] = None, 
                    verified_id : int = Depends(security_service.get_current_user)):
    """Creates node given user_id, node_id and description"""
    payload = NodeCreate(user_id=verified_id, image_id=image_id, description=description)
    response = node_service.create_node(payload=payload)
    return response

@router.put("/update_node")
async def update_node(image_id : str, description : str, node_id : str,
                    verified_id : int = Depends(security_service.get_current_user)):
    """Updates image_id and description (both) for node given user_id, node_id."""
    payload = NodeUpdate(user_id=verified_id, image_id=image_id, description=description, node_id=node_id)
    response = node_service.update_node(payload=payload)
    return response

@router.delete("/delete_node")
async def delete_node(node_id : str, description : str,
                    verified_id : int = Depends(security_service.get_current_user)):
    """Deletes the node for given user_id and node_id"""
    payload = NodeInfoDelete(user_id=verified_id, node_id=node_id)
    response = node_service.delete_node(payload=payload)
    return response

@router.post("/get_node_info")
async def get_node_info(node_id : str, 
                        verified_id : int = Depends(security_service.get_current_user)):
    """Gets info of the asked node."""
    payload = NodeInfoDelete(user_id=verified_id, node_id=node_id)
    response = node_service.get_node_info(payload=payload)
    return response