from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps

router = APIRouter()


@router.get("/", response_model=List[schemas.Course])
def read_courses(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取所有课程"""
    courses = db.query(models.Course).offset(skip).limit(limit).all()
    return courses


@router.get("/{course_id}", response_model=schemas.CourseWithKnowledgePoints)
def read_course(
    *,
    db: Session = Depends(deps.get_db),
    course_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取特定课程及其知识点"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    
    # 检查用户是否有权限访问该课程
    if not course.is_free:
        # 检查用户是否是会员
        membership = deps.check_user_membership(db, current_user.id)
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="需要会员才能访问此课程",
            )
    
    # 获取课程的知识点
    knowledge_points = (
        db.query(models.KnowledgePoint)
        .filter(models.KnowledgePoint.course_id == course_id)
        .order_by(models.KnowledgePoint.point_order)
        .all()
    )
    
    # 构建响应
    course_data = schemas.CourseWithKnowledgePoints.from_orm(course)
    course_data.knowledge_points = knowledge_points
    
    return course_data


@router.get("/{course_id}/knowledge-points", response_model=List[schemas.KnowledgePoint])
def read_course_knowledge_points(
    *,
    db: Session = Depends(deps.get_db),
    course_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取特定课程的所有知识点"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    
    # 检查用户是否有权限访问该课程
    if not course.is_free:
        # 检查用户是否是会员
        membership = deps.check_user_membership(db, current_user.id)
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="需要会员才能访问此课程",
            )
    
    # 获取课程的知识点
    knowledge_points = (
        db.query(models.KnowledgePoint)
        .filter(models.KnowledgePoint.course_id == course_id)
        .order_by(models.KnowledgePoint.point_order)
        .all()
    )
    
    return knowledge_points


@router.get("/{course_id}/knowledge-points/{point_id}", response_model=schemas.KnowledgePoint)
def read_knowledge_point(
    *,
    db: Session = Depends(deps.get_db),
    course_id: int,
    point_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取特定知识点"""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    
    # 检查用户是否有权限访问该课程
    if not course.is_free:
        # 检查用户是否是会员
        membership = deps.check_user_membership(db, current_user.id)
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="需要会员才能访问此课程",
            )
    
    # 获取知识点
    knowledge_point = (
        db.query(models.KnowledgePoint)
        .filter(
            models.KnowledgePoint.id == point_id,
            models.KnowledgePoint.course_id == course_id
        )
        .first()
    )
    
    if not knowledge_point:
        raise HTTPException(status_code=404, detail="知识点不存在")
    
    return knowledge_point