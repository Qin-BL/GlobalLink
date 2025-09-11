from typing import Any
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from ...models import User
from ...schemas import UserResponse, UserCreate, UserUpdate
from ..deps import get_db, get_current_active_user, get_current_admin
from ...core.security import get_password_hash

router = APIRouter()


def _generate_unique_referral_code(db: Session) -> str:
    """生成唯一的推广码"""
    while True:
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        if not db.query(User).filter(User.referral_code == code).first():
            return code


def _check_username_exists(db: Session, username: str, exclude_user_id: int | None = None) -> bool:
    """检查用户名是否已存在"""
    query = db.query(User).filter(User.username == username)
    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)
    return query.first() is not None


def _check_email_exists(db: Session, email: str, exclude_user_id: int | None = None) -> bool:
    """检查邮箱是否已存在"""
    query = db.query(User).filter(User.email == email)
    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)
    return query.first() is not None


def _check_phone_exists(db: Session, phone: str, exclude_user_id: int | None = None) -> bool:
    """检查手机号是否已存在"""
    query = db.query(User).filter(User.phone == phone)
    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)
    return query.first() is not None


@router.get("/", response_model=list[UserResponse])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin),
) -> Any:
    """获取所有用户（仅限管理员）"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.post("/", response_model=UserResponse)
def create_user(
    db: Session = Depends(get_db),
    user_in: UserCreate = ...,
) -> Any:
    """创建新用户"""
    # 检查用户名是否已存在
    if _check_username_exists(db, user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在",
        )
    
    # 检查邮箱是否已存在
    if user_in.email and _check_email_exists(db, user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已存在",
        )
    
    # 检查手机号是否已存在
    if user_in.phone and _check_phone_exists(db, user_in.phone):
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
        hashed_password=get_password_hash(user_in.password),
        referral_code=referral_code,
        referrer_id=referrer_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """获取当前用户信息"""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_user_me(
    db: Session = Depends(get_db),
    user_in: UserUpdate = ...,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """更新当前用户信息"""
    # 检查用户名是否已存在
    if user_in.username and user_in.username != current_user.username:
        if _check_username_exists(db, user_in.username, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在",
            )
    
    # 检查邮箱是否已存在
    if user_in.email and user_in.email != current_user.email:
        if _check_email_exists(db, user_in.email, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已存在",
            )
    
    # 检查手机号是否已存在
    if user_in.phone and user_in.phone != current_user.phone:
        if _check_phone_exists(db, user_in.phone, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="手机号已存在",
            )
    
    # 更新用户信息
    update_data = user_in.dict(exclude_unset=True)
    
    # 如果更新密码，需要哈希处理
    if "password" in update_data:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
    
    for field, value in update_data.items():
        if hasattr(current_user, field):
            setattr(current_user, field, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/referral", response_model=dict)
def get_referral_info(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """获取用户的推广信息"""
    return {
        "referral_code": current_user.referral_code,
        "referral_rate": 0.5,  # 50%的返利比例
        "reward_balance": getattr(current_user, 'reward_balance', 0)
    }


@router.get("/referral/history", response_model=list[dict])
def get_referral_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """获取用户的推广历史"""
    # 查询被当前用户推广的用户
    referred_users = db.query(User).filter(User.referrer_id == current_user.id).all()
    
    result = []
    for user in referred_users:
        # 这里可以添加会员状态和奖励查询逻辑
        # 目前简化处理
        result.append({
            "id": user.id,
            "username": user.username,
            "register_time": user.created_at,
            "membership_status": "none",  # 简化处理
            "reward_status": "none",      # 简化处理
            "reward_amount": None
        })
    
    return result


@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> Any:
    """获取指定用户信息（仅限管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    db: Session = Depends(get_db),
    user_in: UserUpdate = ...,
    current_user: User = Depends(get_current_admin),
) -> Any:
    """更新指定用户信息（仅限管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 检查用户名是否已存在
    if user_in.username and user_in.username != user.username:
        if _check_username_exists(db, user_in.username, user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在",
            )
    
    # 检查邮箱是否已存在
    if user_in.email and user_in.email != user.email:
        if _check_email_exists(db, user_in.email, user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已存在",
            )
    
    # 检查手机号是否已存在
    if user_in.phone and user_in.phone != user.phone:
        if _check_phone_exists(db, user_in.phone, user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="手机号已存在",
            )
    
    # 更新用户信息
    update_data = user_in.dict(exclude_unset=True)
    
    # 如果更新密码，需要哈希处理
    if "password" in update_data:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
    
    for field, value in update_data.items():
        if hasattr(user, field):
            setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> Any:
    """删除指定用户（仅限管理员）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 防止删除超级用户
    if user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="不能删除超级用户"
        )
    
    db.delete(user)
    db.commit()
    return {"message": "用户删除成功"}