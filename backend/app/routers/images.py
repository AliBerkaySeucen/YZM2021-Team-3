from fastapi import APIRouter, Depends
from typing import Annotated, Any
from services.image_services import image_service
from services.security import security_service
from models.image import ImageDelete, ImagePublic, ImageUpload

router = APIRouter(prefix="/images", tags=["Images"])

def _filename_to_payload(file_name: str, verified_id: int) -> ImageUpload:
    return ImageUpload(user_id=verified_id, file_name=file_name)

@router.post("/get_upload_url")
async def get_upload_url(file_name: str, 
                        verified_id: int = Depends(security_service.get_current_user)):
    """Returns signed url for temporary access to the storage bucket."""
    payload = _filename_to_payload(file_name=file_name, verified_id=verified_id)
    signed_url = image_service.get_upload_url(payload)
    return signed_url

@router.post("/confirm_upload")
async def confirm_upload(file_name : str, 
                        verified_id : int = Depends(security_service.get_current_user)):
    """Method when needs to be called if image uploaded to the url"""
    payload = _filename_to_payload(file_name=file_name, verified_id=verified_id)
    db_response = image_service.confirm_uploaded(payload)
    return db_response

@router.post("/get_url_by_name")
async def get_url_by_name(file_name : str, 
                        verified_id : int = Depends(security_service.get_current_user)):
    payload = _filename_to_payload(file_name=file_name, verified_id=verified_id)
    response = image_service.get_signed_url(payload=payload)
    return response