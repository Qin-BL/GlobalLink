# -*- coding: utf-8 -*-
"""
会员和支付相关模型
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .base import Base


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    membership_type = Column(String(20), nullable=False)  # 'monthly' or 'yearly'
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Float, nullable=False)
    payment_type = Column(String(20), nullable=False)  # 'monthly' or 'yearly'
    transaction_id = Column(String(100), unique=True, nullable=True)
    status = Column(String(20), nullable=False)  # 'pending', 'completed', 'failed'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Reward(Base):
    __tablename__ = "rewards"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Float, nullable=False)
    source = Column(String(50), nullable=False)  # 'referral'
    related_payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    related_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 被推广的用户ID
    status = Column(String(20), nullable=False)  # 'pending', 'available', 'withdrawn'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Withdrawal(Base):
    __tablename__ = "withdrawals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False)  # 'pending', 'completed', 'failed'
    payment_method = Column(String(50), nullable=False)  # 'wechat', 'alipay', 'bank'
    account_info = Column(String(255), nullable=False)  # 支付账号信息
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
