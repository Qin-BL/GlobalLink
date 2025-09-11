from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import redis
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging
from functools import lru_cache
from collections.abc import Generator

from ..core.config import settings

logger = logging.getLogger(__name__)

# MongoDB连接（可选）
mongo_client = None
mongo_db = None
try:
    mongo_client = MongoClient(
        settings.MONGODB_URI,
        maxPoolSize=settings.DB_MAX_CONNECTIONS,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        retryWrites=True,
        w='majority'
    )
    # 测试连接
    mongo_client.admin.command('ping')
    mongo_db = mongo_client[settings.MONGODB_DB]
    logger.info("MongoDB连接成功")
except ConnectionFailure as e:
    logger.warning(f"MongoDB连接失败，将使用SQLite作为主数据库: {e}")
    mongo_client = None
    mongo_db = None

# Redis连接池
redis_pool = redis.ConnectionPool(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    password=settings.REDIS_PASSWORD,
    max_connections=settings.REDIS_MAX_CONNECTIONS,
    decode_responses=True
)

@lru_cache()
def get_redis_connection():
    return redis.Redis(connection_pool=redis_pool)

Base = declarative_base()

# SQLAlchemy数据库连接
def create_database_engine():
    """创建数据库引擎"""
    db_uri = str(settings.SQLALCHEMY_DATABASE_URI) if settings.SQLALCHEMY_DATABASE_URI else f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    
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
    if "postgresql" in db_uri:
        engine_kwargs.update({
            "poolclass": QueuePool,
            "connect_args": {
                "connect_timeout": 10,
                "application_name": settings.PROJECT_NAME,
                "options": "-c timezone=Asia/Shanghai"
            }
        })
    
    return create_engine(db_uri, **engine_kwargs)

engine = create_database_engine()

# 添加数据库事件监听器
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """为SQLite设置pragma（如果使用SQLite）"""
    if "sqlite" in str(engine.url):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine,
    expire_on_commit=False  # 防止在事务提交后访问对象时出错
)


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


def get_mongo_db():
    """获取MongoDB连接"""
    return mongo_db


def get_redis():
    """获取Redis连接"""
    return get_redis_connection()