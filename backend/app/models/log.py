# -*- coding: utf-8 -*-
"""
日志模型定义
"""
from sqlalchemy import Column, String, DateTime, Text, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid

from .base import Base


class SystemLog(Base):
    """系统日志模型"""
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    # 日志类型：api, activity, error, security等
    log_type = Column(String(50), nullable=False, index=True)
    
    # 日志级别：DEBUG, INFO, WARNING, ERROR, CRITICAL
    level = Column(String(20), nullable=False, default="INFO", index=True)
    
    # 日志消息
    message = Column(Text, nullable=False)
    
    # 详细数据（JSON格式）
    details = Column(JSON, nullable=True)
    
    # 用户ID（如果相关）
    user_id = Column(Integer, nullable=True, index=True)
    
    # IP地址
    ip_address = Column(String(45), nullable=True, index=True)
    
    # 用户代理
    user_agent = Column(Text, nullable=True)
    
    # 请求路径（API日志专用）
    request_path = Column(String(500), nullable=True, index=True)
    
    # HTTP方法（API日志专用）
    http_method = Column(String(10), nullable=True)
    
    # 响应状态码（API日志专用）
    status_code = Column(Integer, nullable=True, index=True)
    
    # 响应时间（毫秒）
    response_time = Column(Integer, nullable=True)
    
    # 会话ID
    session_id = Column(String(100), nullable=True, index=True)
    
    def __repr__(self) -> str:
        return f"<SystemLog(id={self.id}, type='{self.log_type}', level='{self.level}')>"


class UserActivity(Base):
    """用户活动日志模型"""
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False, index=True)
    
    # 活动类型：login, logout, course_view, course_purchase等
    activity_type = Column(String(50), nullable=False, index=True)
    
    # 活动描述
    description = Column(Text, nullable=False)
    
    # 活动详情（JSON格式）
    details = Column(JSON, nullable=True)
    
    # IP地址
    ip_address = Column(String(45), nullable=True, index=True)
    
    # 用户代理
    user_agent = Column(Text, nullable=True)
    
    # 会话ID
    session_id = Column(String(100), nullable=True, index=True)
    
    def __repr__(self) -> str:
        return f"<UserActivity(id={self.id}, user_id={self.user_id}, type='{self.activity_type}')>"


class ApiLog(Base):
    """API请求日志模型"""
    __tablename__ = "api_logs"

    id = Column(Integer, primary_key=True, index=True)

    # 请求路径
    path = Column(String(500), nullable=False, index=True)
    
    # HTTP方法
    method = Column(String(10), nullable=False, index=True)
    
    # 请求参数（JSON格式）
    request_data = Column(JSON, nullable=True)
    
    # 响应状态码
    status_code = Column(Integer, nullable=False, index=True)
    
    # 响应时间（毫秒）
    response_time = Column(Integer, nullable=True)
    
    # 用户ID（如果已认证）
    user_id = Column(Integer, nullable=True, index=True)
    
    # IP地址
    ip_address = Column(String(45), nullable=True, index=True)
    
    # 用户代理
    user_agent = Column(Text, nullable=True)
    
    # 错误信息（如果有）
    error_message = Column(Text, nullable=True)
    
    def __repr__(self) -> str:
        return f"<ApiLog(id={self.id}, method='{self.method}', path='{self.path}', status={self.status_code})>"
