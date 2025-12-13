from models.image import ImageDelete, ImagePublic, ImageUpload
from db.db import supabase
from services.security import security_service
from fastapi import Depends, HTTPException

class ImageService:

    def __init__(self):
        pass

    def get_upload_url(self, payload: ImageUpload):
        file_path = f"{payload.user_id}/{payload.file_name}"
        try:
            response = supabase.storage.from_("images_0").create_signed_upload_url(path=file_path)
        except:
            raise HTTPException(status_code=404, detail="Image signedUrl creation failed!")
        try:
            image_dump = payload.model_dump()
            image_dump["image_path"] = response["path"]
            db_response = supabase.table("images").insert(image_dump).execute()
        except:
            raise HTTPException(status_code=404, detail="path couldnt passed to database tables.")
        return response["signedUrl"]
    
    def get_image():
        return None
    
    def delete_image():
        return None


image_service = ImageService()