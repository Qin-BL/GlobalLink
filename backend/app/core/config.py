# -*- coding: utf-8 -*-
import secrets
from typing import Any, List, Union
import os
import json

# 兼容不同版本的pydantic
try:
    from pydantic_settings import BaseSettings
    from pydantic import field_validator
    PYDANTIC_V2 = True
except ImportError:
    try:
        from pydantic import BaseSettings, validator
        PYDANTIC_V2 = False
    except ImportError:
        # 如果都没有，创建一个简单的基类
        class BaseSettings:
            def __init__(self, **kwargs):
                for key, value in kwargs.items():
                    setattr(self, key, value)
        PYDANTIC_V2 = False


class Settings(BaseSettings):
    # 应用基础配置
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "GlobalLink"
    VERSION: str = "2.0.0"
    DEBUG: bool = False
    
    # 安全配置
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 缩短访问令牌有效期提高安全性
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 缩短刷新令牌有效期
    JWT_ALGORITHM: str = "HS256"
    
    # 允许的主机（安全配置）
    ALLOWED_HOSTS: Union[str, List[str]] = ["localhost", "127.0.0.1", "*.globallink.com"]
    
    # CORS配置
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://localhost:3080",
        "http://localhost:8000",
        "http://localhost",
    ]

    # 数据库配置
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "globallink"
    POSTGRES_PASSWORD: str = "globallink_password"
    POSTGRES_DB: str = "globallink"
    POSTGRES_PORT: int = 5432
    SQLALCHEMY_DATABASE_URI: Union[str, None] = None

    # 数据库连接池配置
    DB_POOL_PRE_PING: bool = True
    DB_POOL_RECYCLE: int = 300  # 连接回收时间（秒）
    DB_POOL_SIZE: int = 5      # 连接池大小
    DB_POOL_MAX_OVERFLOW: int = 10  # 连接池溢出最大值
    DB_POOL_TIMEOUT: int = 30  # 连接池获取连接的超时时间（秒）
    
    # Redis配置
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: Union[str, None] = None
    
    # 邮件配置
    MAIL_SERVER: str = "smtp.example.com"
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_USE_TLS: bool = True
    MAIL_FROM: str = "noreply@globallink.com"
    MAIL_FROM_NAME: str = "GlobalLink"
    
    # 前端地址配置
    FRONTEND_HOST: str = "http://localhost:3080"
    
    # 错误通知配置
    ERROR_NOTIFICATION_RECIPIENTS: str = ""
    ERROR_NOTIFICATION_ENABLED: bool = False
    
    # 邮件令牌过期时间配置
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 1  # 密码重置令牌有效期（小时）
    
    # 前端密码加密验证配置
    EXPECTED_DOMAIN: str = "http://localhost:3080"  # 预期域名，用于前端密码加密验证
    
    # 管理后台配置
    ADMIN_USERNAME: str = "admin"  # 管理员用户名
    ADMIN_PASSWORD: str = "admin"  # 管理员密码

    # 微信支付配置
    WECHAT_APP_ID: str = ""
    WECHAT_MCH_ID: str = ""
    WECHAT_API_KEY: str = ""

    # 推广配置
    REFERRAL_RATE: float = 0.5

    # 会员价格配置
    MONTHLY_MEMBERSHIP_PRICE: float = 29.9
    YEARLY_MEMBERSHIP_PRICE: float = 299.0

    # 日志系统配置
    # 异步日志记录开关
    ASYNC_LOGGING_ENABLED: bool = True
    # 批量写入配置
    LOG_BATCH_SIZE: int = 50  # 批量写入的日志数量阈值
    LOG_FLUSH_INTERVAL: int = 5  # 日志刷新间隔（秒）
    # 日志级别控制
    LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    # 各类型日志的记录级别
    SYSTEM_LOG_LEVEL: str = "WARNING"  # 系统日志记录级别
    API_LOG_LEVEL: str = "INFO"  # API日志记录级别
    ACTIVITY_LOG_LEVEL: str = "INFO"  # 用户活动日志记录级别
    
    # 额外的日志配置字段
    TABLE_NAME_LOGS: str = "system_logs"  # 日志表名
    ENABLE_ACTIVITY_LOGGING: bool = True  # 启用活动日志记录

    # 添加字段验证器来处理列表类型的环境变量
    if PYDANTIC_V2:
        @field_validator("BACKEND_CORS_ORIGINS", "ALLOWED_HOSTS", mode="before")
        @classmethod
        def parse_list_config(cls, value: Union[str, List[str]]) -> List[str]:
            """解析列表配置，支持字符串和列表格式"""
            if isinstance(value, str):
                # 移除引号
                value = value.strip('"\'')
                # 如果是字符串，先尝试解析为JSON列表
                if value.startswith('[') and value.endswith(']'):
                    try:
                        return json.loads(value)
                    except json.JSONDecodeError:
                        # 如果JSON解析失败，按逗号分隔处理
                        return [i.strip() for i in value.split(',')]
                else:
                    # 普通字符串按逗号分隔处理
                    return [i.strip() for i in value.split(',') if i.strip()]
            elif isinstance(value, list):
                # 已经是列表，直接返回
                return value
            return []

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # 如果不是 Pydantic V2，手动处理列表配置
        if not PYDANTIC_V2:
            self.BACKEND_CORS_ORIGINS = self._parse_list_config(self.BACKEND_CORS_ORIGINS)
            self.ALLOWED_HOSTS = self._parse_list_config(self.ALLOWED_HOSTS)
        
        # 构建数据库连接字符串
        if not self.SQLALCHEMY_DATABASE_URI:
            self.SQLALCHEMY_DATABASE_URI = f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
        # 构建Redis连接字符串
        if not self.REDIS_URL:
            self.REDIS_URL = f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    def _parse_list_config(self, value: Union[str, List[str]]) -> List[str]:
        """解析列表配置，支持字符串和列表格式（用于非 Pydantic V2）"""
        if isinstance(value, str):
            # 移除引号
            value = value.strip('"\'')
            # 如果是字符串，先尝试解析为JSON列表
            if value.startswith('[') and value.endswith(']'):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    # 如果JSON解析失败，按逗号分隔处理
                    return [i.strip() for i in value.split(',')]
            else:
                # 普通字符串按逗号分隔处理
                return [i.strip() for i in value.split(',') if i.strip()]
        elif isinstance(value, list):
            # 已经是列表，直接返回
            return value
        return []

    if PYDANTIC_V2:
        model_config = {
            "case_sensitive": True,
            "env_file": ".env",
            "extra": "ignore"  # 忽略额外的字段
        }
    else:
        class Config:
            case_sensitive = True
            env_file = ".env"
            extra = "ignore"  # 忽略额外的字段


settings = Settings()