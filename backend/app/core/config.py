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
        # 为 Pydantic v1 创建兼容的 field_validator
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
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800
    DB_MAX_CONNECTIONS: int = 100
    DB_ECHO: bool = False  # 生产环境关闭SQL日志
    
    # MongoDB配置
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "globallink"
    
    # Redis配置
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    REDIS_MAX_CONNECTIONS: int = 100
    REDIS_CACHE_EXPIRE_SECONDS: int = 3600  # 默认缓存过期时间
    
    # 邮件服务配置
    MAIL_SERVER: str = "smtp.example.com"
    MAIL_PORT: int = 587
    MAIL_USE_TLS: bool = True
    MAIL_USERNAME: str = "your_email@example.com"
    MAIL_PASSWORD: str = "your_email_password"
    MAIL_FROM: EmailStr = "your_email@example.com"
    MAIL_FROM_NAME: str = "GlobalLink"
    
    # 验证码配置
    VERIFICATION_CODE_EXPIRE_MINUTES: int = 10  # 验证码有效期（分钟）
    VERIFICATION_CODE_LENGTH: int = 6  # 验证码长度

    # 错误通知配置
    ERROR_NOTIFICATION_RECIPIENTS: list[EmailStr] = ["15010993510@163.com"]  # 错误邮件通知接收邮箱列表
    ERROR_NOTIFICATION_ENABLED: bool = True  # 是否启用错误邮件通知功能

    @field_validator("ERROR_NOTIFICATION_RECIPIENTS", mode="before")
    @classmethod
    def assemble_error_recipients(cls, v: str | list[str]) -> list[str] | str:
        """解析错误通知接收邮箱列表，支持逗号分隔的字符串"""
        if isinstance(v, str) and not v.startswith("["):
            return [email.strip() for email in v.split(",") if email.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | None, values: dict[str, Any] = None) -> Any:
        if isinstance(v, str):
            return v
        # 如果没有提供URI，使用PostgreSQL数据库
        if values is None:
            values = {}
        return f"postgresql://{values.get('POSTGRES_USER', 'postgres')}:{values.get('POSTGRES_PASSWORD', 'password')}@{values.get('POSTGRES_SERVER', 'localhost')}/{values.get('POSTGRES_DB', 'globallink')}"

    # 微信支付配置
    WECHAT_APP_ID: str = "your_wechat_app_id"
    WECHAT_MCH_ID: str = "your_wechat_mch_id"
    WECHAT_API_KEY: str = "your_wechat_api_key"
    
    # 推广返利比例 (50%)
    REFERRAL_RATE: float = 0.5
    
    # 会员价格
    MONTHLY_MEMBERSHIP_PRICE: float = 29.9
    YEARLY_MEMBERSHIP_PRICE: float = 299.0
    
    # 高可用配置
    RATE_LIMIT_REQUESTS: int = 100  # 每分钟请求限制
    RATE_LIMIT_WINDOW: int = 60  # 限流窗口（秒）
    JWT_ALGORITHM: str = "HS256"  # JWT算法
    TOKEN_CACHE_EXPIRE_SECONDS: int = 60 * 60 * 24 * 7  # Token缓存过期时间（7天）
    REFRESH_TOKEN_CACHE_EXPIRE_SECONDS: int = 60 * 60 * 24 * 30  # 刷新令牌缓存过期时间（30天）
    
    # 前端密码加密验证配置
    EXPECTED_DOMAIN: str = "http://localhost:3080"  # 预期域名，用于前端密码加密验证
    
    # 管理后台配置
    ADMIN_USERNAME: str = "admin"  # 管理员用户名
    ADMIN_PASSWORD: str = "admin"  # 管理员密码

    model_config = {
        "case_sensitive": True,
        "env_file": ".env"
    }


settings = Settings()