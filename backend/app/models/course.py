from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Course(BaseModel):
    __tablename__ = "courses"

    course_number = Column(Integer, unique=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_free = Column(Boolean, default=False)
    
    # 关系
    knowledge_points = relationship("KnowledgePoint", back_populates="course")


class KnowledgePoint(BaseModel):
    __tablename__ = "knowledge_points"

    course_id = Column(Integer, ForeignKey("courses.id"), index=True)
    point_order = Column(Integer, nullable=False)  # 知识点在课程中的顺序
    chinese = Column(Text, nullable=False)
    english = Column(Text, nullable=False)
    soundmark = Column(Text, nullable=False)
    
    # 关系
    course = relationship("Course", back_populates="knowledge_points")