"""
异步管理员端点
"""
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models import User
from ...schemas import Token
from ..async_deps import get_async_db
from ...core import async_security
from ...core.config import settings

router = APIRouter()


@router.post("/login", response_model=Token)
async def admin_login(
    *,
    db: AsyncSession = Depends(get_async_db),
    username: str = Body(..., description="管理员用户名"),
    password: str = Body(..., description="管理员密码")
) -> Any:
    """
    管理员登录（异步版本）
    """
    # 查找管理员用户
    result = await db.execute(
        select(User).where(
            User.username == username,
            User.is_admin == True
        )
    )
    admin_user = result.scalar_one_or_none()
    
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="管理员账户不存在"
        )
    
    if not async_security.verify_password(password, admin_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码错误"
        )
    
    if not admin_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="管理员账户已被禁用"
        )
    
    # 生成访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await async_security.create_access_token(
        admin_user.id, expires_delta=access_token_expires
    )
    
    # 生成刷新令牌
    refresh_token = await async_security.create_refresh_token(admin_user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }