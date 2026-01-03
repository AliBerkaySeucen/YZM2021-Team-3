"""
Email Servisi - SendGrid kullanarak email gönderimi
"""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import logging

logger = logging.getLogger(__name__)

# Environment variables
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@memolink.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """
    Şifre sıfırlama emaili gönder
    
    Args:
        to_email: Alıcı email adresi
        reset_token: Şifre sıfırlama token'ı
        
    Returns:
        bool: Email başarıyla gönderildiyse True
    """
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    # Development mode: Console'a yazdır
    if not SENDGRID_API_KEY or SENDGRID_API_KEY == "your_sendgrid_api_key_here":
        logger.warning("⚠️  SendGrid API key bulunamadı - Development mode aktif")
        logger.info("=" * 80)
        logger.info("📧 ŞİFRE SIFIRLAMA EMAİLİ (DEVELOPMENT MODE)")
        logger.info("=" * 80)
        logger.info(f"Alıcı: {to_email}")
        logger.info(f"Token: {reset_token}")
        logger.info(f"Reset Link: {reset_link}")
        logger.info("=" * 80)
        print("\n" + "=" * 80)
        print("📧 ŞİFRE SIFIRLAMA LİNKİ")
        print("=" * 80)
        print(f"Email: {to_email}")
        print(f"Link:  {reset_link}")
        print("=" * 80 + "\n")
        return True
    
    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=to_email,
        subject='Şifre Sıfırlama - MemoLink',
        html_content=f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #4CAF50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 5px 5px;
                }}
                .button {{
                    display: inline-block;
                    background-color: #4CAF50;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>MemoLink</h1>
                </div>
                <div class="content">
                    <h2>Şifre Sıfırlama Talebi</h2>
                    <p>Merhaba,</p>
                    <p>Hesabınız için şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
                    <center>
                        <a href="{reset_link}" class="button">Şifremi Sıfırla</a>
                    </center>
                    <p><strong>Bu link 1 saat içinde geçerliliğini yitirecektir.</strong></p>
                    <p>Eğer bu talebi siz yapmadıysanız, bu emaili güvenle görmezden gelebilirsiniz. Şifreniz değiştirilmeyecektir.</p>
                    <div class="footer">
                        <p>Buton çalışmazsa, aşağıdaki linki tarayıcınıza kopyalayın:</p>
                        <p style="word-break: break-all;">{reset_link}</p>
                        <br>
                        <p>Bu otomatik bir emaildir, lütfen yanıtlamayın.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        '''
    )
    
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        if response.status_code == 202:
            logger.info(f"Şifre sıfırlama emaili gönderildi: {to_email}")
            return True
        else:
            logger.warning(f"Email gönderilemedi. Status: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"Email gönderme hatası: {e}")
        return False
