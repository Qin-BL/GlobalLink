# -*- coding: utf-8 -*-
"""
会员管理端点
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...api.deps import get_current_active_user
from ...db.session import get_async_db
from ...models import User, Membership
from ...schemas import MembershipCreate, MembershipUpdate, MembershipResponse

router = APIRouter()

@router.get("/", response_model=List[MembershipResponse])
async def get_memberships(
    db: AsyncSession = Depends(get_async_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取会员列表
    """
    result = await db.execute(select(Membership).offset(skip).limit(limit))
    memberships = result.scalars().all()
    return memberships

@router.post("/", response_model=MembershipResponse)
async def create_membership(
    *,
    db: AsyncSession = Depends(get_async_db),
    membership_in: MembershipCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    创建新会员
    """
    membership = Membership(**membership_in.model_dump())
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return membership

@router.get("/{membership_id}", response_model=MembershipResponse)
async def get_membership(
    *,
    db: AsyncSession = Depends(get_async_db),
    membership_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取特定会员
    """
    result = await db.execute(select(Membership).where(Membership.id == membership_id))
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="会员不存在")
    return membership

@router.put("/{membership_id}", response_model=MembershipResponse)
async def update_membership(
    *,
    db: AsyncSession = Depends(get_async_db),
    membership_id: int,
    membership_in: MembershipUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    更新会员
    """
    result = await db.execute(select(Membership).where(Membership.id == membership_id))
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="会员不存在")
    
    update_data = membership_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(membership, field, value)
    
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return membership

@router.delete("/{membership_id}")
async def delete_membership(
    *,
    db: AsyncSession = Depends(get_async_db),
    membership_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    删除会员
    """
    result = await db.execute(select(Membership).where(Membership.id == membership_id))
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="会员不存在")
    
    await db.delete(membership)
    await db.commit()
    return {"message": "会员删除成功"}