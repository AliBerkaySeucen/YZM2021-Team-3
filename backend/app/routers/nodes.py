from fastapi import APIRouter, Depends, Body, HTTPException
from typing import Annotated, Any
from services.node_services import node_service
from services.security import security_service
from models.node import NodeUpdate, NodeInfoDelete, NodeCreate, NodeDataFields

router = APIRouter(prefix="/nodes", tags=["Nodes"])

@router.post("/create_node")
async def create_node(
    payload: dict = Body(...),
    verified_id: int = Depends(security_service.get_current_user)
):
    """Creates node given user_id, image_id, description, title, tags, position, and custom_date"""
    try:
        node_payload = NodeCreate(
            user_id=verified_id, 
            image_id=payload.get("image_id", ""), 
            description=payload.get("description", ""),
            title=payload.get("title", "Untitled"),
            tags=payload.get("tags", []),
            position_x=payload.get("position", {}).get("x") if payload.get("position") else None,
            position_y=payload.get("position", {}).get("y") if payload.get("position") else None,
            custom_date=payload.get("date")
        )
        response = node_service.create_node(payload=node_payload)
        if not response:
            raise HTTPException(status_code=500, detail="Failed to create node")
        return response
    except HTTPException:
        raise  # Re-raise HTTPException (403 for limit, etc.) without converting to 500
    except Exception as e:
        print(f"Error in create_node: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list_nodes")
async def list_nodes(
    verified_id: int = Depends(security_service.get_current_user),
    limit: int = 40,
    offset: int = 0
):
    """Lists nodes for the authenticated user with pagination"""
    response = node_service.list_nodes(user_id=verified_id, limit=limit, offset=offset)
    return response

@router.put("/update_node")
async def update_node(
    payload: dict = Body(...),
    verified_id : int = Depends(security_service.get_current_user)
):
    """Updates node fields for given user_id and node_id."""
    try:
        if not payload.get("node_id"):
            raise HTTPException(status_code=400, detail="node_id is required")
        
        node_payload = NodeUpdate(
            user_id=verified_id, 
            node_id=payload.get("node_id"),
            image_id=payload.get("image_id", ""),
            description=payload.get("description", ""),
            title=payload.get("title"),
            tags=payload.get("tags"),
            position_x=payload.get("position", {}).get("x") if payload.get("position") else None,
            position_y=payload.get("position", {}).get("y") if payload.get("position") else None,
            custom_date=payload.get("date")
        )
        response = node_service.update_node(payload=node_payload)
        if not response:
            raise HTTPException(status_code=404, detail="Node not found")
        return response
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_node: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete_node")
async def delete_node(node_id : str,
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