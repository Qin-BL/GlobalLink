# -*- coding: utf-8 -*-
"""
异步安全相关工具函数
提供异步版本的JWT令牌处理和密码加密功能
"""
from datetime import datetime, timedelta, UTC
from typing import Any, Union, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
import secrets
import string
import logging

from .config import settings
from ..utils.async_utils import sync_async_pair, async_with_error_handling

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


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


# 使用sync_async_pair创建异步版本
create_access_token = sync_async_pair(
    _create_access_token_sync,
    log_type="SECURITY_ERROR",
    log_message="创建访问令牌失败"
)


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


# 使用装饰器创建带错误处理的异步版本
@async_with_error_handling(
    log_type="SECURITY_ERROR",
    log_message="解码访问令牌失败",
    raise_exception=False,
    default_return=None
)
async def decode_access_token(token: str) -> Optional[dict]:
    """
    异步解码访问令牌
    """
    return _decode_access_token_sync(token)


@async_with_error_handling(
    log_type="SECURITY_ERROR",
    log_message="密码验证失败",
    raise_exception=False,
    default_return=False
)
async def verify_password(plain_password: str, hashed_password: str, username: Optional[str] = None) -> bool:
    """
    异步验证密码并记录审计日志
    使用线程池执行CPU密集型操作
    
    Args:
        plain_password: 明文密码
        hashed_password: 哈希密码
        username: 可选的用户名，用于审计日志
    
    Returns:
        密码是否验证成功
    """
    try:
        # 使用线程池执行CPU密集型操作
        is_valid = await sync_async_pair(
            pwd_context.verify,
            use_thread=True
        )(plain_password, hashed_password)
        
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


@async_with_error_handling(
    log_type="SECURITY_ERROR",
    log_message="生成密码哈希失败"
)
async def get_password_hash(password: str) -> str:
    """
    异步获取密码哈希
    使用线程池执行CPU密集型操作
    """
    # 使用asyncio.to_thread在线程池执行CPU密集型操作
    return await sync_async_pair(
        pwd_context.hash,
        use_thread=True
    )(password)


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


# 使用sync_async_pair创建异步版本
generate_password_reset_token = sync_async_pair(
    _generate_password_reset_token_sync,
    log_type="SECURITY_ERROR",
    log_message="生成密码重置令牌失败"
)


def _verify_password_reset_token_sync(token: str) -> Optional[str]:
    """
    同步验证密码重置令牌的实际实现
    """
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return decoded_token["sub"]
    except JWTError:
        return None


# 使用装饰器创建带错误处理的异步版本
@async_with_error_handling(
    log_type="SECURITY_ERROR",
    log_message="验证密码重置令牌失败",
    raise_exception=False,
    default_return=None
)
async def verify_password_reset_token(token: str) -> Optional[str]:
    """
    异步验证密码重置令牌
    """
    return _verify_password_reset_token_sync(token)


# 完成generate_random_string函数的重构
def _generate_random_string_sync(length: int = 32) -> str:
    """
    同步生成随机字符串的实际实现
    """
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# 使用sync_async_pair创建异步版本，在线程池执行
generate_random_string = sync_async_pair(
    _generate_random_string_sync,
    log_type="SECURITY_ERROR",
    log_message="生成随机字符串失败",
    use_thread=True
)