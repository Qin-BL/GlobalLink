import asyncio
import logging
import random
import string
from datetime import datetime, timedelta
from typing import Optional, List, Tuple

from fastapi import BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr, BaseModel

from app.core.config import settings
from app.utils.redis_cache import get_redis_cache, set_redis_cache

# 配置日志
logger = logging.getLogger(__name__)

# 邮件连接配置 - 针对QQ邮箱优化
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    # 针对QQ邮箱优化的连接配置
    MAIL_STARTTLS=settings.MAIL_PORT == 587,  # 端口587使用STARTTLS
    MAIL_SSL_TLS=settings.MAIL_PORT == 465,  # 端口465使用SSL/TLS
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False,  # 禁用证书验证，解决QQ邮箱证书问题
    TIMEOUT=30,  # 增加超时时间到30秒以适应网络波动
)

# 记录当前使用的邮件配置
logger.info(f"正在使用邮件服务器配置: {settings.MAIL_SERVER}:{settings.MAIL_PORT}, STARTTLS: {settings.MAIL_PORT == 587}, SSL/TLS: {settings.MAIL_PORT == 465}")

# 验证邮件配置
if not all([settings.MAIL_USERNAME, settings.MAIL_PASSWORD, settings.MAIL_FROM, settings.MAIL_PORT, settings.MAIL_SERVER]):
    logger.warning("邮件服务配置不完整，可能导致邮件发送失败")



def generate_verification_code(length: int = None) -> str:
    """
    生成指定长度的数字验证码
    """
    if length is None:
        length = settings.VERIFICATION_CODE_LENGTH
    return ''.join(random.choices(string.digits, k=length))


class EmailSchema(BaseModel):
    email: List[EmailStr]

async def send_email(
    email_to: str,
    subject: str,
    body: str,
    max_retries: int = 3,
    retry_delay: int = 2
) -> bool:
    """
    发送邮件的通用函数，包含重试机制

    参数:
        email_to: 收件人邮箱
        subject: 邮件主题
        body: 邮件内容
        max_retries: 最大重试次数
        retry_delay: 重试间隔(秒)

    返回:
        bool: 是否发送成功
    """
    retries = 0
    while retries <= max_retries:
        try:
            # 添加邮件配置调试信息
            logger.info(f"尝试发送邮件至 {email_to}")
            logger.debug(f"邮件服务器配置: {settings.MAIL_SERVER}:{settings.MAIL_PORT}, TLS: {settings.MAIL_USE_TLS}")
            
            message = MessageSchema(
                subject=subject,
                recipients=[email_to],
                body=body,
                subtype=MessageType.html
            )
            
            fm = FastMail(conf)
            await fm.send_message(message)
            logger.info(f"邮件已发送至 {email_to}")
            return True
        except Exception as e:
            retries += 1
            error_msg = str(e)
            logger.error(f"发送邮件失败 (尝试 {retries}/{max_retries}): {error_msg}")
            logger.debug(f"异常类型: {type(e).__name__}")
            
            # 特殊处理QQ邮箱SMTP响应格式异常
            if "Malformed SMTP response line" in error_msg and 'b"\\x00\\x00\\x00\\x1a\\x00\\x00\\x00\\n"' in error_msg:
                logger.warning("检测到QQ邮箱SMTP响应格式异常，但邮件可能已发送成功，继续处理...")
                return True
                
            if retries <= max_retries:
                logger.info(f"{retry_delay}秒后重试...")
                await asyncio.sleep(retry_delay)
    logger.error(f"邮件发送失败，已达到最大重试次数({max_retries})")
    return False


def send_email_background(
    background_tasks: BackgroundTasks,
    email_to: str,
    subject: str,
    body: str
) -> None:
    """
    使用背景任务发送邮件

    参数:
        background_tasks: FastAPI背景任务对象
        email_to: 收件人邮箱
        subject: 邮件主题
        body: 邮件内容
    """
    background_tasks.add_task(send_email, email_to, subject, body)

async def send_verification_code(email_to: EmailStr) -> Tuple[bool, Optional[str]]:
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