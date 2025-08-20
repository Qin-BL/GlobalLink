from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.sql import func

from app.models.base import BaseModel


class Membership(BaseModel):
    __tablename__ = "memberships"

    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    membership_type = Column(String, nullable=False)  # 'monthly' or 'yearly'
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    

class Payment(BaseModel):
    __tablename__ = "payments"
    
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Float, nullable=False)
    payment_type = Column(String, nullable=False)  # 'monthly' or 'yearly'
    transaction_id = Column(String, unique=True, nullable=True)
    status = Column(String, nullable=False)  # 'pending', 'completed', 'failed'
    

class Reward(BaseModel):
    __tablename__ = "rewards"
    
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Float, nullable=False)
    source = Column(String, nullable=False)  # 'referral'
    related_payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    related_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 被推广的用户ID
    status = Column(String, nullable=False)  # 'pending', 'available', 'withdrawn'
    

class Withdrawal(BaseModel):
    __tablename__ = "withdrawals"
    
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # 'pending', 'completed', 'failed'
    payment_method = Column(String, nullable=False)  # 'wechat', 'alipay', 'bank'
    account_info = Column(String, nullable=False)  # 支付账号信息