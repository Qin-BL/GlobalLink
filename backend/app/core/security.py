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

from .config import settings

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

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码
    """
    return pwd_context.verify(plain_password, hashed_password)

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