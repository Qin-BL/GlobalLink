# -*- coding: utf-8 -*-
"""
认证端点
"""
from datetime import timedelta, datetime
from typing import Any
import logging

from fastapi import APIRouter, Body, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import EmailStr

from ...models import User
from ...schemas import Token, UserCreate, UserResponse
from ...db.session import get_async_db
from ...core import security
from ...core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


async def _find_user_by_identifier(db: AsyncSession, identifier: str) -> tuple[User | None, str]:
    """通过用户名、邮箱或手机号查找用户"""
    # 尝试通过用户名查找
    result = await db.execute(select(User).where(User.username == identifier))
    user = result.scalar_one_or_none()
    if user:
        return user, "username"
    
    # 尝试通过邮箱查找
    result = await db.execute(select(User).where(User.email == identifier))
    user = result.scalar_one_or_none()
    if user:
        return user, "email"
    
    # 尝试通过手机号查找
    result = await db.execute(select(User).where(User.phone == identifier))
    user = result.scalar_one_or_none()
    if user:
        return user, "phone"
    
    return None, ""


async def _create_tokens(user_id: int) -> dict[str, Any]:
    """创建访问令牌和刷新令牌"""
    return await security.create_user_tokens(user_id)


@router.post("/login", response_model=Token)
async def login_for_access_token(
    *,
    db: AsyncSession = Depends(get_async_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """用户登录"""
    user, identifier_type = await _find_user_by_identifier(db, form_data.username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户账户已被禁用"
        )
    
    # 创建令牌
    tokens = await _create_tokens(user.id)
    
    logger.info(f"用户登录成功: {user.username} (通过{identifier_type})")
    
    return tokens


@router.post("/register", response_model=UserResponse)
async def register(
    *,
    db: AsyncSession = Depends(get_async_db),
    user_in: UserCreate,
) -> Any:
    """用户注册"""
    # 检查用户名是否已存在
    result = await db.execute(select(User).where(User.username == user_in.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 检查邮箱是否已存在
    if user_in.email:
        result = await db.execute(select(User).where(User.email == user_in.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )
    
    # 创建新用户
    user = User(
        username=user_in.username,
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=security.get_password_hash(user_in.password),
        is_active=True
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    logger.info(f"新用户注册: {user.username}")
    
    return user