from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app import models, schemas
from app.api import deps
from app.core.config import settings
from app.core.security import get_password_hash, verify_password

router = APIRouter()


@router.post("/login", response_model=schemas.Token)
async def admin_login(
    *,
    db: Session = Depends(deps.get_db),
    username: str = Body(..., embed=True, description="管理员用户名"),
    password: str = Body(..., embed=True, description="管理员密码"),
) -> Any:
    """管理员登录"""
    # 验证管理员凭据
    if username != settings.ADMIN_USERNAME or password != settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="管理员用户名或密码不正确",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 查找或创建管理员用户
    admin_user = db.query(models.User).filter(
        models.User.username == settings.ADMIN_USERNAME,
        models.User.role == "admin"
    ).first()
    
    if not admin_user:
        # 创建管理员用户
        admin_user = models.User(
            username=settings.ADMIN_USERNAME,
            email="admin@globallink.com",
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            role="admin",
            is_active=True,
            referral_code="ADMIN001"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
    
    # 更新最后登录时间
    admin_user.last_login = func.now()
    db.add(admin_user)
    db.commit()
    
    # 生成访问令牌
    from datetime import timedelta
    from app.core import security
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = await security.create_access_token(
        admin_user.id, expires_delta=access_token_expires
    )
    
    # 生成刷新令牌
    refresh_token = await security.create_refresh_token(admin_user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
    }


@router.get("/users", response_model=List[schemas.User])
def get_all_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """获取所有用户列表"""
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users


@router.get("/users/stats")
def get_user_stats(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """获取用户统计信息"""
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == True).count()
    admin_users = db.query(models.User).filter(models.User.role == "admin").count()
    regular_users = db.query(models.User).filter(models.User.role == "user").count()
    
    # 获取最近注册的用户
    recent_users = db.query(models.User).order_by(models.User.created_at.desc()).limit(5).all()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "admin_users": admin_users,
        "regular_users": regular_users,
        "recent_users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "created_at": user.created_at,
                "is_active": user.is_active
            }
            for user in recent_users
        ]
    }


@router.post("/users", response_model=schemas.User)
def create_user_admin(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreateAdmin,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """管理员创建用户"""
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
    
    # 创建用户
    user = models.User(
        username=user_in.username,
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role or "user",
        is_active=user_in.is_active if user_in.is_active is not None else True,
        referral_code=referral_code,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=schemas.User)
def update_user_admin(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: schemas.UserUpdateAdmin,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """管理员更新用户信息"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 检查用户名是否已存在
    if user_in.username and user_in.username != user.username:
        existing_user = db.query(models.User).filter(models.User.username == user_in.username).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="用户名已存在",
            )
    
    # 检查邮箱是否已存在
    if user_in.email and user_in.email != user.email:
        existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="邮箱已存在",
            )
    
    # 检查手机号是否已存在
    if user_in.phone and user_in.phone != user.phone:
        existing_user = db.query(models.User).filter(models.User.phone == user_in.phone).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
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
        setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """删除用户"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 防止删除管理员自己
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="不能删除自己")
    
    # 删除用户相关数据
    # 删除用户的会员记录
    db.query(models.Membership).filter(models.Membership.user_id == user_id).delete()
    
    # 删除用户的学习进度
    db.query(models.Progress).filter(models.Progress.user_id == user_id).delete()
    
    # 删除用户的奖励记录
    if hasattr(models, 'Reward'):
        db.query(models.Reward).filter(models.Reward.user_id == user_id).delete()
        db.query(models.Reward).filter(models.Reward.related_user_id == user_id).delete()
    
    # 删除用户
    db.delete(user)
    db.commit()
    
    return {"message": f"用户 {user.username} 已删除"}


@router.delete("/users/all")
def delete_all_users(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_admin_user),
    confirm: bool = Body(..., embed=True, description="确认删除所有用户"),
) -> Any:
    """删除所有用户（危险操作）"""
    if not confirm:
        raise HTTPException(status_code=400, detail="必须确认删除操作")
    
    # 获取所有非管理员用户
    users_to_delete = db.query(models.User).filter(
        models.User.role != "admin",
        models.User.id != current_user.id
    ).all()
    
    if not users_to_delete:
        return {"message": "没有可删除的用户"}
    
    user_count = len(users_to_delete)
    user_ids = [user.id for user in users_to_delete]
    
    # 删除相关数据
    # 删除会员记录
    db.query(models.Membership).filter(models.Membership.user_id.in_(user_ids)).delete(synchronize_session=False)
    
    # 删除学习进度
    db.query(models.Progress).filter(models.Progress.user_id.in_(user_ids)).delete(synchronize_session=False)
    
    # 删除奖励记录
    if hasattr(models, 'Reward'):
        db.query(models.Reward).filter(models.Reward.user_id.in_(user_ids)).delete(synchronize_session=False)
        db.query(models.Reward).filter(models.Reward.related_user_id.in_(user_ids)).delete(synchronize_session=False)
    
    # 删除用户
    db.query(models.User).filter(models.User.id.in_(user_ids)).delete(synchronize_session=False)
    
    db.commit()
    
    return {"message": f"已删除 {user_count} 个用户"}


@router.get("/users/{user_id}", response_model=schemas.User)
def get_user_detail(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """获取用户详细信息"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    return user


@router.get("/users/{user_id}/membership")
def get_user_membership(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """获取用户会员信息"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 获取用户的会员记录
    memberships = db.query(models.Membership).filter(models.Membership.user_id == user_id).all()
    
    # 获取当前有效会员
    current_membership = deps.check_user_membership(db, user_id)
    
    return {
        "user_id": user_id,
        "username": user.username,
        "current_membership": {
            "id": current_membership.id,
            "type": current_membership.type,
            "start_date": current_membership.start_date,
            "end_date": current_membership.end_date,
            "is_active": current_membership.is_active
        } if current_membership else None,
        "membership_history": [
            {
                "id": membership.id,
                "type": membership.type,
                "start_date": membership.start_date,
                "end_date": membership.end_date,
                "is_active": membership.is_active,
                "created_at": membership.created_at
            }
            for membership in memberships
        ]
    }


@router.get("/users/{user_id}/progress")
def get_user_progress(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """获取用户学习进度"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 获取用户的学习进度
    progress_records = db.query(models.Progress).filter(models.Progress.user_id == user_id).all()
    
    return {
        "user_id": user_id,
        "username": user.username,
        "progress_records": [
            {
                "id": progress.id,
                "course_id": progress.course_id,
                "progress": progress.progress,
                "completed": progress.completed,
                "last_accessed": progress.last_accessed,
                "created_at": progress.created_at,
                "updated_at": progress.updated_at
            }
            for progress in progress_records
        ]
    }