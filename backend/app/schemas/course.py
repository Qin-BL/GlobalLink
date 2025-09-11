# -*- coding: utf-8 -*-
"""
课程相关的Pydantic模式
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


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
    
    model_config = ConfigDict(from_attributes=True)


# API响应中的知识点
class KnowledgePoint(KnowledgePointBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


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
    
    model_config = ConfigDict(from_attributes=True)


# API响应中的课程
class Course(CourseBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# 课程响应模式（别名）
class CourseResponse(Course):
    pass


# 带知识点的课程
class CourseWithKnowledgePoints(Course):
    knowledge_points: List[KnowledgePoint] = []
    
    model_config = ConfigDict(from_attributes=True)