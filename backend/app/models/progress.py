from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class LearningProgress(BaseModel):
    __tablename__ = "learning_progress"

    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), index=True)
    knowledge_point_id = Column(Integer, ForeignKey("knowledge_points.id"), index=True)
    last_study_mode = Column(String, nullable=False)  # 'chinese_to_english', 'dictation', 'listening', 'speaking'