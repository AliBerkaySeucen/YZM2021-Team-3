from pydantic import BaseModel
import datetime

class ImageFilename(BaseModel):
    user_id : int
    file_name : str

class ImagePublic(BaseModel):
    user_id : int
    image_id : int
    file_path : str
    created_at : datetime.datetime
