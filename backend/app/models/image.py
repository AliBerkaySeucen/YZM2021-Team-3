from pydantic import BaseModel
import datetime

class ImageUpload(BaseModel):
    user_id : int
    file_name : str

class ImageDelete(BaseModel):
    user_id : int
    image_id : int

class ImagePublic(BaseModel):
    user_id : int
    image_id : int
    image_url : str
    created_at : datetime.datetime
