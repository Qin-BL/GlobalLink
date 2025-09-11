from sqlalchemy import Boolean, Column, String, DateTime, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship

from .base import BaseModel


class User(BaseModel):
    __tablename__ = "users"

    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # 推广码
    referral_code = Column(String(20), unique=True, index=True, nullable=True)
    
    # 推广人ID
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # 奖励金余额
    reward_balance = Column(Float, default=0.0, nullable=False)
    
    # 关系
    referrer = relationship("User", remote_side="User.id", back_populates="referred_users")
    referred_users = relationship("User", back_populates="referrer")
    
    @property
    def is_staff(self) -> bool:
        """是否为员工（管理员或超级用户）"""
        return self.is_admin or self.is_superuser
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"