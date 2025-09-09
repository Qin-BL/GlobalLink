from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.api.api import api_router
from app.core.config import settings
from app.db.init_db import init_db
from app.middleware.rate_limiter import RateLimiter
from app.middleware.cache import CacheMiddleware
from app.middleware.api_logger import APILoggerMiddleware
from app.utils.error_notifier import notify_error, configure_error_notifier
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

# 全局异常处理器
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理，发送错误邮件通知"""
    # 发送错误邮件通知
    await notify_error(exc, request, {
        "project": settings.PROJECT_NAME,
        "environment": "production" if settings.PROJECT_NAME != "GlobalLink" else "development"
    })
    
    # 返回标准错误响应
    return JSONResponse(
        status_code=500,
        content={"detail": "内部服务器错误"}
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """HTTP异常处理"""
    # 对于服务器错误（500+），发送邮件通知
    if exc.status_code >= 500:
        await notify_error(exc, request, {
            "status_code": exc.status_code,
            "project": settings.PROJECT_NAME,
            "environment": "production" if settings.PROJECT_NAME != "GlobalLink" else "development"
        })
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """请求验证异常处理"""
    # 通常不需要为验证错误发送邮件通知
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

@app.on_event("startup")
async def startup_event():
    logger.info("应用启动中...")
    
    # 配置错误通知器（使用配置文件中的接收邮箱设置）
    # 注意：需要在 .env 文件中配置 ERROR_NOTIFICATION_RECIPIENTS 来修改接收邮箱
    # 格式：ERROR_NOTIFICATION_RECIPIENTS="email1@example.com,email2@example.com"
    if settings.ERROR_NOTIFICATION_ENABLED:
        configure_error_notifier(settings.ERROR_NOTIFICATION_RECIPIENTS)
        logger.info(f"错误通知器已配置，接收邮箱: {settings.ERROR_NOTIFICATION_RECIPIENTS}")
    else:
        logger.info("错误邮件通知功能已禁用")
    
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