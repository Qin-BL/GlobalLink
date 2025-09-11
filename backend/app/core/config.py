# -*- coding: utf-8 -*-
import secrets
from typing import Any
from pydantic import AnyHttpUrl, EmailStr, Field

# 兼容不同版本的pydantic
try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        # 如果都没有，创建一个简单的基类
        class BaseSettings:
            def __init__(self, **kwargs):
                for key, value in kwargs.items():
                    setattr(self, key, value)

# 兼容不同版本的pydantic validator
try:
    from pydantic import field_validator
    PYDANTIC_V2 = True
except ImportError:
    try:
        from pydantic import validator
        PYDANTIC_V2 = False
        # 为Pydantic v1 创建兼容的field_validator
        def field_validator(field_name, mode="before"):
            def decorator(func):
                if mode == "before":
                    return validator(field_name, pre=True, allow_reuse=True)(func)
                else:
                    return validator(field_name, allow_reuse=True)(func)
            return decorator
    except ImportError:
        # 如果都没有，创建一个简单的装饰器
        PYDANTIC_V2 = False
        def field_validator(field_name, mode="before"):
            def decorator(func):
                return func
            return decorator


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
    ALLOWED_HOSTS: list[str] = ["localhost", "127.0.0.1", "*.globallink.com"]
    
    # CORS配置
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3080",
        "http://localhost:8000",
        "http://localhost",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str] | str:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # 数据库配置
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "globallink_user"
    POSTGRES_PASSWORD: str = "globallink_password"
    POSTGRES_DB: str = "globallink"
    POSTGRES_PORT: int = 5432
    SQLALCHEMY_DATABASE_URI: str | None = None

    # 数据库连接池配置
    DB_POOL_PRE_PING: bool = True
    DB_POOL_RECYCLE: int = 300  # 连接回收时间（秒）
    DB_POOL_SIZE: int = 5      # 连接池大小
    DB_POOL_MAX_OVERFLOW: int = 10  # 连接池溢出最大值
    DB_POOL_TIMEOUT: int = 30  # 连接池获取连接的超时时间（秒）

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | None, values: dict[str, Any]) -> str:
        if isinstance(v, str):
            return v
        return f"postgresql://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_SERVER')}/{values.get('POSTGRES_DB')}"
    
    # Redis配置
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: str | None = None
    
    @field_validator("REDIS_URL", mode="before")
    @classmethod
    def assemble_redis_url(cls, v: str | None, values: dict[str, Any]) -> str:
        if isinstance(v, str):
            return v
        return f"redis://{values.get('REDIS_HOST')}:{values.get('REDIS_PORT')}/{values.get('REDIS_DB')}"
    
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

    # MAIL_SSL_TLS会根据MAIL_PORT自动设置
    # 当MAIL_PORT=465时，MAIL_SSL_TLS=True
    # 当MAIL_PORT=587时，MAIL_SSL_TLS=False

    model_config = {
        "case_sensitive": True,
        "env_file": ".env"
    }


settings = Settings()
