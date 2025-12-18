from models.image import ImageFilename, ImagePublic
from db.db import supabase
from services.security import security_service
from fastapi import Depends, HTTPException
from typing import Any, Annotated

def _payload_to_image_dump(payload : ImageFilename) -> dict[str, Any]:
    """keys: (user_id, file_name, file_path)"""
    file_path = f"{payload.user_id}/{payload.file_name}"
    image_dump = payload.model_dump()
    image_dump["file_path"] = file_path
    return image_dump

class ImageService:

    def __init__(self):
        pass

    def get_upload_url(self, payload: ImageFilename):
        """Returns a signed URL for the given file name."""
        image_dump = _payload_to_image_dump(payload=payload)
        response = supabase.storage.from_("images_0").create_signed_upload_url(path=image_dump["file_path"])
        
        if not response:
             raise HTTPException(status_code=500, detail="Failed to generate URL from Supabase")       

        # Return the signed URL so the frontend can use it
        return response["signedUrl"]
    
    def confirm_uploaded(self, payload : ImageFilename):
        """If upload to signed URL successful, then call this method so that DB can be updated."""
        image_dump = _payload_to_image_dump(payload=payload)
        try:
            db_response = supabase.table("images").insert(image_dump).execute()
        except Exception as e:
            print(f" DATABASE ERROR: {e}")
            raise HTTPException(status_code=500, detail=f"Database Insert Failed: {str(e)}")
        
        return db_response.data[0]
    
    def get_signed_url(self, payload : ImageFilename):
        """Returns a signed URL of given file name for the user."""
        image_dump = _payload_to_image_dump(payload=payload)
        response = supabase.storage.from_("images_0").create_signed_url(
            path=image_dump["file_path"], expires_in=60*30 # can be loaded from dotenv
        )
        return response
    
    def delete_image(self, payload: ImageFilename):
        """Deletes an image from storage and the database."""
        image_dump = _payload_to_image_dump(payload=payload)
        
        # 1. Delete from Storage
        storage_response = supabase.storage.from_("images_0").remove(paths=image_dump["file_path"])
        
        # Check if storage deletion was successful (Supabase storage remove returns a list of deleted objects)
        if not storage_response:
            # It's possible the file didn't exist in storage, but we might still want to clean up the DB
            print(f"Warning: File {image_dump['file_path']} not found in storage or deletion failed.")

        # 2. Delete from Database
        try:
            # We delete based on the composite key or unique constraint (user_id, file_name)
            db_response = supabase.table("images").delete().eq("user_id", payload.user_id)\
                .eq("file_name", payload.file_name).execute()
        except Exception as e:
            print(f" DATABASE ERROR: {e}")
            raise HTTPException(status_code=500, detail=f"Database Deletion Failed: {str(e)}")

        return {"storage_data": storage_response, "db_data": db_response.data}
    
    def get_image_info(self, payload) -> ImagePublic:
        image_dump = _payload_to_image_dump(payload=payload)
        file_path = image_dump["file_path"]
        user_id = image_dump["user_id"]

        try:
            db_response = supabase.table("images").select("image_id", "created_at")\
                .eq("user_id", "file_path", value=(user_id, file_path)).execute()
        except Exception as e:
            print(f"DATABASE ERROR: {e}")
            raise HTTPException(status_code=500, detail=f"Could not retrieve Image Info: {str(e)}")
        
        image_id = db_response["data"]["image_id"]
        created_at = db_response["data"]["created_at"]

        image_public = ImagePublic(user_id=user_id, image_id=image_id, 
                                file_path=file_path, created_at=created_at)

        return image_public


image_service = ImageService()