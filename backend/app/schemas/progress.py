from typing import Optional
from datetime import datetime
from pydantic import BaseModel


# 学习进度基础模式
class LearningProgressBase(BaseModel):
    user_id: int
    course_id: int
    knowledge_point_id: int
    last_study_mode: str  # 'chinese_to_english', 'dictation', 'listening', 'speaking'


# 创建学习进度时的属性
class LearningProgressCreate(LearningProgressBase):
    pass


# 更新学习进度时的属性
class LearningProgressUpdate(BaseModel):
    knowledge_point_id: Optional[int] = None
    last_study_mode: Optional[str] = None


# 数据库中的学习进度
class LearningProgressInDB(LearningProgressBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True


# API响应中的学习进度
class LearningProgress(LearningProgressBase):
    id: int
    updated_at: datetime
    
    class Config:
        orm_mode = True