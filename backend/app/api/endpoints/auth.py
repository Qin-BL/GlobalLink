from datetime import timedelta, datetime
from typing import Any
import logging
import secrets
import string

from fastapi import APIRouter, Body, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import EmailStr

from ...models import User
from ...schemas import Token, UserCreate, UserResponse
from ..deps import get_db
from ...core import security
from ...core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


def _find_user_by_identifier(db: Session, identifier: str) -> tuple[User | None, str]:
    """通过用户名、邮箱或手机号查找用户"""
    # 尝试通过用户名查找
    user = db.query(User).filter(User.username == identifier).first()
    if user:
        return user, "username"
    
    # 尝试通过邮箱查找
    user = db.query(User).filter(User.email == identifier).first()
    if user:
        return user, "email"
    
    # 尝试通过手机号查找
    user = db.query(User).filter(User.phone == identifier).first()
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
    
    if not security.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码不正确",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户账户已被禁用"
        )


def _update_last_login(db: Session, user: User) -> None:
    """更新用户最后登录时间"""
    user.last_login = datetime.utcnow()
    db.add(user)
    db.commit()


async def _create_tokens(user_id: int) -> dict[str, str]:
    """创建访问令牌和刷新令牌"""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=str(user_id), 
        expires_delta=access_token_expires
    )
    
    refresh_token = security.create_refresh_token(subject=str(user_id))
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
    }


@router.post("/login", response_model=Token)
async def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """OAuth2 兼容的令牌登录"""
    user, login_method = _find_user_by_identifier(db, form_data.username)
    _validate_user_credentials(user, form_data.password)
    _update_last_login(db, user)
    
    return await _create_tokens(user.id)


@router.post("/login/custom", response_model=Token)
async def login_custom(
    db: Session = Depends(get_db),
    username: str = Body(..., description="用户名、邮箱或手机号"),
    password: str = Body(..., description="用户密码"),
) -> Any:
    """自定义登录端点"""
    user, login_method = _find_user_by_identifier(db, username)
    _validate_user_credentials(user, password)
    _update_last_login(db, user)
    
    return await _create_tokens(user.id)


@router.post("/register", response_model=UserResponse)
async def register(
    db: Session = Depends(get_db),
    user_in: UserCreate = Body(...),
) -> Any:
    """注册新用户"""
    # 检查用户名是否已存在
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在",
        )
    
    # 检查邮箱是否已存在
    if user_in.email and db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已存在",
        )
    
    # 检查手机号是否已存在
    if user_in.phone and db.query(User).filter(User.phone == user_in.phone).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="手机号已存在",
        )
    
    # 生成唯一的推广码
    referral_code = _generate_unique_referral_code(db)
    
    # 处理推广人
    referrer_id = None
    if user_in.referral_code:
        referrer = db.query(User).filter(User.referral_code == user_in.referral_code).first()
        if referrer:
            referrer_id = referrer.id
    
    # 创建用户
    user = User(
        username=user_in.username,
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=security.get_password_hash(user_in.password),
        referral_code=referral_code,
        referrer_id=referrer_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    refresh_token: str = Body(..., description="刷新令牌")
) -> Any:
    """使用刷新令牌获取新的访问令牌"""
    try:
        payload = security.decode_token(refresh_token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的刷新令牌"
            )
        
        # 创建新的访问令牌
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = security.create_access_token(
            subject=user_id,
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token,  # 可以选择生成新的刷新令牌
        }
        
    except Exception as e:
        logger.error(f"刷新令牌失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的或过期的刷新令牌"
        )


@router.post("/logout")
async def logout() -> Any:
    """用户登出"""
    # 在实际应用中，这里应该将令牌加入黑名单
    # 目前只是返回成功消息
    return {"message": "登出成功"}


@router.post("/send-verification-code")
async def send_verification_code(
    email: EmailStr = Body(..., description="接收验证码的邮箱地址")
) -> Any:
    """发送邮箱验证码"""
    # 这里应该实现真正的邮件发送逻辑
    # 目前只是返回成功消息
    logger.info(f"发送验证码到邮箱: {email}")
    
    return {"message": "验证码已发送，请查收邮件"}


@router.post("/verify-email-code")
async def verify_email_code(
    email: EmailStr = Body(..., description="邮箱地址"),
    code: str = Body(..., description="验证码"),
) -> Any:
    """验证邮箱验证码"""
    # 这里应该实现真正的验证码验证逻辑
    # 目前只是返回成功消息
    logger.info(f"验证邮箱 {email} 的验证码: {code}")
    
    return {"message": "验证成功"}


def _generate_unique_referral_code(db: Session) -> str:
    """生成唯一的推广码"""
    while True:
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        if not db.query(User).filter(User.referral_code == code).first():
            return code