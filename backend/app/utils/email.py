import logging
import random
import string
from datetime import datetime, timedelta
from typing import Optional

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr

from app.core.config import settings
from app.utils.redis_cache import get_redis_cache, set_redis_cache

# 配置日志
logger = logging.getLogger(__name__)

# 邮件连接配置
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_TLS=settings.MAIL_USE_TLS,
    MAIL_SSL=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)


def generate_verification_code(length: int = None) -> str:
    """
    生成指定长度的数字验证码
    """
    if length is None:
        length = settings.VERIFICATION_CODE_LENGTH
    return ''.join(random.choices(string.digits, k=length))


async def send_email(
    email_to: str,
    subject: str,
    body: str,
) -> bool:
    """
    发送邮件的通用函数
    """
    try:
        message = MessageSchema(
            subject=subject,
            recipients=[email_to],
            body=body,
            subtype="html"
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"邮件已发送至 {email_to}")
        return True
    except Exception as e:
        logger.error(f"发送邮件失败: {str(e)}")
        return False


async def send_verification_code(email_to: EmailStr) -> tuple[bool, Optional[str]]:
    """
    发送验证码邮件并将验证码存储在Redis中
    
    返回:
        (bool, str): (是否成功, 验证码)
    """
    # 生成验证码
    code = generate_verification_code()
    
    # 设置过期时间
    expire_minutes = settings.VERIFICATION_CODE_EXPIRE_MINUTES
    expire_time = datetime.utcnow() + timedelta(minutes=expire_minutes)
    
    # 构建邮件内容
    subject = f"{settings.PROJECT_NAME} - 邮箱验证码"
    body = f"""
    <html>
    <body>
        <h2>您好！</h2>
        <p>感谢您注册 {settings.PROJECT_NAME}。</p>
        <p>您的验证码是: <strong>{code}</strong></p>
        <p>此验证码将在 {expire_minutes} 分钟后过期。</p>
        <p>如果这不是您的操作，请忽略此邮件。</p>
    </body>
    </html>
    """
    
    # 发送邮件
    success = await send_email(email_to, subject, body)
    
    if success:
        # 将验证码存储在Redis中，设置过期时间
        cache_key = f"email_verification:{email_to}"
        await set_redis_cache(cache_key, code, expire_seconds=expire_minutes * 60)
        return True, code
    
    return False, None


async def verify_email_code(email: EmailStr, code: str) -> bool:
    """
    验证邮箱验证码是否正确
    """
    cache_key = f"email_verification:{email}"
    stored_code = await get_redis_cache(cache_key)
    
    if not stored_code:
        logger.warning(f"验证码已过期或不存在: {email}")
        return False
    
    # 验证成功后删除缓存中的验证码
    if stored_code == code:
        # 验证成功后删除缓存
        await set_redis_cache(cache_key, None, expire_seconds=1)
        return True
    
    return False