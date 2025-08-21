from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router
from app.core.config import settings
from app.db.init_db import init_db
from app.middleware.rate_limiter import RateLimiter
from app.middleware.cache import CacheMiddleware
from app.middleware.api_logger import APILoggerMiddleware
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="英语学习平台API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# 设置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加请求频率限制中间件
app.add_middleware(RateLimiter)

# 添加缓存中间件
app.add_middleware(
    CacheMiddleware,
    exclude_paths=[
        "/api/v1/auth",  # 认证相关API不缓存
        "/api/v1/users/me",  # 当前用户信息不缓存
        "/api/v1/membership",  # 会员相关API不缓存
    ]
)

# 添加API日志中间件
app.add_middleware(
    APILoggerMiddleware,
    exclude_paths=[
        "/docs",  # Swagger文档
        "/redoc",  # ReDoc文档
        "/openapi.json",  # OpenAPI规范
        "/static",  # 静态文件
        "/favicon.ico",  # 网站图标
    ]
)

# 包含API路由
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    logger.info("应用启动中...")
    # 初始化数据库
    await init_db()
    logger.info("数据库初始化完成")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("应用关闭中...")
    # 在这里可以添加关闭连接池等清理操作

@app.get("/")
def read_root():
    return {"message": "Welcome to GlobalLink API"}