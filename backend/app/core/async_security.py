# -*- coding: utf-8 -*-
"""
异步安全相关工具函数
提供异步版本的JWT令牌处理和密码加密功能
"""
from datetime import datetime, timedelta, UTC
from typing import Any, Union, Optional
import asyncio
from jose import jwt, JWTError
from passlib.context import CryptContext
import secrets
import string

from .config import settings
from ..utils.async_logger import log_system

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


async def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """
    异步创建访问令牌
    """
    try:
        # 直接在线程池执行同步操作，避免创建不必要的任务
        return _create_access_token_sync(subject, expires_delta)
    except Exception as e:
        await log_system(
            log_type="SECURITY_ERROR",
            level="ERROR",
            message=f"创建访问令牌失败",
            details={"error": str(e)},
        )
        raise


def _create_access_token_sync(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """
    同步创建访问令牌的实际实现
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


async def decode_access_token(token: str) -> Optional[dict]:
    """
    异步解码访问令牌
    """
    try:
        # 直接在线程池执行同步操作，避免创建不必要的任务
        return _decode_access_token_sync(token)
    except Exception as e:
        await log_system(
            log_type="SECURITY_ERROR",
            level="ERROR",
            message=f"解码访问令牌失败",
            details={"error": str(e)},
        )
        return None


def _decode_access_token_sync(token: str) -> Optional[dict]:
    """
    同步解码访问令牌的实际实现
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[ALGORITHM]
        )
        return payload
    except JWTError:
        return None


async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    异步验证密码
    """
    try:
        # 使用asyncio.to_thread在线程池执行CPU密集型操作
        return await asyncio.to_thread(pwd_context.verify, plain_password, hashed_password)
    except Exception as e:
        await log_system(
            log_type="SECURITY_ERROR",
            level="ERROR",
            message=f"密码验证失败",
            details={"error": str(e)},
        )
        return False


async def get_password_hash(password: str) -> str:
    """
    异步获取密码哈希
    """
    try:
        # 使用asyncio.to_thread在线程池执行CPU密集型操作
        return await asyncio.to_thread(pwd_context.hash, password)
    except Exception as e:
        await log_system(
            log_type="SECURITY_ERROR",
            level="ERROR",
            message=f"生成密码哈希失败",
            details={"error": str(e)},
        )
        raise


async def generate_password_reset_token(email: str) -> str:
    """
    异步生成密码重置令牌
    """
    try:
        # 直接在线程池执行同步操作，避免创建不必要的任务
        return _generate_password_reset_token_sync(email)
    except Exception as e:
        await log_system(
            log_type="SECURITY_ERROR",
            level="ERROR",
            message=f"生成密码重置令牌失败",
            details={"error": str(e)},
        )
        raise


def _generate_password_reset_token_sync(email: str) -> str:
    """
    同步生成密码重置令牌的实际实现
    """
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(UTC)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email}, settings.SECRET_KEY, algorithm="HS256",
    )
    return encoded_jwt


async def verify_password_reset_token(token: str) -> Optional[str]:
    """
    异步验证密码重置令牌
    """
    try:
        # 直接在线程池执行同步操作，避免创建不必要的任务
        return _verify_password_reset_token_sync(token)
    except Exception as e:
        await log_system(
            log_type="SECURITY_ERROR",
            level="ERROR",
            message=f"验证密码重置令牌失败",
            details={"error": str(e)},
        )
        return None


def _verify_password_reset_token_sync(token: str) -> Optional[str]:
    """
    同步验证密码重置令牌的实际实现
    """
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return decoded_token["sub"]
    except JWTError:
        return None


async def generate_random_string(length: int = 32) -> str:
    """
    异步生成随机字符串
    """
    try:
        # 使用asyncio.to_thread在线程池执行随机字符串生成
        return await asyncio.to_thread(_generate_random_string_sync, length)
    except Exception as e:
        await log_system(
            log_type="SECURITY_ERROR",
            level="ERROR",
            message=f"生成随机字符串失败",
            details={"error": str(e)},
        )
        raise


def _generate_random_string_sync(length: int = 32) -> str:
    """
    同步生成随机字符串的实际实现
    """
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))