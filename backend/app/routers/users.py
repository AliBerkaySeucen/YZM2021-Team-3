from fastapi import APIRouter, Depends
from models.user import UserCreate, UserLogin, UserPublic
from services.user_services import user_service
from fastapi.security import OAuth2PasswordRequestForm

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