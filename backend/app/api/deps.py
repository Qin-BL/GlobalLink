"""
依赖注入模块
"""
from typing import Generator, Optional, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import redis
import logging

from ..db.session import get_async_db, get_redis
from ..core import security
from ..models import User

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security_scheme = HTTPBearer()

async def get_current_user(
    db: AsyncSession = Depends(get_async_db),
    token: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> User:
    """
    获取当前用户（异步版本）
    """
    try:
        payload = security.decode_access_token(token.credentials)
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证令牌",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌",
        )
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    获取当前活跃用户（异步版本）
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用户账户已被禁用")
    return current_user

async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    获取当前超级用户（异步版本）
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=400, detail="权限不足"
        )
    return current_user

async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    获取当前管理员用户（异步版本）
    """
    if not (current_user.is_superuser or getattr(current_user, 'is_admin', False)):
        raise HTTPException(
            status_code=400, detail="权限不足：需要管理员权限"
        )
    return current_user