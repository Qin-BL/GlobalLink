# -*- coding: utf-8 -*-
"""
学习进度管理端点
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...api.deps import get_current_active_user, get_db
from ...models import User, Progress
from ...schemas import ProgressCreate, ProgressUpdate, ProgressResponse

router = APIRouter()

@router.get("/", response_model=List[ProgressResponse])
async def get_progress_list(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取学习进度列表
    """
    result = await db.execute(
        select(Progress).where(Progress.user_id == current_user.id).offset(skip).limit(limit)
    )
    progress_list = result.scalars().all()
    return progress_list

@router.post("/", response_model=ProgressResponse)
async def create_progress(
    *,
    db: AsyncSession = Depends(get_db),
    progress_in: ProgressCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    创建学习进度记录
    """
    progress_data = progress_in.model_dump()
    progress_data["user_id"] = current_user.id
    progress = Progress(**progress_data)
    db.add(progress)
    await db.commit()
    await db.refresh(progress)
    return progress

@router.get("/{progress_id}", response_model=ProgressResponse)
async def get_progress(
    *,
    db: AsyncSession = Depends(get_db),
    progress_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取特定学习进度
    """
    result = await db.execute(
        select(Progress).where(
            Progress.id == progress_id,
            Progress.user_id == current_user.id
        )
    )
    progress = result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="学习进度不存在")
    return progress

@router.put("/{progress_id}", response_model=ProgressResponse)
async def update_progress(
    *,
    db: AsyncSession = Depends(get_db),
    progress_id: int,
    progress_in: ProgressUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    更新学习进度
    """
    result = await db.execute(
        select(Progress).where(
            Progress.id == progress_id,
            Progress.user_id == current_user.id
        )
    )
    progress = result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="学习进度不存在")
    
    update_data = progress_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(progress, field, value)
    
    db.add(progress)
    await db.commit()
    await db.refresh(progress)
    return progress

@router.delete("/{progress_id}")
async def delete_progress(
    *,
    db: AsyncSession = Depends(get_db),
    progress_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    删除学习进度
    """
    result = await db.execute(
        select(Progress).where(
            Progress.id == progress_id,
            Progress.user_id == current_user.id
        )
    )
    progress = result.scalar_one_or_none()
    if not progress:
        raise HTTPException(status_code=404, detail="学习进度不存在")
    
    await db.delete(progress)
    await db.commit()
    return {"message": "学习进度删除成功"}