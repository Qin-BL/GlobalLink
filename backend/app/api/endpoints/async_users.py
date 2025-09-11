"""
异步用户管理端点
"""
from typing import Any
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ...models import User
from ...schemas import UserResponse, UserCreate, UserUpdate
from ..async_deps import get_async_db, get_current_active_user, get_current_admin
from ...core.async_security import get_password_hash

router = APIRouter()


async def _generate_unique_referral_code(db: AsyncSession) -> str:
    """生成唯一的推广码（异步版本）"""
    while True:
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        result = await db.execute(select(User).where(User.referral_code == code))
        if not result.scalar_one_or_none():
            return code


async def _check_username_exists(db: AsyncSession, username: str, exclude_user_id: int | None = None) -> bool:
    """检查用户名是否已存在（异步版本）"""
    query = select(User).where(User.username == username)
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


async def _check_email_exists(db: AsyncSession, email: str, exclude_user_id: int | None = None) -> bool:
    """检查邮箱是否已存在（异步版本）"""
    query = select(User).where(User.email == email)
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


async def _check_phone_exists(db: AsyncSession, phone: str, exclude_user_id: int | None = None) -> bool:
    """检查手机号是否已存在（异步版本）"""
    query = select(User).where(User.phone == phone)
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


@router.get("/", response_model=list[UserResponse])
async def read_users(
    db: AsyncSession = Depends(get_async_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin),
) -> Any:
    """
    获取用户列表（异步版本）
    """
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    users = result.scalars().all()
    return users


@router.post("/", response_model=UserResponse)
async def create_user(
    *,
    db: AsyncSession = Depends(get_async_db),
    user_in: UserCreate,
    current_user: User = Depends(get_current_admin),
) -> Any:
    """
    创建新用户（异步版本）
    """
    # 检查用户名是否已存在
    if await _check_username_exists(db, user_in.username):
        raise HTTPException(
            status_code=400,
            detail="用户名已存在"
        )
    
    # 检查邮箱是否已存在
    if await _check_email_exists(db, user_in.email):
        raise HTTPException(
            status_code=400,
            detail="邮箱已被注册"
        )
    
    # 检查手机号是否已存在（如果提供）
    if user_in.phone and await _check_phone_exists(db, user_in.phone):
        raise HTTPException(
            status_code=400,
            detail="手机号已被注册"
        )
    
    # 生成唯一推广码
    referral_code = await _generate_unique_referral_code(db)
    
    user = User(
        username=user_in.username,
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        referral_code=referral_code,
        is_active=True,
        is_superuser=False,
        is_admin=False,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/me", response_model=UserResponse)
async def update_user_me(
    *,
    db: AsyncSession = Depends(get_async_db),
    password: str | None = None,
    full_name: str | None = None,
    email: str | None = None,
    phone: str | None = None,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    更新当前用户信息（异步版本）
    """
    current_user_data = jsonable_encoder(current_user)
    user_in = UserUpdate(**current_user_data)
    
    if password is not None:
        user_in.password = password
    if full_name is not None:
        user_in.full_name = full_name
    if email is not None:
        # 检查新邮箱是否已被其他用户使用
        if await _check_email_exists(db, email, current_user.id):
            raise HTTPException(
                status_code=400,
                detail="邮箱已被其他用户注册"
            )
        user_in.email = email
    if phone is not None:
        # 检查新手机号是否已被其他用户使用
        if await _check_phone_exists(db, phone, current_user.id):
            raise HTTPException(
                status_code=400,
                detail="手机号已被其他用户注册"
            )
        user_in.phone = phone
    
    user = await update_user(db, db_obj=current_user, obj_in=user_in)
    return user


@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取当前用户信息（异步版本）
    """
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
async def read_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
) -> Any:
    """
    根据ID获取特定用户（异步版本）
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user == current_user:
        return user
    
    if not current_user.is_superuser and not current_user.is_admin:
        raise HTTPException(
            status_code=400, 
            detail="权限不足：无法查看其他用户信息"
        )
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="用户不存在"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_by_id(
    *,
    db: AsyncSession = Depends(get_async_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_admin),
) -> Any:
    """
    更新用户信息（异步版本）
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="用户不存在"
        )
    
    # 检查用户名是否已被其他用户使用
    if user_in.username and await _check_username_exists(db, user_in.username, user_id):
        raise HTTPException(
            status_code=400,
            detail="用户名已被其他用户使用"
        )
    
    # 检查邮箱是否已被其他用户使用
    if user_in.email and await _check_email_exists(db, user_in.email, user_id):
        raise HTTPException(
            status_code=400,
            detail="邮箱已被其他用户注册"
        )
    
    # 检查手机号是否已被其他用户使用
    if user_in.phone and await _check_phone_exists(db, user_in.phone, user_id):
        raise HTTPException(
            status_code=400,
            detail="手机号已被其他用户注册"
        )
    
    user = await update_user(db, db_obj=user, obj_in=user_in)
    return user


@router.delete("/{user_id}")
async def delete_user(
    *,
    db: AsyncSession = Depends(get_async_db),
    user_id: int,
    current_user: User = Depends(get_current_admin),
) -> Any:
    """
    删除用户（异步版本）
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    if user == current_user:
        raise HTTPException(
            status_code=400, 
            detail="不能删除自己的账户"
        )
    
    await db.delete(user)
    await db.commit()
    return {"message": "用户删除成功"}


@router.get("/stats/summary")
async def get_user_stats(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_admin),
) -> Any:
    """
    获取用户统计信息（异步版本）
    """
    # 总用户数
    total_result = await db.execute(select(func.count(User.id)))
    total_users = total_result.scalar()
    
    # 活跃用户数
    active_result = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    active_users = active_result.scalar()
    
    # 管理员用户数
    admin_result = await db.execute(select(func.count(User.id)).where(User.is_admin == True))
    admin_users = admin_result.scalar()
    
    # 超级用户数
    superuser_result = await db.execute(select(func.count(User.id)).where(User.is_superuser == True))
    superuser_users = superuser_result.scalar()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "admin_users": admin_users,
        "superuser_users": superuser_users
    }


async def update_user(db: AsyncSession, *, db_obj: User, obj_in: UserUpdate) -> User:
    """更新用户对象（异步版本）"""
    obj_data = jsonable_encoder(db_obj)
    
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
    
    for field in obj_data:
        if field in update_data:
            if field == "password" and update_data[field]:
                hashed_password = get_password_hash(update_data[field])
                setattr(db_obj, "hashed_password", hashed_password)
            else:
                setattr(db_obj, field, update_data[field])
    
    await db.commit()
    await db.refresh(db_obj)
    return db_obj