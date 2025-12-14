from models.image import ImageDelete, ImagePublic, ImageUpload
from db.db import supabase
from services.security import security_service
from fastapi import Depends, HTTPException
from typing import Any

def _payload_to_image_dump(payload : ImageUpload) -> dict[str, Any]:
    """keys: (user_id, file_name, file_path)"""
    file_path = f"{payload.user_id}/{payload.file_name}"
    image_dump = payload.model_dump()
    image_dump["file_path"] = file_path
    return image_dump

class ImageService:

    def __init__(self):
        pass

    def get_upload_url(self, payload: ImageUpload):
        """Returns a signed URL for the given file name."""
        image_dump = _payload_to_image_dump(payload=payload)
        response = supabase.storage.from_("images_0").create_signed_upload_url(path=image_dump["file_path"])
        
        if not response:
             raise HTTPException(status_code=500, detail="Failed to generate URL from Supabase")       

        # Return the signed URL so the frontend can use it
        return response["signedUrl"]
    
    def confirm_uploaded(self, payload : ImageUpload):
        """If upload to signed URL successful, then call this method so that DB can be updated."""
        image_dump = _payload_to_image_dump(payload=payload)
        try:
            db_response = supabase.table("images").insert(image_dump).execute()
        except Exception as e:
            print(f" DATABASE ERROR: {e}")
            raise HTTPException(status_code=500, detail=f"Database Insert Failed: {str(e)}")
        
        return db_response.data[0]
    
    def get_signed_url(self, payload : ImageUpload):
        """Returns a signed URL of given file name for the user."""
        image_dump = _payload_to_image_dump(payload=payload)
        response = supabase.storage.from_("images_0").create_signed_url(
            path=image_dump["file_path"], expires_in=60*30 # can be loaded from dotenv
        )
        return response
    
    def delete_image():
        return None


image_service = ImageService()