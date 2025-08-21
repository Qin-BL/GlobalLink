import time
import logging
from typing import Callable, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.utils.activity_logger import log_api_request
from app.api import deps

# 配置日志
logger = logging.getLogger(__name__)


class APILoggerMiddleware(BaseHTTPMiddleware):
    """
    API请求日志中间件
    记录所有API请求到MongoDB，用于监控和分析
    """
    
    def __init__(self, app, exclude_paths=None):
        super().__init__(app)
        # 排除不需要记录的路径
        self.exclude_paths = exclude_paths or [
            "/docs",  # Swagger文档
            "/redoc",  # ReDoc文档
            "/openapi.json",  # OpenAPI规范
            "/static",  # 静态文件
            "/favicon.ico",  # 网站图标
        ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 跳过OPTIONS请求（预检请求）
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # 检查是否在排除路径中
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)
        
        # 记录请求开始时间
        start_time = time.time()
        
        # 获取客户端IP
        client_ip = request.client.host if request.client else "unknown"
        
        # 尝试获取用户ID（如果已认证）
        user_id = None
        try:
            # 注意：这里不能直接使用Depends，因为中间件不支持依赖注入
            # 我们只在请求头中包含认证信息时尝试获取用户ID
            if "Authorization" in request.headers:
                token = request.headers.get("Authorization", "").replace("Bearer ", "")
                if token:
                    # 这里只是记录用户ID，不需要完整的用户验证
                    # 如果token无效，我们仍然会处理请求，只是不记录用户ID
                    pass
        except Exception:
            # 忽略认证错误，继续处理请求
            pass
        
        # 处理请求
        response = await call_next(request)
        
        # 计算请求处理时间
        process_time = time.time() - start_time
        
        # 添加处理时间到响应头
        response.headers["X-Process-Time"] = str(process_time)
        
        # 异步记录API请求
        request_data = None
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                # 尝试获取请求体，但不阻塞响应
                # 注意：这可能不适用于所有情况，因为请求体可能已经被消费
                body = await request.body()
                if body:
                    try:
                        # 尝试解析为JSON
                        request_data = await request.json()
                    except:
                        # 如果不是JSON，则不记录请求体
                        pass
            except:
                # 忽略获取请求体的错误
                pass
        
        # 异步记录API请求，不等待结果
        await log_api_request(
            path=request.url.path,
            method=request.method,
            status_code=response.status_code,
            process_time=process_time,
            user_id=user_id,
            ip_address=client_ip,
            request_data=request_data
        )
        
        return response