"""
课程管理端点
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...api.deps import get_current_active_user, get_db
from ...models import User, Course
from ...schemas import CourseCreate, CourseUpdate, CourseResponse

router = APIRouter()

@router.get("/", response_model=List[CourseResponse])
async def get_courses(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取课程列表
    """
    result = await db.execute(select(Course).offset(skip).limit(limit))
    courses = result.scalars().all()
    return courses

@router.post("/", response_model=CourseResponse)
async def create_course(
    *,
    db: AsyncSession = Depends(get_db),
    course_in: CourseCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    创建新课程
    """
    course = Course(**course_in.model_dump())
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    *,
    db: AsyncSession = Depends(get_db),
    course_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取特定课程
    """
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    return course

@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    *,
    db: AsyncSession = Depends(get_db),
    course_id: int,
    course_in: CourseUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    更新课程
    """
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    
    update_data = course_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)
    
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course

@router.delete("/{course_id}")
async def delete_course(
    *,
    db: AsyncSession = Depends(get_db),
    course_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    删除课程
    """
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    
    await db.delete(course)
    await db.commit()
    return {"message": "课程删除成功"}