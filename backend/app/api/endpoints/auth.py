from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.security import get_password_hash
from app.utils.utils import (
    generate_password_reset_token,
    verify_password_reset_token,
)

router = APIRouter()


@router.post("/login", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """OAuth2 兼容的令牌登录，获取访问令牌"""
    # 尝试通过用户名查找用户
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # 如果用户名未找到，尝试通过邮箱查找
    if not user:
        user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # 如果邮箱未找到，尝试通过手机号查找
    if not user:
        user = db.query(models.User).filter(models.User.phone == form_data.username).first()
    
    # 如果用户不存在或密码不正确
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码不正确",
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
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/login/custom", response_model=schemas.Token)
def login_custom(
    *,
    db: Session = Depends(deps.get_db),
    login_in: schemas.UserLogin,
) -> Any:
    """自定义登录，支持用户名、邮箱或手机号登录"""
    user = None
    
    # 尝试通过用户名查找用户
    if login_in.username:
        user = db.query(models.User).filter(models.User.username == login_in.username).first()
    
    # 如果用户名未找到，尝试通过邮箱查找
    if not user and login_in.email:
        user = db.query(models.User).filter(models.User.email == login_in.email).first()
    
    # 如果邮箱未找到，尝试通过手机号查找
    if not user and login_in.phone:
        user = db.query(models.User).filter(models.User.phone == login_in.phone).first()
    
    # 如果用户不存在或密码不正确
    if not user or not security.verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名、邮箱、手机号或密码不正确",
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
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/register", response_model=schemas.User)
def register(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
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
    
    # 创建用户
    user = models.User(
        username=user_in.username,
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=get_password_hash(user_in.password),
        referral_code=referral_code,
        referrer_id=referrer_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
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