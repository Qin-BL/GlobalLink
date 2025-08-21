from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import redis
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging
from functools import lru_cache

from app.core.config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB连接
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
    logger.error(f"MongoDB连接失败: {e}")
    raise

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

# 保留SQLAlchemy连接用于兼容现有代码
db_uri = settings.SQLALCHEMY_DATABASE_URI
engine = create_engine(
    db_uri,
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_mongo_db():
    """获取MongoDB连接"""
    return mongo_db


def get_redis():
    """获取Redis连接"""
    return get_redis_connection()