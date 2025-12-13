from fastapi import APIRouter, Depends
from typing import Annotated, Any
from services.image_services import image_service
from services.security import security_service
from models.image import ImageDelete, ImagePublic, ImageUpload

router = APIRouter(prefix="/images", tags=["Images"])

@router.post("/get_upload_url")
async def get_upload_url(file_name: str, 
                        verified_id: int = Depends(security_service.get_current_user)):
    """Returns signed url for temporary access to the storage bucket."""
    payload = ImageUpload(user_id=verified_id, file_name=file_name)
    signed_url = image_service.get_upload_url(payload)
    return signed_url