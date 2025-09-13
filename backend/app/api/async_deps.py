# -*- coding: utf-8 -*-
"""
异步依赖注入模块
提供异步版本的用户认证和授权依赖
"""
from typing import Optional, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from ..db.session import get_async_db, get_redis
from ..core import async_security
from ..models import User
from ..utils.async_logger import log_system

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security_scheme = HTTPBearer()


async def get_current_user(
    db: AsyncSession = Depends(get_async_db),
    token: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> User:
    """
    异步获取当前用户
    """
    try:
        # 使用异步版本的令牌解码
        payload = await async_security.decode_access_token(token.credentials)
        user_id: int = payload.get("sub")
        if user_id is None:
            await log_system(
                log_type="AUTH_ERROR",
                level="WARNING",
                message="无效的认证令牌：用户ID为空",
                ip_address="unknown",
                request_path="unknown",
                http_method="unknown",
                status_code=status.HTTP_401_UNAUTHORIZED
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证令牌",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception:
        await log_system(
            log_type="AUTH_ERROR",
            level="WARNING",
            message="无效的认证令牌：解码失败",
            ip_address="unknown",
            request_path="unknown",
            http_method="unknown",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        await log_system(
            log_type="AUTH_ERROR",
            level="WARNING",
            message="用户不存在",
            details={"user_id": user_id},
            ip_address="unknown",
            request_path="unknown",
            http_method="unknown",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌",
        )
    
    await log_system(
        log_type="AUTH_SUCCESS",
        level="INFO",
        message="用户认证成功",
        details={"user_id": user.id, "username": user.username},
        user_id=user.id,
        ip_address="unknown",
        request_path="unknown",
        http_method="unknown",
        status_code=status.HTTP_200_OK
    )
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    异步获取当前活跃用户
    """
    if not current_user.is_active:
        await log_system(
            log_type="AUTH_ERROR",
            level="WARNING",
            message="用户账户已被禁用",
            details={"user_id": current_user.id, "username": current_user.username},
            user_id=current_user.id,
            ip_address="unknown",
            request_path="unknown",
            http_method="unknown",
            status_code=status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=400, detail="用户账户已被禁用")
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    异步获取当前超级用户
    """
    if not current_user.is_superuser:
        await log_system(
            log_type="AUTH_ERROR",
            level="WARNING",
            message="权限不足：需要超级用户权限",
            details={"user_id": current_user.id, "username": current_user.username},
            user_id=current_user.id,
            ip_address="unknown",
            request_path="unknown",
            http_method="unknown",
            status_code=status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(
            status_code=400, detail="权限不足"
        )
    return current_user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    异步获取当前管理员用户
    """
    if not (current_user.is_superuser or getattr(current_user, 'is_admin', False)):
        await log_system(
            log_type="AUTH_ERROR",
            level="WARNING",
            message="权限不足：需要管理员权限",
            details={"user_id": current_user.id, "username": current_user.username},
            user_id=current_user.id,
            ip_address="unknown",
            request_path="unknown",
            http_method="unknown",
            status_code=status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(
            status_code=400, detail="权限不足：需要管理员权限"
        )
    return current_user