# -*- coding: utf-8 -*-
"""
安全相关工具函数
"""
from datetime import datetime, timedelta, UTC
from typing import Any, Union, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
import secrets
import string
import logging

from .config import settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """
    创建访问令牌
    """
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """
    解码访问令牌
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        return payload
    except JWTError:
        return None

def verify_password(plain_password: str, hashed_password: str, username: Optional[str] = None) -> bool:
    """
    验证密码并记录审计日志
    
    Args:
        plain_password: 明文密码
        hashed_password: 哈希密码
        username: 可选的用户名，用于审计日志
    
    Returns:
        密码是否验证成功
    """
    try:
        is_valid = pwd_context.verify(plain_password, hashed_password)
        
        # 记录审计日志
        log_data = {
            "timestamp": datetime.now(UTC).isoformat(),
            "username": username or "unknown",
            "result": "success" if is_valid else "failed",
            "action": "password_verification"
        }
        
        # 根据结果使用不同的日志级别
        if is_valid:
            logger.info(f"密码验证成功: {log_data}")
        else:
            logger.warning(f"密码验证失败: {log_data}")
            
        return is_valid
    except Exception as e:
        logger.error(f"密码验证过程中发生错误: {str(e)}")
        return False

def get_password_hash(password: str) -> str:
    """
    获取密码哈希
    """
    return pwd_context.hash(password)

def generate_password_reset_token(email: str) -> str:
    """
    生成密码重置令牌
    """
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(UTC)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email}, settings.SECRET_KEY, algorithm="HS256",
    )
    return encoded_jwt

def verify_password_reset_token(token: str) -> Optional[str]:
    """
    验证密码重置令牌
    """
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return decoded_token["sub"]
    except JWTError:
        return None

def generate_random_string(length: int = 32) -> str:
    """
    生成随机字符串
    """
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))