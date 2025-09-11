# -*- coding: utf-8 -*-
"""
API请求日志中间件
"""
import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class APILoggerMiddleware(BaseHTTPMiddleware):
    """
    API请求日志中间件
    记录所有API请求的详细信息
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # 记录请求信息
        logger.info(
            f"API请求开始: {request.method} {request.url.path} "
            f"来源IP: {request.client.host if request.client else 'unknown'}"
        )
        
        # 处理请求
        response = await call_next(request)
        
        # 计算处理时间
        process_time = time.time() - start_time
        
        # 记录响应信息
        logger.info(
            f"API请求完成: {request.method} {request.url.path} "
            f"状态码: {response.status_code} "
            f"处理时间: {process_time:.3f}s"
        )
        
        # 添加处理时间到响应头
        response.headers["X-Process-Time"] = str(process_time)
        
        return response