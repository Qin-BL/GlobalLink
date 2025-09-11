"""
主应用文件
"""
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

from app.api.api import api_router
from app.core.config import settings
from app.db.init_db import init_db
from app.db.session import async_engine
from app.models import base
from app.middleware.api_logger import APILoggerMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.middleware.cache import CacheMiddleware
from app.utils.error_notifier import notify_error

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# 创建数据库表
async def create_tables():
    async with async_engine.begin() as conn:
        await conn.run_sync(base.Base.metadata.create_all)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="英语学习平台API",
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 设置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加中间件
app.add_middleware(
    APILoggerMiddleware,
    exclude_paths=["/docs", "/redoc", "/openapi.json", "/health", "/"]
)

app.add_middleware(
    RateLimiterMiddleware,
    requests_per_minute=settings.RATE_LIMIT_PER_MINUTE
)

app.add_middleware(
    CacheMiddleware,
    exclude_paths=["/auth/", "/admin/"]
)

# 包含API路由
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理"""
    logger.error(f"全局异常: {exc}", exc_info=True)
    
    # 发送错误通知
    try:
        await notify_error(exc, request)
    except Exception as notify_exc:
        logger.error(f"发送错误通知失败: {notify_exc}")
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "服务器内部错误",
            "error_type": type(exc).__name__
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """HTTP异常处理"""
    logger.warning(f"HTTP异常: {exc.status_code} - {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """请求验证异常处理"""
    logger.warning(f"请求验证异常: {exc.errors()}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": "请求参数验证失败",
            "errors": exc.errors()
        }
    )


@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    logger.info("启动应用...")
    
    try:
        # 创建数据库表
        await create_tables()
        
        # 初始化数据库
        await init_db()
        
        logger.info("应用启动完成")
        
    except Exception as e:
        logger.error(f"应用启动失败: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    logger.info("关闭应用...")
    
    try:
        # 关闭数据库连接
        await async_engine.dispose()
        
        logger.info("应用关闭完成")
        
    except Exception as e:
        logger.error(f"应用关闭过程中发生错误: {e}")


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "async": True,
        "timestamp": "2025-01-11T15:00:00Z"
    }


@app.get("/")
async def read_root():
    """根端点"""
    return {
        "message": "Welcome to GlobalLink API",
        "version": "2.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )