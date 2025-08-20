from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


# 知识点基础模式
class KnowledgePointBase(BaseModel):
    point_order: int
    chinese: str
    english: str
    soundmark: str


# 创建知识点时的属性
class KnowledgePointCreate(KnowledgePointBase):
    course_id: int


# 数据库中的知识点
class KnowledgePointInDB(KnowledgePointBase):
    id: int
    course_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True


# API响应中的知识点
class KnowledgePoint(KnowledgePointBase):
    id: int
    
    class Config:
        orm_mode = True


# 课程基础模式
class CourseBase(BaseModel):
    course_number: int
    title: str
    description: Optional[str] = None
    is_free: bool = False


# 创建课程时的属性
class CourseCreate(CourseBase):
    pass


# 更新课程时的属性
class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_free: Optional[bool] = None


# 数据库中的课程
class CourseInDB(CourseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True


# API响应中的课程
class Course(CourseBase):
    id: int
    
    class Config:
        orm_mode = True


# 带知识点的课程
class CourseWithKnowledgePoints(Course):
    knowledge_points: List[KnowledgePoint] = []
    
    class Config:
        orm_mode = True