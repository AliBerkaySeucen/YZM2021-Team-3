from pydantic import BaseModel
import datetime

class ImageCreate(BaseModel):
    user_id : int
    image_file : str

class ImageDelete(BaseModel):
    user_id : int
    image_id : int

class ImagePublic(BaseModel):
    user_id : int
    image_id : int
    image_url : str
    created_at : datetime.datetime
