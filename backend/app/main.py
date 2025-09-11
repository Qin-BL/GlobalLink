from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.gzip import GZipMiddleware
import logging
import sys
from pathlib import Path

from .api.api import api_router
from .core.config import settings
from .db.init_db import init_db

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("logs/app.log") if Path("logs").exists() else logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="GlobalLink - 全球化学习平台API",
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    swagger_ui_parameters={"defaultModelsExpandDepth": -1}
)

# 添加安全中间件
if hasattr(settings, 'ALLOWED_HOSTS'):
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=["*"] if settings.DEBUG else settings.ALLOWED_HOSTS
    )

# 添加Gzip压缩中间件
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 设置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# 包含API路由
app.include_router(api_router, prefix=settings.API_V1_STR)


# 全局异常处理器
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理"""
    logger.error(f"未处理的异常: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "内部服务器错误",
            "type": "internal_server_error"
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """HTTP异常处理"""
    if exc.status_code >= 500:
        logger.error(f"HTTP {exc.status_code} 错误: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "type": "http_exception"
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """请求验证异常处理"""
    logger.warning(f"请求验证失败: {exc.errors()}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": "请求参数验证失败",
            "errors": exc.errors(),
            "type": "validation_error"
        }
    )


@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    logger.info("GlobalLink API 启动中...")
    
    try:
        # 初始化数据库
        init_db()
        logger.info("数据库初始化完成")
        
        # 创建日志目录
        Path("logs").mkdir(exist_ok=True)
        logger.info("日志目录创建完成")
        
        logger.info("GlobalLink API 启动完成")
        
    except Exception as e:
        logger.error(f"应用启动失败: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    logger.info("GlobalLink API 关闭中...")
    # 在这里可以添加关闭连接池等清理操作
    logger.info("GlobalLink API 已关闭")


# 健康检查端点
@app.get("/health")
def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "service": "GlobalLink API",
        "version": "2.0.0"
    }


@app.get("/")
def read_root():
    """根端点"""
    return {
        "message": "Welcome to GlobalLink API",
        "version": "2.0.0",
        "docs": f"{settings.API_V1_STR}/docs"
    }