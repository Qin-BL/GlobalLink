# -*- coding: utf-8 -*-
"""
GlobalLink异步主应用
完全异步版本的FastAPI应用，监听端口8001
"""
import os
import sys
import logging
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.api.api_v1.api import api_router
from app.db.init_db import init_db
from app.utils.async_logger import log_system, ensure_async_logger_shutdown

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        RotatingFileHandler(
            "app.log",
            maxBytes=1024 * 1024 * 5,  # 5MB
            backupCount=5
        ),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# 创建FastAPI应用实例
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=settings.DEBUG,
    description="""
    GlobalLink 异步API服务
    提供课程管理、用户管理、认证授权等功能的完全异步版本
    """
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 加载异步日志中间件
from app.middleware.logging import LoggingMiddleware
app.add_middleware(LoggingMiddleware)

# 加载异步API日志中间件
from app.middleware.api_logger import APILoggerMiddleware
app.add_middleware(APILoggerMiddleware)

# 加载异步缓存中间件
from app.middleware.cache import CacheMiddleware
app.add_middleware(CacheMiddleware, cache_ttl=settings.CACHE_TTL)

# 加载异步请求频率限制中间件
from app.middleware.rate_limiter import RateLimiterMiddleware
app.add_middleware(
    RateLimiterMiddleware,
    requests_per_minute=settings.REQUESTS_PER_MINUTE
)

# 挂载静态文件目录
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# 注册API路由
app.include_router(api_router, prefix=settings.API_V1_STR)

# 启动事件处理器
@app.on_event("startup")
async def startup_event():
    """\应用启动事件处理器"""
    logger.info("🚀 GlobalLink异步服务启动中...")
    
    # 异步初始化数据库
    try:
        await init_db()
        logger.info("✅ 数据库初始化完成")
    except Exception as e:
        logger.error(f"❌ 数据库初始化失败: {e}")
    
    # 记录启动信息
    await log_system(
        log_type="SYSTEM_STARTUP",
        level="INFO",
        message="GlobalLink异步服务启动成功",
        details={
            "project_name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "api_prefix": settings.API_V1_STR,
            "port": 8001
        }
    )
    
    logger.info(f"✅ GlobalLink异步服务已启动成功，监听端口: 8001")
    logger.info(f"✅ 文档地址: http://localhost:8001/docs")

# 关闭事件处理器
@app.on_event("shutdown")
async def shutdown_event():
    """\应用关闭事件处理器"""
    logger.info("🛑 GlobalLink异步服务关闭中...")
    
    # 确保异步日志处理器关闭
    ensure_async_logger_shutdown()
    
    # 记录关闭信息
    try:
        await log_system(
            log_type="SYSTEM_SHUTDOWN",
            level="INFO",
            message="GlobalLink异步服务关闭成功",
            details={
                "project_name": settings.PROJECT_NAME,
                "version": settings.VERSION
            }
        )
    except Exception as e:
        logger.error(f"记录关闭日志失败: {e}")
    
    logger.info("✅ GlobalLink异步服务已安全关闭")

# 根路由
@app.get("/")
async def root():
    """根路由"""
    return {
        "message": "Welcome to GlobalLink Async API",
        "version": settings.VERSION,
        "documentation": "/docs"
    }

# 健康检查路由
@app.get("/health")
async def health_check():
    """健康检查路由"""
    return {
        "status": "healthy",
        "timestamp": "now"
    }

# 主函数，用于直接运行应用
if __name__ == "__main__":
    import uvicorn
    
    # 使用uvicorn运行异步应用
    uvicorn.run(
        "async_main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG,
        log_level="info",
        workers=settings.WORKERS if not settings.DEBUG else 1
    )