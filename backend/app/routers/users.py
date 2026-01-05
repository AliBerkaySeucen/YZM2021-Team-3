from fastapi import APIRouter, Depends, HTTPException
from models.user import UserCreate, UserLogin, UserPublic
from services.user_services import user_service, ResetOptions
from services.security import security_service
from services.email_service import send_password_reset_email
from fastapi.security import OAuth2PasswordRequestForm
from typing import Literal
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/users", tags=["Users"])


# Request models for password reset
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


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


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Send password reset email to user
    Returns success even if email doesn't exist (security best practice)
    """
    try:
        # Check if user exists
        user = user_service.get_user_by_email(request.email)

        if user:
            # Generate reset token
            reset_token = security_service.create_reset_token_jwt(user['user_id'])

            # Send email
            email_sent = send_password_reset_email(request.email, reset_token)

            if email_sent:
                return {"message": "If that email exists, a password reset link has been sent."}
            else:
                # Email failed but don't tell user
                return {"message": "If that email exists, a password reset link has been sent."}
        else:
            # User doesn't exist, but don't reveal that
            return {"message": "If that email exists, a password reset link has been sent."}

    except Exception as e:
        # Log error but return generic message
        print(f"Error in forgot_password: {e}")
        return {"message": "If that email exists, a password reset link has been sent."}


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Reset user password with valid token
    """
    try:
        # Verify token and get user_id
        user_id = security_service.verify_reset_token(request.token)

        # Update password
        user_service.reset_user_info(
            user_id=user_id,
            new_val=request.new_password,
            reset_mode="password"
        )

        return {"message": "Password successfully reset. You can now login with your new password."}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in reset_password: {e}")
        raise HTTPException(status_code=400, detail="Failed to reset password")