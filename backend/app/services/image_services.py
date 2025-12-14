from models.image import ImageDelete, ImagePublic, ImageUpload
from db.db import supabase
from services.security import security_service
from fastapi import Depends, HTTPException

class ImageService:

    def __init__(self):
        pass

    def get_upload_url(self, payload: ImageUpload):
        file_path = f"{payload.user_id}/{payload.file_name}"
        
        response = supabase.storage.from_("images_0").create_signed_upload_url(path=file_path)
        
        # DEBUG: Print what Supabase gave us. 
        # Sometimes keys are 'signedUrl' (camelCase) and sometimes 'signed_url' (snake_case)
        print(f"Storage Response: {response}") 

        if not response:
             raise HTTPException(status_code=500, detail="Failed to generate URL from Supabase")

        # 2. Prepare Database Data
        image_dump = payload.model_dump()
        image_dump["file_path"] = file_path 
        
        try:
            # Print what we are trying to send to the DB
            print(f"Inserting into DB: {image_dump}")
            
            db_response = supabase.table("images").insert(image_dump).execute()
        except Exception as e:
            print(f" DATABASE ERROR: {e}")
            raise HTTPException(status_code=500, detail=f"Database Insert Failed: {str(e)}")

        # Return the signed URL so the frontend can use it
        # Check your print logs to see if this key is 'signedUrl' or 'signed_url'
        return response["signedUrl"]
    
    def get_image():
        return None
    
    def delete_image():
        return None


image_service = ImageService()