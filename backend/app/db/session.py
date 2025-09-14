# -*- coding: utf-8 -*-
"""
数据库会话管理
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import redis
import logging
from functools import lru_cache
from typing import AsyncGenerator

from ..core.config import settings
from .base import Base

logger = logging.getLogger(__name__)

# 异步PostgreSQL连接
def create_async_database_engine():
    """创建异步数据库引擎"""
    # 为异步连接构建包含编码后密码的URI
    import urllib.parse
    encoded_password = urllib.parse.quote(settings.POSTGRES_PASSWORD, safe='')
    db_uri = f"postgresql+asyncpg://{settings.POSTGRES_USER}:{encoded_password}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    engine_kwargs = {
        "pool_pre_ping": settings.DB_POOL_PRE_PING,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_POOL_MAX_OVERFLOW,
    }
    return create_async_engine(db_uri, **engine_kwargs)

# 只有在需要时才创建异步引擎
try:
    async_engine = create_async_database_engine()
    AsyncSessionLocal = sessionmaker(
        bind=async_engine,
        class_=AsyncSession,
        autocommit=False,
        autoflush=False,
    )
except ImportError:
    # 如果asyncpg不可用，设置为None
    async_engine = None
    AsyncSessionLocal = None

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """获取异步数据库会话"""
    if AsyncSessionLocal is None:
        raise RuntimeError("异步数据库会话不可用，请安装asyncpg")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Redis连接
import redis.asyncio as aioredis

# 全局Redis客户端实例
_redis_client = None

async def get_redis():
    """获取异步Redis连接"""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = aioredis.Redis(
                host=settings.REDIS_HOST, 
                port=settings.REDIS_PORT, 
                db=settings.REDIS_DB, 
                decode_responses=True
            )
            # 测试连接
            await _redis_client.ping()
            logger.info("✅ Redis连接成功")
        except Exception as e:
            logger.error(f"❌ Redis连接失败: {e}")
            # 即使连接失败，也返回客户端对象，让上层处理错误
    return _redis_client