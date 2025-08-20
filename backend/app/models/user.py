from sqlalchemy import Boolean, Column, String, DateTime, Float, Integer
from sqlalchemy.sql import func

from app.models.base import BaseModel


class User(BaseModel):
    __tablename__ = "users"

    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # 用户角色: user, admin
    role = Column(String, default="user")
    
    # 推广码
    referral_code = Column(String, unique=True, index=True, nullable=True)
    
    # 推广人ID
    referrer_id = Column(Integer, nullable=True)
    
    # 奖励金余额
    reward_balance = Column(Float, default=0.0)