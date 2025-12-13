from fastapi import APIRouter
from models.user import UserCreate, UserLogin, UserPublic
from services.user_services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/")
async def create_user(payload: UserCreate) -> UserPublic:
    return user_service.create_user(payload)

@router.get("/")
async def does_work():
    user_service.does_work()