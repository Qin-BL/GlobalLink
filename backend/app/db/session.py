# -*- coding: utf-8 -*-
"""
数据库会话管理
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import redis
import logging
from functools import lru_cache
from typing import Generator, AsyncGenerator

from ..core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# 同步PostgreSQL连接
def create_database_engine():
    """创建同步数据库引擎"""
    # PostgreSQL默认端口为5432
    postgres_port = getattr(settings, 'POSTGRES_PORT', 5432)
    db_uri = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{postgres_port}/{settings.POSTGRES_DB}"
    return create_engine(db_uri, pool_pre_ping=True)

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
    # PostgreSQL默认端口为5432
    postgres_port = getattr(settings, 'POSTGRES_PORT', 5432)
    db_uri = f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{postgres_port}/{settings.POSTGRES_DB}"
    engine_kwargs = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 5,
        "max_overflow": 10,
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