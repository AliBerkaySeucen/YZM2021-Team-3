from fastapi import APIRouter
from models.user import UserCreate, UserLogin, UserPublic
from services.user_services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/create_user")
async def create_user(payload: UserCreate) -> UserPublic:
    """Creates new user in the database"""
    return user_service.create_user(payload)

@router.post("/get_access_token")
async def login_user(payload: UserLogin) -> str:
    """Return's access token for the user in str format"""
    token = user_service.login_user(payload=payload)
    return token