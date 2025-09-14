# -*- coding: utf-8 -*-
"""认证端点"""
from datetime import timedelta, datetime, timezone
from typing import Any, Optional, Union
import logging
import secrets

from fastapi import APIRouter, Body, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import EmailStr

from ...models import User
from ...schemas import Token, UserCreate, UserResponse, TwoFactorResponse
from ...db.session import get_async_db
from ...core import security
from ...core.config import settings
from ...core.totp_utils import verify_totp_code, verify_recovery_code

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


@router.post("/login", response_model=Union[Token, TwoFactorResponse])
async def login_for_access_token(
    *, 
    db: AsyncSession = Depends(get_async_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
    two_factor_code: Optional[str] = Body(None, description="双因素认证验证码"),
    recovery_code: Optional[str] = Body(None, description="恢复码")
) -> Any:
    """用户登录（支持双因素认证）"""
    user, identifier_type = await _find_user_by_identifier(db, form_data.username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not security.verify_password(form_data.password, user.hashed_password, user.username):
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
    
    # 检查是否需要双因素认证
    if user.two_factor_enabled:
        # 如果用户提供了验证码或恢复码，则进行验证
        if two_factor_code or recovery_code:
            # 验证TOTP验证码
            if two_factor_code and user.totp_secret:
                if verify_totp_code(user.totp_secret, two_factor_code):
                    # 验证成功，更新上次验证时间
                    user.two_factor_last_verified = datetime.now(timezone.utc)
                    await db.commit()
                else:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="双因素认证验证码错误"
                    )
            # 验证恢复码
            elif recovery_code and user.two_factor_recovery_codes:
                is_valid, updated_codes = verify_recovery_code(
                    user.two_factor_recovery_codes, recovery_code
                )
                if is_valid:
                    # 验证成功，更新恢复码列表
                    from ...core.totp_utils import hash_recovery_codes
                    # 使用用户ID作为盐值
                    salt = str(user.id)
                    user.two_factor_recovery_codes = hash_recovery_codes(
                        updated_codes, salt
                    ) if updated_codes else None
                    user.two_factor_last_verified = datetime.now(timezone.utc)
                    await db.commit()
                else:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="恢复码错误或已过期"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="请提供有效的双因素认证验证码或恢复码"
                )
        # 如果用户未提供验证码，则要求进行双因素认证
        else:
            # 生成会话ID
            session_id = secrets.token_urlsafe(16)
            
            logger.info(f"用户需要双因素认证: {user.username}")
            
            return TwoFactorResponse(
                requires_two_factor=True,
                user_id=user.id,
                session_id=session_id
            )
    
    # 创建令牌
    tokens = await _create_tokens(user.id)
    
    # 更新最后登录时间
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    
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