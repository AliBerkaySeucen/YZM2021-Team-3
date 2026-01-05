"""
Password Reset Models
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime


class ForgotPasswordRequest(BaseModel):
    """Request model for forgot password"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request model for reset password with token"""
    token: str
    new_password: str


class PasswordResetToken(BaseModel):
    """Password reset token stored in database"""
    token_id: int
    user_id: int
    token: str
    created_at: datetime
    expires_at: datetime
    used: bool
