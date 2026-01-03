from fastapi import APIRouter, Depends
from typing import Annotated, Any
from services.link_services import link_service
from services.security import security_service
from models.link import LinkDataFields, NodeLinkCreate, NodeLinkDelete

router = APIRouter(prefix="/nodelinks", tags=["NodeLinks"])

@router.post("/create_link")
async def create_link(source_node_id : str, target_node_id : str, 
                    verified_id : int = Depends(security_service.get_current_user)):
    """Creates link between described source and target nodes, for verified user_id"""
    payload = NodeLinkCreate(user_id=verified_id, source_node_id=source_node_id,
                            target_node_id=target_node_id)
    response = link_service.create_link(payload=payload)
    return response

@router.get("/list_links")
async def list_links(verified_id: int = Depends(security_service.get_current_user)):
    """Lists all links for the authenticated user"""
    response = link_service.list_links(user_id=verified_id)
    return response

@router.delete("/delete_link")
async def delete_link(link_id : int,
                    verified_id : int = Depends(security_service.get_current_user)):
    """Deletes link for given link_id, it is necessary to call this function for cleaner database"""
    payload = NodeLinkDelete(user_id=verified_id, link_id=link_id)
    response = link_service.delete_link(payload=payload)

    return response