from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated, Any
from pydantic import BaseModel
from services.image_services import image_service
from services.security import security_service
from models.image import ImagePublic, ImageFilename
import httpx
import base64
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/images", tags=["Images"])

class ImageUrlRequest(BaseModel):
    url: str

def _filename_to_payload(file_name: str, verified_id: int) -> ImageFilename:
    return ImageFilename(user_id=verified_id, file_name=file_name)

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
    """Gets signed url from the storage for the file name"""
    payload = _filename_to_payload(file_name=file_name, verified_id=verified_id)
    response = image_service.get_signed_url(payload=payload)
    return response

@router.delete("/delete_image_file")
async def delete_image(file_name : str, 
                        verified_id : int = Depends(security_service.get_current_user)):
    """Deletes file from the storage and database according to filename"""
    payload = _filename_to_payload(file_name=file_name, verified_id=verified_id)
    response = image_service.delete_image(payload=payload)
    return response

@router.post("/get_image_info")
async def get_image_info(file_name : str, 
                        verified_id : int = Depends(security_service.get_current_user)):
    """Gets image info of user_id, image_id, file_path, created_at"""
    payload = _filename_to_payload(file_name=file_name, verified_id=verified_id)
    image_public = image_service.get_image_info(payload=payload).model_dump()
    return image_public

@router.post("/fetch_from_url")
async def fetch_image_from_url(
    request: ImageUrlRequest,
    verified_id: int = Depends(security_service.get_current_user)
):
    """
    Fetches an image from a URL and returns it as base64.
    This bypasses CORS issues by fetching the image server-side.
    """
    try:
        logger.info(f"Fetching image from URL: {request.url}")
        
        # Validate URL
        if not request.url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="Invalid URL format")
        
        # Fetch the image with timeout and size limit
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(
                request.url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch image: HTTP {response.status_code}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Could not fetch image: HTTP {response.status_code}"
                )
            
            # Check content type
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                logger.error(f"Invalid content type: {content_type}")
                raise HTTPException(
                    status_code=400,
                    detail=f"URL does not point to an image (content-type: {content_type})"
                )
            
            # Check file size (max 10MB)
            content_length = len(response.content)
            if content_length > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail="Image is too large (max 10MB)"
                )
            
            # Convert to base64
            image_data = response.content
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
            # Determine MIME type for data URL
            mime_type = content_type.split(';')[0]
            data_url = f"data:{mime_type};base64,{base64_image}"
            
            logger.info(f"Successfully fetched image ({content_length} bytes)")
            
            return {
                "success": True,
                "image": data_url,
                "size": content_length,
                "mime_type": mime_type
            }
            
    except httpx.TimeoutException:
        logger.error("Request timeout")
        raise HTTPException(status_code=408, detail="Request timeout - image took too long to download")
    except httpx.RequestError as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Could not fetch image: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
