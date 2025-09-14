# -*- coding: utf-8 -*-
"""
管理员端点
"""
from datetime import timedelta, datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models import User
from ...schemas import Token, TwoFactorResponse
from ...db.session import get_async_db
from ...core import async_security as security
from ...core.config import settings
from ...utils.password_decrypt import decrypt_user_password
from ...core.totp_utils import verify_totp_code, verify_recovery_code, should_enforce_2fa

router = APIRouter()


@router.post("/login", response_model=Union[Token, TwoFactorResponse])
async def admin_login(
    *, 
    db: AsyncSession = Depends(get_async_db),
    username: str = Body(..., description="管理员用户名"),
    password: str = Body(..., description="管理员密码"),
    two_factor_code: Optional[str] = Body(None, description="双因素认证验证码"),
    recovery_code: Optional[str] = Body(None, description="恢复码")
) -> Any:
    """管理员登录（支持双因素认证）"""
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
            detail="管理员用户名或密码错误"
        )
    
    # 解密前端加密的密码
    decrypted_password = decrypt_user_password(password)
    
    if not await security.verify_password(decrypted_password, admin_user.hashed_password, username):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="管理员用户名或密码错误"
        )
    
    if not admin_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="管理员账户已被禁用"
        )
    
    # 检查是否需要双因素认证
    if admin_user.two_factor_enabled:
        # 如果用户提供了验证码或恢复码，则进行验证
        if two_factor_code or recovery_code:
            # 验证TOTP验证码
            if two_factor_code and admin_user.totp_secret:
                if verify_totp_code(admin_user.totp_secret, two_factor_code):
                    # 验证成功，更新上次验证时间
                    admin_user.two_factor_last_verified = datetime.now(timezone.utc)
                    await db.commit()
                else:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="双因素认证验证码错误"
                    )
            # 验证恢复码
            elif recovery_code and admin_user.two_factor_recovery_codes:
                is_valid, updated_codes = verify_recovery_code(
                    admin_user.two_factor_recovery_codes, recovery_code
                )
                if is_valid:
                    # 验证成功，更新恢复码列表
                    from ...core.totp_utils import hash_recovery_codes
                    # 使用用户ID作为盐值
                    salt = str(admin_user.id)
                    admin_user.two_factor_recovery_codes = hash_recovery_codes(
                        updated_codes, salt
                    ) if updated_codes else None
                    admin_user.two_factor_last_verified = datetime.now(timezone.utc)
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
            # 生成会话ID（实际实现中应该使用更安全的方式，如存储在缓存中）
            session_id = secrets.token_urlsafe(16)
            
            return TwoFactorResponse(
                requires_two_factor=True,
                user_id=admin_user.id,
                session_id=session_id
            )
    
    # 生成访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await security.create_access_token(
        admin_user.id, expires_delta=access_token_expires
    )
    
    # 生成刷新令牌（使用更长的过期时间）
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS or 7)
    refresh_token = await security.create_access_token(
        admin_user.id, expires_delta=refresh_token_expires
    )
    
    # 更新最后登录时间
    admin_user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }