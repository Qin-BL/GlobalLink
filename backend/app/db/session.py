# -*- coding: utf-8 -*-
"""
数据库会话管理
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import redis
import logging
from functools import lru_cache
from typing import Generator, AsyncGenerator

from ..core.config import settings
from .base import Base

logger = logging.getLogger(__name__)

# 同步PostgreSQL连接
def create_database_engine():
    """创建同步数据库引擎"""
    # 使用settings中的SQLALCHEMY_DATABASE_URI，其中已经包含了编码后的密码
    engine_kwargs = {
        "pool_pre_ping": settings.DB_POOL_PRE_PING,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_POOL_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
    }
    return create_engine(settings.SQLALCHEMY_DATABASE_URI, **engine_kwargs)

engine = create_database_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator:
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

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
@lru_cache()
def get_redis():
    """获取Redis连接"""
    return redis.Redis(
        host=settings.REDIS_HOST, 
        port=settings.REDIS_PORT, 
        db=settings.REDIS_DB, 
        decode_responses=True
    )