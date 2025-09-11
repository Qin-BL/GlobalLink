# -*- coding: utf-8 -*-
"""
课程模型
"""
from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_number = Column(Integer, unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    is_free = Column(Boolean, default=False)
    
    # 关系
    knowledge_points = relationship("KnowledgePoint", back_populates="course")


class KnowledgePoint(Base):
    __tablename__ = "knowledge_points"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), index=True)
    point_order = Column(Integer, nullable=False)  # 知识点在课程中的顺序
    chinese = Column(Text, nullable=False)
    english = Column(Text, nullable=False)
    soundmark = Column(Text, nullable=False)
    
    # 关系
    course = relationship("Course", back_populates="knowledge_points")
