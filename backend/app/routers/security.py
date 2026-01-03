"""
Security Router - Şifre sıfırlama endpoint'leri
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from supabase import Client
import logging

from db.db import get_supabase_client
from services.security import create_reset_token, verify_reset_token, mark_token_used
from services.email_service import send_password_reset_email
from pwdlib import PasswordHash

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["security"])

password_hash = PasswordHash.recommended()


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest, 
    supabase: Client = Depends(get_supabase_client)
):
    """
    Şifre sıfırlama emaili gönder
    
    Güvenlik: Email bulunamasa bile aynı mesaj döndürülür (brute force koruması)
    """
    try:
        # Kullanıcıyı email ile bul
        result = supabase.table("users")\
            .select("user_id, email")\
            .eq("email", request.email)\
            .execute()
        
        if result.data and len(result.data) > 0:
            user = result.data[0]
            
            # Reset token oluştur
            reset_token = create_reset_token(supabase, user["user_id"])
            
            # Email gönder
            email_sent = send_password_reset_email(request.email, reset_token)
            
            if email_sent:
                logger.info(f"Şifre sıfırlama emaili gönderildi: {request.email}")
            else:
                logger.error(f"Email gönderilemedi: {request.email}")
        else:
            logger.warning(f"Şifre sıfırlama talebi - Kullanıcı bulunamadı: {request.email}")
        
        # Güvenlik: Her durumda aynı mesaj döndür
        return {
            "message": "Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi."
        }
        
    except Exception as e:
        logger.error(f"Forgot password hatası: {e}")
        # Hata durumunda bile aynı mesaj (güvenlik)
        return {
            "message": "Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi."
        }


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Token ile şifreyi sıfırla
    """
    try:
        logger.info(f"Reset password denemesi - Token: {request.token[:20]}...")
        
        # Token'ı doğrula
        token_data = verify_reset_token(supabase, request.token)
        
        logger.info(f"Token doğrulama sonucu: {token_data}")
        
        if not token_data:
            logger.warning(f"Token doğrulanamadı: {request.token[:20]}...")
            raise HTTPException(
                status_code=400, 
                detail="Geçersiz veya süresi dolmuş token"
            )
        
        # Şifreyi hashle
        hashed_password = password_hash.hash(request.password)
        
        # Şifreyi güncelle
        supabase.table("users")\
            .update({"password_hash": hashed_password})\
            .eq("user_id", token_data["user_id"])\
            .execute()
        
        # Token'ı kullanılmış işaretle
        mark_token_used(supabase, request.token)
        
        logger.info(f"Şifre başarıyla sıfırlandı - User ID: {token_data['user_id']}")
        
        return {
            "message": "Şifreniz başarıyla sıfırlandı. Artık yeni şifrenizle giriş yapabilirsiniz."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password hatası: {e}")
        raise HTTPException(
            status_code=500,
            detail="Şifre sıfırlama işlemi başarısız oldu"
        )
