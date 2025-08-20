from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps

router = APIRouter()


@router.get("/", response_model=List[schemas.LearningProgress])
def read_progress(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取用户的所有学习进度"""
    progress = (
        db.query(models.LearningProgress)
        .filter(models.LearningProgress.user_id == current_user.id)
        .all()
    )
    return progress


@router.get("/course/{course_id}", response_model=schemas.LearningProgress)
def read_course_progress(
    *,
    db: Session = Depends(deps.get_db),
    course_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取用户特定课程的学习进度"""
    progress = (
        db.query(models.LearningProgress)
        .filter(
            models.LearningProgress.user_id == current_user.id,
            models.LearningProgress.course_id == course_id
        )
        .first()
    )
    
    if not progress:
        raise HTTPException(status_code=404, detail="未找到学习进度")
    
    return progress


@router.post("/", response_model=schemas.LearningProgress)
def create_or_update_progress(
    *,
    db: Session = Depends(deps.get_db),
    progress_in: schemas.LearningProgressCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """创建或更新学习进度"""
    # 确保用户只能更新自己的进度
    if progress_in.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只能更新自己的学习进度",
        )
    
    # 检查课程是否存在
    course = db.query(models.Course).filter(models.Course.id == progress_in.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    
    # 检查知识点是否存在
    knowledge_point = (
        db.query(models.KnowledgePoint)
        .filter(
            models.KnowledgePoint.id == progress_in.knowledge_point_id,
            models.KnowledgePoint.course_id == progress_in.course_id
        )
        .first()
    )
    if not knowledge_point:
        raise HTTPException(status_code=404, detail="知识点不存在")
    
    # 检查用户是否有权限访问该课程
    if not course.is_free:
        # 检查用户是否是会员
        membership = deps.check_user_membership(db, current_user.id)
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="需要会员才能访问此课程",
            )
    
    # 查找现有进度
    progress = (
        db.query(models.LearningProgress)
        .filter(
            models.LearningProgress.user_id == current_user.id,
            models.LearningProgress.course_id == progress_in.course_id
        )
        .first()
    )
    
    # 如果存在，更新进度
    if progress:
        progress.knowledge_point_id = progress_in.knowledge_point_id
        progress.last_study_mode = progress_in.last_study_mode
    # 否则，创建新进度
    else:
        progress = models.LearningProgress(
            user_id=current_user.id,
            course_id=progress_in.course_id,
            knowledge_point_id=progress_in.knowledge_point_id,
            last_study_mode=progress_in.last_study_mode
        )
        db.add(progress)
    
    db.commit()
    db.refresh(progress)
    return progress


@router.put("/reset/{course_id}", response_model=schemas.LearningProgress)
def reset_progress(
    *,
    db: Session = Depends(deps.get_db),
    course_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """重置特定课程的学习进度"""
    # 检查课程是否存在
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    
    # 查找现有进度
    progress = (
        db.query(models.LearningProgress)
        .filter(
            models.LearningProgress.user_id == current_user.id,
            models.LearningProgress.course_id == course_id
        )
        .first()
    )
    
    if not progress:
        raise HTTPException(status_code=404, detail="未找到学习进度")
    
    # 获取课程的第一个知识点
    first_knowledge_point = (
        db.query(models.KnowledgePoint)
        .filter(models.KnowledgePoint.course_id == course_id)
        .order_by(models.KnowledgePoint.point_order)
        .first()
    )
    
    if not first_knowledge_point:
        raise HTTPException(status_code=404, detail="课程没有知识点")
    
    # 重置进度到第一个知识点
    progress.knowledge_point_id = first_knowledge_point.id
    # 保持学习模式不变
    
    db.commit()
    db.refresh(progress)
    return progress