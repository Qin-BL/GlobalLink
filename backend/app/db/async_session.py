"""
异步数据库会话管理
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import QueuePool
import redis.asyncio as aioredis
import logging
from functools import lru_cache
from typing import AsyncGenerator

from ..core.config import settings

logger = logging.getLogger(__name__)

# 异步Redis连接池
async_redis_pool = aioredis.ConnectionPool(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
    max_connections=settings.REDIS_MAX_CONNECTIONS,
    decode_responses=True
)

@lru_cache()
def get_async_redis_connection():
    return aioredis.Redis(connection_pool=async_redis_pool)

# 异步SQLAlchemy数据库连接
def create_async_database_engine():
    """创建异步数据库引擎"""
    # 构建异步数据库URI
    if settings.SQLALCHEMY_DATABASE_URI:
        db_uri = str(settings.SQLALCHEMY_DATABASE_URI)
        # 将同步URI转换为异步URI
        if db_uri.startswith("postgresql://"):
            db_uri = db_uri.replace("postgresql://", "postgresql+asyncpg://")
    else:
        db_uri = f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    
    engine_kwargs = {
        "pool_pre_ping": True,
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "echo": settings.DB_ECHO,
        "future": True,  # 使用SQLAlchemy 2.0风格
    }
    
    # PostgreSQL特定配置
    engine_kwargs.update({
        "poolclass": QueuePool,
        "connect_args": {
            "server_settings": {
                "application_name": settings.PROJECT_NAME,
                "timezone": "Asia/Shanghai"
            }
        }
    })
    
    return create_async_engine(db_uri, **engine_kwargs)

async_engine = create_async_database_engine()

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """获取异步数据库会话"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def get_async_redis():
    """获取异步Redis连接"""
    return get_async_redis_connection()