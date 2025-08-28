from datetime import timedelta
from typing import Any
import logging

from fastapi import APIRouter, Body, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import EmailStr

from app import models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash
from app.utils.password_decrypt import decrypt_frontend_password, is_frontend_encrypted
from app.utils.utils import (
    generate_password_reset_token,
    verify_password_reset_token,
)
from app.utils.email import send_verification_code, verify_email_code
from app.utils.redis_cache import set_redis_cache, get_redis_cache
from app.utils.activity_logger import log_user_activity
from app.utils.token_cache import revoke_token

# 配置日志
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/login", response_model=schemas.Token)
async def login_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
) -> Any:
    """OAuth2 兼容的令牌登录，获取访问令牌"""
    # 尝试通过用户名查找用户
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    login_method = "username"
    
    # 如果用户名未找到，尝试通过邮箱查找
    if not user:
        user = db.query(models.User).filter(models.User.email == form_data.username).first()
        login_method = "email"
    
    # 如果邮箱未找到，尝试通过手机号查找
    if not user:
        user = db.query(models.User).filter(models.User.phone == form_data.username).first()
        login_method = "phone"
    
    # 如果用户不存在
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 处理前端加密的密码
    password_to_verify = form_data.password
    if is_frontend_encrypted(form_data.password):
        logger.info("接收到前端加密的密码，开始解密")
        decrypted_password = decrypt_frontend_password(form_data.password, settings.EXPECTED_DOMAIN)
        if decrypted_password is not None:
            password_to_verify = decrypted_password
            logger.info("密码解密成功")
        else:
            logger.warning("前端密码解密失败，使用原始密码验证")

    # 如果密码不正确
    if not security.verify_password(password_to_verify, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码不正确",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 如果用户未激活
    if not user.is_active:
        raise HTTPException(status_code=400, detail="用户未激活")
    
    # 更新最后登录时间
    from sqlalchemy.sql import func
    user.last_login = func.now()
    db.add(user)
    db.commit()
    
    # 生成访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = await security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    # 记录用户登录活动
    try:
        client_ip = request.client.host if request and request.client else None
        user_agent = request.headers.get("user-agent", "") if request else ""
        
        await log_user_activity(
            user_id=user.id,
            activity_type="login",
            details={
                "login_method": login_method,
                "oauth2_login": True,
                "ip": client_ip,
                "user_agent": user_agent
            }
        )
    except Exception as e:
        logger.error(f"记录用户登录活动失败: {e}")
    
    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/login/custom", response_model=schemas.Token)
async def login_custom(
    *, 
    db: Session = Depends(deps.get_db),
    username: str = Body(...),
    password: str = Body(...),
    request: Request = None,
) -> Any:
    """自定义登录端点，支持用户名/邮箱/手机号登录"""
    # 尝试通过用户名查找用户
    user = db.query(models.User).filter(models.User.username == username).first()
    login_method = "username"
    
    # 如果用户名未找到，尝试通过邮箱查找
    if not user:
        user = db.query(models.User).filter(models.User.email == username).first()
        login_method = "email"
    
    # 如果邮箱未找到，尝试通过手机号查找
    if not user:
        user = db.query(models.User).filter(models.User.phone == username).first()
        login_method = "phone"
    
    # 如果用户不存在
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 处理前端加密的密码
    password_to_verify = password
    if is_frontend_encrypted(password):
        logger.info("接收到前端加密的密码，开始解密")
        decrypted_password = decrypt_frontend_password(password, settings.EXPECTED_DOMAIN)
        if decrypted_password is not None:
            password_to_verify = decrypted_password
            logger.info("密码解密成功")
        else:
            logger.warning("前端密码解密失败，使用原始密码验证")
    
    # 如果密码不正确
    if not security.verify_password(password_to_verify, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码不正确",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 如果用户未激活
    if not user.is_active:
        raise HTTPException(status_code=400, detail="用户未激活")
    
    # 更新最后登录时间
    user.last_login = models.func.now()
    db.add(user)
    db.commit()
    
    # 生成访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = await security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    # 记录用户登录活动
    try:
        client_ip = request.client.host if request and request.client else None
        user_agent = request.headers.get("user-agent", "") if request else ""
        
        await log_user_activity(
            user_id=user.id,
            activity_type="login",
            details={
                "login_method": login_method,
                "custom_login": True,
                "ip": client_ip,
                "user_agent": user_agent
            }
        )
    except Exception as e:
        logger.error(f"记录用户登录活动失败: {e}")
    
    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/register", response_model=schemas.User)
async def register(
    *, 
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    request: Request = None,
) -> Any:
    """注册新用户"""
    # 检查用户名是否已存在
    user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="用户名已存在",
        )
    
    # 检查邮箱是否已存在
    if user_in.email:
        user = db.query(models.User).filter(models.User.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="邮箱已存在",
            )
        
        # 验证邮箱验证码
        if not await verify_email_code(user_in.email, user_in.email_verification_code):
            raise HTTPException(
                status_code=400,
                detail="邮箱验证码不正确或已过期",
            )
    
    # 检查手机号是否已存在
    if user_in.phone:
        user = db.query(models.User).filter(models.User.phone == user_in.phone).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="手机号已存在",
            )
    
    # 生成唯一的推广码
    import secrets
    import string
    referral_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    while db.query(models.User).filter(models.User.referral_code == referral_code).first():
        referral_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    
    # 处理推广人
    referrer_id = None
    if user_in.referral_code:
        referrer = db.query(models.User).filter(models.User.referral_code == user_in.referral_code).first()
        if referrer:
            referrer_id = referrer.id
    
    # 处理前端加密的密码
    password_to_hash = user_in.password
    if is_frontend_encrypted(user_in.password):
        logger.info("接收到前端加密的注册密码，开始解密")
        decrypted_password = decrypt_frontend_password(user_in.password, settings.EXPECTED_DOMAIN)
        if decrypted_password is not None:
            password_to_hash = decrypted_password
            logger.info("注册密码解密成功")
        else:
            logger.warning("注册时前端密码解密失败，使用原始密码")
    
    # 创建用户
    user = models.User(
        username=user_in.username,
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=get_password_hash(password_to_hash),
        referral_code=referral_code,
        referrer_id=referrer_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # 记录用户注册活动
    try:
        client_ip = request.client.host if request and request.client else None
        user_agent = request.headers.get("user-agent", "") if request else ""
        
        await log_user_activity(
            user_id=user.id,
            activity_type="register",
            details={
                "username": user.username,
                "email": user.email,
                "phone": user.phone,
                "referral_code": user_in.referral_code,
                "ip": client_ip,
                "user_agent": user_agent
            }
        )
    except Exception as e:
        logger.error(f"记录用户注册活动失败: {e}")
    
    # 如果是通过推广注册的，为推广人创建一个pending状态的奖励记录
    if referrer_id:
        # 这里暂时不设置奖励金额，等用户开通会员后再根据settings.REFERRAL_RATE计算奖励金额
        reward = models.Reward(
            user_id=referrer_id,
            amount=0,  # 暂时设为0，等用户开通会员后再更新为payment.amount * settings.REFERRAL_RATE
            source="referral",
            related_user_id=user.id,
            status="pending"  # pending状态，等待用户开通会员
        )
        db.add(reward)
        db.commit()
    
    return user


@router.post("/send-verification-code")
async def send_email_verification_code(
    email_data: dict = Body(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
) -> Any:
    """发送邮箱验证码"""
    # 从请求体中提取email
    email = email_data.get("email")
    if not email:
        raise HTTPException(
            status_code=400,
            detail="邮箱地址不能为空"
        )
    
    # 检查是否在短时间内重复发送
    cache_key = f"email_verification_cooldown:{email}"
    cooldown = await get_redis_cache(cache_key)
    
    if cooldown:
        raise HTTPException(
            status_code=429,
            detail="请求过于频繁，请稍后再试"
        )
    
    # 发送验证码
    success, code = await send_verification_code(email)
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="发送验证码失败，请稍后再试"
        )
    
    # 设置冷却时间（60秒内不能重复发送）
    await set_redis_cache(cache_key, True, expire_seconds=60)
    
    return {"message": "验证码已发送，请查收邮件"}


@router.post("/verify-email-code")
async def verify_email_verification_code(
    *,
    email: EmailStr,
    code: str,
) -> Any:
    """验证邮箱验证码"""
    is_valid = await verify_email_code(email, code)
    
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="验证码不正确或已过期"
        )
    
    return {"message": "验证成功"}


@router.post("/logout")
async def logout(
    token: str = Body(...),
    current_user: models.User = Depends(deps.get_current_user_async),
    request: Request = None,
) -> Any:
    """用户登出，撤销令牌"""
    try:
        # 撤销当前令牌
        await security.revoke_user_token(token)
        
        # 记录用户登出活动
        client_ip = request.client.host if request and request.client else None
        user_agent = request.headers.get("user-agent", "") if request else ""
        
        await log_user_activity(
            user_id=current_user.id,
            activity_type="logout",
            details={
                "ip": client_ip,
                "user_agent": user_agent
            }
        )
        
        return {"message": "登出成功"}
    except Exception as e:
        logger.error(f"登出失败: {e}")
        raise HTTPException(
            status_code=500,
            detail="登出失败，请稍后再试"
        )