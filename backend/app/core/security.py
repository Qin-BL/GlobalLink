from datetime import datetime, timedelta
from typing import Any, Union, Optional

from jose import jwt
from passlib.context import CryptContext
import logging

from app.core.config import settings
from app.utils.token_cache import cache_user_token, get_cached_user_id, revoke_token

# 配置日志
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


DEFAULT_ALGORITHM = "HS256"


async def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """创建访问令牌并缓存到Redis"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # 计算过期时间（秒）
    expires_in = int((expire - datetime.utcnow()).total_seconds())
    
    # 创建令牌
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=DEFAULT_ALGORITHM)
    
    # 缓存令牌到Redis
    try:
        await cache_user_token(encoded_jwt, int(subject), expires_in)
    except Exception as e:
        logger.error(f"缓存令牌失败: {e}")
    
    return encoded_jwt


def create_access_token_sync(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """同步版本的创建访问令牌（用于兼容现有代码）"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=DEFAULT_ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


async def verify_token(token: str) -> Optional[int]:
    """验证令牌并从Redis缓存获取用户ID"""
    try:
        # 首先尝试从Redis缓存获取用户ID
        user_id = await get_cached_user_id(token)
        if user_id:
            return user_id
        
        # 如果缓存中没有，则解码JWT令牌
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[DEFAULT_ALGORITHM])
        user_id = int(payload.get("sub"))
        
        # 计算剩余过期时间
        exp = payload.get("exp")
        if exp:
            now = datetime.utcnow().timestamp()
            expires_in = int(exp - now)
            if expires_in > 0:
                # 将令牌添加到缓存
                await cache_user_token(token, user_id, expires_in)
                return user_id
        
        return None
    except Exception as e:
        logger.error(f"验证令牌失败: {e}")
        return None


async def revoke_user_token(token: str) -> bool:
    """撤销用户令牌（用于登出）"""
    try:
        return await revoke_token(token)
    except Exception as e:
        logger.error(f"撤销令牌失败: {e}")
        return False