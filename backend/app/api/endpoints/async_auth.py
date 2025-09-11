"""
异步认证端点
"""
from datetime import timedelta, datetime
from typing import Any
import logging
import secrets
import string

from fastapi import APIRouter, Body, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import EmailStr

from ...models import User
from ...schemas import Token, UserCreate, UserResponse
from ..async_deps import get_async_db
from ...core import async_security
from ...core.config import settings
from ...utils.email import send_verification_code, verify_email_code

logger = logging.getLogger(__name__)

router = APIRouter()


async def _find_user_by_identifier(db: AsyncSession, identifier: str) -> tuple[User | None, str]:
    """通过用户名、邮箱或手机号查找用户（异步版本）"""
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


def _validate_user_credentials(user: User, password: str) -> None:
    """验证用户凭据"""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not async_security.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户账户已被禁用"
        )


async def _create_tokens(user_id: int) -> dict[str, str]:
    """创建访问令牌和刷新令牌（异步版本）"""
    return await async_security.create_user_tokens(user_id)


@router.post("/login", response_model=Token)
async def login_access_token(
    *,
    db: AsyncSession = Depends(get_async_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2兼容的令牌登录，获取访问令牌以供将来的请求使用
    """
    try:
        user, identifier_type = await _find_user_by_identifier(db, form_data.username)
        _validate_user_credentials(user, form_data.password)
        
        logger.info(f"用户登录成功: {form_data.username} (通过{identifier_type})")
        
        return await _create_tokens(user.id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"登录过程中发生错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="登录过程中发生内部错误"
        )


@router.post("/login/custom", response_model=Token)
async def login_custom(
    *,
    db: AsyncSession = Depends(get_async_db),
    username: str = Body(..., description="用户名、邮箱或手机号"),
    password: str = Body(..., description="密码")
) -> Any:
    """
    自定义登录接口，支持用户名、邮箱或手机号登录
    """
    try:
        user, identifier_type = await _find_user_by_identifier(db, username)
        _validate_user_credentials(user, password)
        
        logger.info(f"用户自定义登录成功: {username} (通过{identifier_type})")
        
        return await _create_tokens(user.id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"自定义登录过程中发生错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="登录过程中发生内部错误"
        )


@router.post("/register", response_model=UserResponse)
async def register(
    *,
    db: AsyncSession = Depends(get_async_db),
    user_in: UserCreate,
) -> Any:
    """
    创建新用户
    """
    try:
        # 检查用户名是否已存在
        result = await db.execute(select(User).where(User.username == user_in.username))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="用户名已存在"
            )
        
        # 检查邮箱是否已存在
        result = await db.execute(select(User).where(User.email == user_in.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="邮箱已被注册"
            )
        
        # 检查手机号是否已存在（如果提供）
        if user_in.phone:
            result = await db.execute(select(User).where(User.phone == user_in.phone))
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="手机号已被注册"
                )
        
        # 生成唯一推广码
        referral_code = await _generate_unique_referral_code(db)
        
        # 创建用户
        user = User(
            username=user_in.username,
            email=user_in.email,
            phone=user_in.phone,
            hashed_password=async_security.get_password_hash(user_in.password),
            full_name=user_in.full_name,
            referral_code=referral_code,
            is_active=True,
            is_superuser=False,
            is_admin=False,
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        logger.info(f"新用户注册成功: {user.username}")
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"用户注册过程中发生错误: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="注册过程中发生内部错误"
        )


async def _generate_unique_referral_code(db: AsyncSession) -> str:
    """生成唯一的推广码（异步版本）"""
    while True:
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        result = await db.execute(select(User).where(User.referral_code == code))
        if not result.scalar_one_or_none():
            return code


@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    refresh_token: str = Body(..., description="刷新令牌")
) -> Any:
    """
    刷新访问令牌
    """
    try:
        # 验证刷新令牌
        payload = await async_security.verify_token(refresh_token, "refresh")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的刷新令牌"
            )
        
        user_id = int(payload["sub"])
        
        # 创建新的令牌对
        tokens = await _create_tokens(user_id)
        
        logger.info(f"令牌刷新成功: 用户ID {user_id}")
        
        return tokens
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"令牌刷新过程中发生错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="令牌刷新过程中发生内部错误"
        )


@router.post("/logout")
async def logout() -> Any:
    """用户登出（异步版本）"""
    # TODO: 实现令牌撤销逻辑
    # 可以将令牌加入黑名单或从缓存中删除
    return {"message": "成功登出"}


@router.post("/send-verification-code")
async def send_verification_code_endpoint(
    email: EmailStr = Body(..., description="接收验证码的邮箱地址")
) -> Any:
    """发送邮箱验证码（异步版本）"""
    try:
        success, code = await send_verification_code(email)
        
        if success:
            logger.info(f"验证码发送成功: {email}")
            return {"message": "验证码已发送到您的邮箱"}
        else:
            logger.error(f"验证码发送失败: {email}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="验证码发送失败，请稍后重试"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"发送验证码过程中发生错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="发送验证码过程中发生内部错误"
        )


@router.post("/verify-email-code")
async def verify_email_code_endpoint(
    email: EmailStr = Body(..., description="邮箱地址"),
    code: str = Body(..., description="验证码")
) -> Any:
    """验证邮箱验证码（异步版本）"""
    try:
        is_valid = await verify_email_code(email, code)
        
        if is_valid:
            logger.info(f"邮箱验证成功: {email}")
            return {"message": "邮箱验证成功"}
        else:
            logger.warning(f"邮箱验证失败: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="验证码无效或已过期"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"验证邮箱验证码过程中发生错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="验证过程中发生内部错误"
        )