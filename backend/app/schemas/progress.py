# -*- coding: utf-8 -*-
"""
学习进度相关的Pydantic模式
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# 学习进度基础模式
class ProgressBase(BaseModel):
    user_id: int
    course_id: int
    knowledge_point_id: int
    last_study_mode: str  # 'chinese_to_english', 'dictation', 'listening', 'speaking'


# 学习进度基础模式（别名）
class LearningProgressBase(ProgressBase):
    pass


# 创建学习进度时的属性
class ProgressCreate(ProgressBase):
    pass


# 创建学习进度时的属性（别名）
class LearningProgressCreate(ProgressCreate):
    pass


# 更新学习进度时的属性
class ProgressUpdate(BaseModel):
    knowledge_point_id: Optional[int] = None
    last_study_mode: Optional[str] = None


# 更新学习进度时的属性（别名）
class LearningProgressUpdate(ProgressUpdate):
    pass


# 数据库中的学习进度
class ProgressInDB(ProgressBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# 数据库中的学习进度（别名）
class LearningProgressInDB(ProgressInDB):
    pass


# API响应中的学习进度
class ProgressResponse(ProgressBase):
    id: int
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# API响应中的学习进度（别名）
class LearningProgress(ProgressResponse):
    pass