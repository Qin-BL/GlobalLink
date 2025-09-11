"""
异步安全模块
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import secrets
import hashlib

from jose import jwt, JWTError
from passlib.context import CryptContext
from passlib.hash import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
import logging

from app.core.config import settings
from ..models import User
from ..utils.token_cache import cache_user_token, get_cached_user_id

logger = logging.getLogger(__name__)

# 使用更安全的密码上下文配置
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # 增加bcrypt轮数提高安全性
)

# JWT算法
ALGORITHM = settings.JWT_ALGORITHM


async def create_access_token(
    subject: str | Any, expires_delta: timedelta | None = None
) -> str:
    """创建访问令牌（异步版本）"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # 添加随机jti防止令牌重放攻击
    jti = secrets.token_urlsafe(32)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "jti": jti,
        "iat": datetime.now(timezone.utc)
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    
    # 异步缓存令牌
    expires_seconds = int(expires_delta.total_seconds()) if expires_delta else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    await cache_user_token(encoded_jwt, int(subject), expires_seconds, "access")
    
    return encoded_jwt


async def create_refresh_token(subject: str | Any) -> str:
    """创建刷新令牌（异步版本）"""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
    )
    
    # 添加随机jti防止令牌重放攻击
    jti = secrets.token_urlsafe(32)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": jti,
        "iat": datetime.now(timezone.utc)
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    
    # 异步缓存刷新令牌
    expires_seconds = settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60
    await cache_user_token(encoded_jwt, int(subject), expires_seconds, "refresh")
    
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """获取密码哈希"""
    return pwd_context.hash(password)


async def authenticate_user(
    db: AsyncSession, 
    username: str, 
    password: str
) -> Optional[User]:
    """认证用户（异步版本）"""
    try:
        # 通过用户名、邮箱或手机号查找用户
        result = await db.execute(
            select(User).where(
                or_(
                    User.username == username,
                    User.email == username,
                    User.phone == username
                )
            )
        )
        user = result.scalar_one_or_none()
        
        if not user:
            logger.warning(f"用户不存在: {username}")
            return None
        
        if not verify_password(password, user.hashed_password):
            logger.warning(f"密码验证失败: {username}")
            return None
        
        if not user.is_active:
            logger.warning(f"用户账户已禁用: {username}")
            return None
        
        logger.info(f"用户认证成功: {username}")
        return user
        
    except Exception as e:
        logger.error(f"用户认证过程中发生错误: {e}")
        return None


async def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """验证令牌（异步版本）"""
    try:
        # 首先尝试从缓存获取
        cached_user_id = await get_cached_user_id(token, token_type)
        if cached_user_id:
            return {"sub": str(cached_user_id), "type": token_type}
        
        # 缓存未命中，解析JWT
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        
        # 验证令牌类型
        if payload.get("type") != token_type:
            logger.warning(f"令牌类型不匹配: 期望 {token_type}, 实际 {payload.get('type')}")
            return None
        
        return payload
        
    except JWTError as e:
        logger.warning(f"JWT验证失败: {e}")
        return None
    except Exception as e:
        logger.error(f"令牌验证过程中发生错误: {e}")
        return None


def generate_password_reset_token(email: str) -> str:
    """生成密码重置令牌"""
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(timezone.utc)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email}, 
        settings.SECRET_KEY, 
        algorithm=ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    """验证密码重置令牌"""
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return decoded_token["sub"]
    except JWTError:
        return None


def generate_api_key() -> str:
    """生成API密钥"""
    return secrets.token_urlsafe(32)


def hash_api_key(api_key: str) -> str:
    """哈希API密钥"""
    return hashlib.sha256(api_key.encode()).hexdigest()


async def create_user_tokens(user_id: int) -> dict[str, str]:
    """创建用户令牌对（访问令牌 + 刷新令牌）"""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # 并发创建两个令牌
    import asyncio
    access_token_task = create_access_token(user_id, expires_delta=access_token_expires)
    refresh_token_task = create_refresh_token(user_id)
    
    access_token, refresh_token = await asyncio.gather(
        access_token_task,
        refresh_token_task
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }