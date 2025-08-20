from typing import Any, List

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
import secrets
import string

from app import models, schemas
from app.api import deps
from app.core.security import get_password_hash, verify_password

router = APIRouter()


@router.get("/", response_model=List[schemas.User])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """获取所有用户（仅限管理员）"""
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users


@router.post("/", response_model=schemas.User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """创建新用户"""
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
    return user


@router.get("/me", response_model=schemas.User)
def read_user_me(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取当前用户信息"""
    return current_user


@router.put("/me", response_model=schemas.User)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """更新当前用户信息"""
    # 检查用户名是否已存在
    if user_in.username and user_in.username != current_user.username:
        user = db.query(models.User).filter(models.User.username == user_in.username).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="用户名已存在",
            )
    
    # 检查邮箱是否已存在
    if user_in.email and user_in.email != current_user.email:
        user = db.query(models.User).filter(models.User.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="邮箱已存在",
            )
    
    # 检查手机号是否已存在
    if user_in.phone and user_in.phone != current_user.phone:
        user = db.query(models.User).filter(models.User.phone == user_in.phone).first()
        if user:
            raise HTTPException(
                status_code=400,
                detail="手机号已存在",
            )
    
    # 更新用户信息
    user_data = jsonable_encoder(current_user)
    update_data = user_in.dict(exclude_unset=True)
    
    # 如果更新密码，需要哈希处理
    if "password" in update_data:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
    
    for field in user_data:
        if field in update_data:
            setattr(current_user, field, update_data[field])
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/referral", response_model=dict)
def get_referral_info(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取用户的推广信息"""
    return {
        "referral_code": current_user.referral_code,
        "referral_rate": 0.5,  # 50%的返利比例
        "reward_balance": current_user.reward_balance
    }

@router.get("/referral/history", response_model=List[dict])
def get_referral_history(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取用户的推广历史"""
    # 查询被当前用户推广的用户
    referred_users = db.query(models.User).filter(models.User.referrer_id == current_user.id).all()
    
    # 查询这些用户的会员状态和相关奖励
    result = []
    for user in referred_users:
        # 查询用户的会员状态
        membership = deps.check_user_membership(db, user.id)
        membership_status = "active" if membership else "none"
        
        # 查询相关奖励
        reward = (
            db.query(models.Reward)
            .filter(
                models.Reward.user_id == current_user.id,
                models.Reward.source == "referral",
                models.Reward.related_user_id == user.id
            )
            .first()
        )
        
        # 根据奖励记录的状态确定奖励状态
        if reward:
            if reward.status == "available":
                reward_status = "received"
            elif reward.status == "pending":
                reward_status = "pending"
            else:
                reward_status = reward.status
        else:
            reward_status = "none"
        reward_amount = reward.amount if reward else None
        
        result.append({
            "id": user.id,
            "username": user.username,
            "register_time": user.created_at,
            "membership_status": membership_status,
            "reward_status": reward_status,
            "reward_amount": reward_amount
        })
    
    return result