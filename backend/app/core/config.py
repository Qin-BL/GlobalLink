import secrets
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, PostgresDsn, validator, EmailStr
from pydantic import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    # BACKEND_CORS_ORIGINS is a JSON-formatted list of origins
    # e.g: ["http://localhost", "http://localhost:4200", "http://localhost:3000"]
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3080",
        "http://localhost:8000",
        "http://localhost",
    ]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    PROJECT_NAME: str = "GlobalLink"
    
    # 数据库配置
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "globallink"
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None
    
    # 数据库连接池配置
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800
    DB_MAX_CONNECTIONS: int = 100
    
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

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        # 使用pydantic v2的新API构建URL
        user = values.get("POSTGRES_USER")
        password = values.get("POSTGRES_PASSWORD")
        host = values.get("POSTGRES_SERVER")
        db = values.get('POSTGRES_DB') or ''
        return f"postgresql://{user}:{password}@{host}/{db}"

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

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()