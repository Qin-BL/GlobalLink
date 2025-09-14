# -*- coding: utf-8 -*-
"""
日志中间件
"""
import time
import logging
from typing import Callable, Awaitable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from ..core.config import settings
from ..utils.async_logger import log_system

logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    """请求日志中间件"""
    
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        """处理请求并记录日志"""
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
        
        # 获取会话ID
        session_id = request.cookies.get('session_id', '')
        
        # 记录请求信息（根据配置的日志级别）
        try:
            log_system(
                log_type="REQUEST_START",
                level="INFO",
                message=f"请求开始: {request.method} {request.url.path}",
                user_id=user_id,
                ip_address=client_ip,
                user_agent=user_agent,
                request_path=request.url.path,
                full_path=str(request.url),
                http_method=request.method,
                session_id=session_id
            )
        except Exception as e:
            logger.error(f"记录请求开始日志失败: {e}")
        
        # 处理请求
        response = await call_next(request)
        
        # 计算处理时间
        process_time = time.time() - start_time
        
        # 记录响应信息（根据配置的日志级别）
        log_level = "WARNING" if response.status_code >= 400 else "INFO"
        try:
            # 对于4xx和5xx状态码，增强日志信息
            if response.status_code >= 400:
                message = f"请求完成: {response.status_code} {response.status_code}"
                # 特别处理401未授权错误
                if response.status_code == 401:
                    message = f"未授权访问: {request.method} {request.url.path} - 状态码: 401"
            else:
                message = f"请求完成: {response.status_code}"
            
            log_system(
                log_type="REQUEST_END",
                level=log_level,
                message=message,
                user_id=user_id,
                ip_address=client_ip,
                user_agent=user_agent,
                request_path=request.url.path,
                full_path=str(request.url),
                http_method=request.method,
                status_code=response.status_code,
                response_time=int(process_time * 1000),  # 转换为毫秒
                session_id=session_id
            )
        except Exception as e:
            logger.error(f"记录请求完成日志失败: {e}")
        
        # 添加处理时间到响应头
        response.headers["X-Process-Time"] = str(process_time)
        
        return response