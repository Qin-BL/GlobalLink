# -*- coding: utf-8 -*-
"""
课程管理端点
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
import time
import hashlib

from ...api.deps import get_current_active_user
from ...db.session import get_async_db
from ...models import User, Course
from ...schemas import CourseCreate, CourseUpdate, CourseResponse
from ...utils.redis_cache import get_json_cache, set_json_cache, delete_cache, clear_pattern_cache
from ...utils.async_logger import log_activity

router = APIRouter()

# 缓存相关配置
COURSE_CACHE_TTL = 3600  # 缓存有效期，单位秒
COURSE_LIST_CACHE_KEY = "courses:list"
COURSE_DETAIL_CACHE_KEY_PREFIX = "courses:detail:"

@router.get("/", response_model=List[CourseResponse])
async def get_courses(
    db: AsyncSession = Depends(get_async_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    response: Response = None,
) -> Any:
    """
    获取课程列表（带缓存）
    """
    # 生成缓存键，包含分页参数
    cache_key = f"{COURSE_LIST_CACHE_KEY}:{skip}:{limit}"
    
    # 尝试从缓存获取
    start_time = time.time()
    cached_courses = await get_json_cache(cache_key)
    if cached_courses:
        # 记录缓存命中日志
        process_time = time.time() - start_time
        await log_activity(
            user_id=current_user.id,
            activity_type="COURSE_LIST_CACHE_HIT",
            details={
                "skip": skip,
                "limit": limit,
                "response_time": round(process_time * 1000, 2),
                "cache_key": cache_key
            }
        )
        # 设置缓存命中响应头
        if response:
            response.headers["X-Cache-Status"] = "HIT"
        return cached_courses
    
    # 缓存未命中，从数据库查询
    result = await db.execute(select(Course).offset(skip).limit(limit))
    courses = result.scalars().all()
    
    # 序列化课程数据以便缓存
    courses_data = [CourseResponse.model_validate(course).model_dump() for course in courses]
    
    # 缓存结果
    await set_json_cache(cache_key, courses_data, COURSE_CACHE_TTL)
    
    # 记录缓存未命中日志
    process_time = time.time() - start_time
    await log_activity(
        user_id=current_user.id,
        activity_type="COURSE_LIST_CACHE_MISS",
        details={
            "skip": skip,
            "limit": limit,
            "response_time": round(process_time * 1000, 2),
            "cache_key": cache_key
        }
    )
    
    # 设置缓存未命中响应头
    if response:
        response.headers["X-Cache-Status"] = "MISS"
    
    return courses

@router.post("/", response_model=CourseResponse)
async def create_course(
    *,
    db: AsyncSession = Depends(get_async_db),
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
    
    # 清除相关缓存
    await clear_pattern_cache(f"{COURSE_LIST_CACHE_KEY}:*")
    
    # 记录创建课程日志
    await log_activity(
        user_id=current_user.id,
        activity_type="COURSE_CREATE",
        details={
            "course_id": course.id,
            "course_name": course.name
        }
    )
    
    return course

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    *,
    db: AsyncSession = Depends(get_async_db),
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    response: Response = None,
) -> Any:
    """
    获取特定课程（带缓存）
    """
    # 生成缓存键
    cache_key = f"{COURSE_DETAIL_CACHE_KEY_PREFIX}{course_id}"
    
    # 尝试从缓存获取
    start_time = time.time()
    cached_course = await get_json_cache(cache_key)
    if cached_course:
        # 记录缓存命中日志
        process_time = time.time() - start_time
        await log_activity(
            user_id=current_user.id,
            activity_type="COURSE_DETAIL_CACHE_HIT",
            details={
                "course_id": course_id,
                "response_time": round(process_time * 1000, 2),
                "cache_key": cache_key
            }
        )
        # 设置缓存命中响应头
        if response:
            response.headers["X-Cache-Status"] = "HIT"
        return cached_course
    
    # 缓存未命中，从数据库查询
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    
    # 序列化课程数据以便缓存
    course_data = CourseResponse.model_validate(course).model_dump()
    
    # 缓存结果
    await set_json_cache(cache_key, course_data, COURSE_CACHE_TTL)
    
    # 记录缓存未命中日志
    process_time = time.time() - start_time
    await log_activity(
        user_id=current_user.id,
        activity_type="COURSE_DETAIL_CACHE_MISS",
        details={
            "course_id": course_id,
            "response_time": round(process_time * 1000, 2),
            "cache_key": cache_key
        }
    )
    
    # 设置缓存未命中响应头
    if response:
        response.headers["X-Cache-Status"] = "MISS"
    
    return course

@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    *,
    db: AsyncSession = Depends(get_async_db),
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
    
    # 记录更新前的信息
    old_name = course.name
    
    update_data = course_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)
    
    db.add(course)
    await db.commit()
    await db.refresh(course)
    
    # 清除相关缓存
    await clear_pattern_cache(f"{COURSE_LIST_CACHE_KEY}:*")
    await delete_cache(f"{COURSE_DETAIL_CACHE_KEY_PREFIX}{course_id}")
    
    # 记录更新课程日志
    await log_activity(
        user_id=current_user.id,
        activity_type="COURSE_UPDATE",
        details={
            "course_id": course.id,
            "old_name": old_name,
            "new_name": course.name,
            "updated_fields": list(update_data.keys())
        }
    )
    
    return course

@router.delete("/{course_id}")
async def delete_course(
    *,
    db: AsyncSession = Depends(get_async_db),
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
    
    # 记录删除前的信息
    course_name = course.name
    
    await db.delete(course)
    await db.commit()
    
    # 清除相关缓存
    await clear_pattern_cache(f"{COURSE_LIST_CACHE_KEY}:*")
    await delete_cache(f"{COURSE_DETAIL_CACHE_KEY_PREFIX}{course_id}")
    
    # 记录删除课程日志
    await log_activity(
        user_id=current_user.id,
        activity_type="COURSE_DELETE",
        details={
            "course_id": course_id,
            "course_name": course_name
        }
    )
    
    return {"message": "课程删除成功"}