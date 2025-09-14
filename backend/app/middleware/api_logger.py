# -*- coding: utf-8 -*-
"""
API请求日志中间件
"""
import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from ..core.config import settings
from ..utils.async_logger import log_api as async_log_api

logger = logging.getLogger(__name__)

class APILoggerMiddleware(BaseHTTPMiddleware):
    """
    API请求日志中间件
    记录所有API请求的详细信息
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # 获取客户端IP
        client_ip = request.client.host if request.client else 'unknown'
        
        # 从请求中获取用户ID（如果存在）
        user_id = None
        try:
            # 尝试从请求状态中获取用户ID（假设auth中间件会设置这个）
            if hasattr(request.state, 'user') and request.state.user:
                user_id = getattr(request.state.user, 'id', None)
        except Exception:
            pass
        
        # 获取用户代理
        user_agent = request.headers.get('user-agent', '')
        
        # 尝试获取请求数据（仅对于POST、PUT等方法）
        request_data = None
        try:
            if request.method in ['POST', 'PUT', 'PATCH']:
                # 注意：对于大文件上传，这可能会消耗大量内存
                # 在生产环境中，可以考虑对特定路径或内容类型进行过滤
                request_data = await request.json()
        except Exception:
            # 如果无法解析JSON，记录请求头信息
            request_data = {
                "headers": dict(request.headers),
                "content_type": request.headers.get('content-type', ''),
                "size": request.headers.get('content-length', 'unknown')
            }
        
        # 处理请求
        response = await call_next(request)
        
        # 计算处理时间
        process_time = time.time() - start_time
        
        # 根据状态码确定日志级别
        log_level = "WARNING" if response.status_code >= 400 else "INFO"
        
        # 记录API请求信息（根据配置的日志级别）
        try:
            # 异步记录API请求日志
            async_log_api(
                method=request.method,
                path=request.url.path,
                full_path=str(request.url),
                status_code=response.status_code,
                response_time=process_time,
                user_id=user_id,
                ip_address=client_ip,
                user_agent=user_agent,
                request_data=request_data
            )
            
            # 对于401未授权错误，额外记录详细日志信息
            if response.status_code == 401:
                logger.warning(f"未授权访问: {request.method} {request.url.path} - IP: {client_ip}")
        except Exception as e:
            logger.error(f"记录API请求日志失败: {e}")
        
        # 添加处理时间到响应头
        response.headers["X-Process-Time"] = str(process_time)
        
        return response