"""
异步依赖注入
"""
import logging
from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..models import User
from ..schemas import TokenPayload
from ..core import security
from ..core.config import settings
from ..db.async_session import get_async_db
from ..utils.token_cache import get_cached_user_id

logger = logging.getLogger(__name__)

# OAuth2密码流认证
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

# HTTP Bearer认证（用于API密钥等）
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    db: AsyncSession = Depends(get_async_db),
    token: str | None = Depends(oauth2_scheme)
) -> User:
    """获取当前认证用户（异步版本）"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # 首先尝试从缓存获取用户ID
        cached_user_id = await get_cached_user_id(token)
        if cached_user_id:
            result = await db.execute(
                select(User).where(User.id == cached_user_id)
            )
            user = result.scalar_one_or_none()
            if user and user.is_active:
                return user
        
        # 缓存未命中，解析JWT令牌
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValueError) as e:
        logger.warning(f"JWT解码失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 异步查询用户
    result = await db.execute(
        select(User).where(User.id == token_data.sub)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前活跃用户（异步版本）"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="用户账户已被禁用"
        )
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前超级用户（异步版本）"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足：需要超级用户权限"
        )
    return current_user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前管理员用户（异步版本）"""
    if not (current_user.is_superuser or current_user.is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足：需要管理员权限"
        )
    return current_user


async def get_optional_current_user(
    db: AsyncSession = Depends(get_async_db),
    token: str | None = Depends(oauth2_scheme)
) -> Optional[User]:
    """获取可选的当前用户（异步版本）"""
    if not token:
        return None
    
    try:
        return await get_current_user(db, token)
    except HTTPException:
        return None


async def check_rate_limit(
    request: Request,
    limit: int = 100,
    window: int = 3600
) -> bool:
    """检查请求频率限制（异步版本）"""
    from ..utils.redis_cache import set_rate_limit
    
    client_ip = request.client.host
    rate_key = f"rate_limit:{client_ip}:{request.url.path}"
    
    current_requests = await set_rate_limit(rate_key, window)
    
    if current_requests > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"请求过于频繁，请在{window}秒后重试"
        )
    
    return True


async def validate_api_key(
    api_key: str = Depends(bearer_scheme)
) -> bool:
    """验证API密钥（异步版本）"""
    if not api_key or api_key.credentials != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的API密钥",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return True


def get_user_permissions(user: User) -> list[str]:
    """获取用户权限列表"""
    permissions = []
    
    if user.is_superuser:
        permissions.extend([
            "user:read", "user:write", "user:delete",
            "admin:read", "admin:write", "admin:delete",
            "system:read", "system:write", "system:delete"
        ])
    elif user.is_admin:
        permissions.extend([
            "user:read", "user:write",
            "admin:read", "admin:write"
        ])
    else:
        permissions.extend([
            "user:read"
        ])
    
    return permissions


def require_permission(permission: str):
    """权限装饰器工厂（异步版本）"""
    async def permission_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        user_permissions = get_user_permissions(current_user)
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足：需要 {permission} 权限"
            )
        return current_user
    
    return permission_checker