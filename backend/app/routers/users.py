from fastapi import APIRouter, Depends
from models.user import UserCreate, UserLogin, UserPublic
from services.user_services import user_service, ResetOptions
from services.security import security_service
from fastapi.security import OAuth2PasswordRequestForm
from typing import Literal

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/create_user")
async def create_user(payload: UserCreate) -> UserPublic:
    """Creates new user in the database"""
    return user_service.create_user(payload)

@router.post("/get_access_token")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()) -> dict[str, str]:
    """Return's access token for the user in str format"""
    email = form_data.username
    password = form_data.password
    user_login = UserLogin(email=email, password=password)
    token = user_service.login_user(payload=user_login)
    return token

@router.put("/reset_user_info")
async def reset_user_info(new_val : str, reset_mode : ResetOptions,
                        verified_id : int = Depends(security_service.get_current_user)):
    """Resets prefered field with new_val, ResetOption: first_name, surname, email, password"""
    response = user_service.reset_user_info(user_id=verified_id, new_val=new_val, reset_mode=reset_mode)
    return response

@router.post("/get_user_info")
async def get_user_info(verified_id : int = Depends(security_service.get_current_user)):
    """Returns user info of: user_id, email, first_name, surname, created_at"""
    response = user_service.get_user_info(user_id=verified_id)
    return response

@router.put("/set_user_premium")
async def set_user_premium(verified_id : int = Depends(security_service.get_current_user)):
    """Call this endpoint if user subscribed to premium subscription"""
    response = user_service.set_user_premium(user_id=verified_id)
    return response