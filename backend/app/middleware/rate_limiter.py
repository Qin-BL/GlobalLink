# -*- coding: utf-8 -*-
"""
请求频率限制中间件
"""
import time
from typing import Callable
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from ..utils.redis_cache import get_redis

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    请求频率限制中间件
    基于IP地址限制请求频率
    """
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_size = 60  # 1分钟窗口
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 获取客户端IP
        client_ip = request.client.host if request.client else "unknown"
        
        # 检查频率限制
        if not await self._check_rate_limit(client_ip):
            raise HTTPException(
                status_code=429,
                detail="请求过于频繁，请稍后再试"
            )
        
        return await call_next(request)
    
    async def _check_rate_limit(self, client_ip: str) -> bool:
        """检查请求频率限制"""
        redis_client = await get_redis()
        current_time = int(time.time())
        window_start = current_time - self.window_size
        
        # 使用滑动窗口算法
        key = f"rate_limit:{client_ip}"
        
        # 清理过期的请求记录
        await redis_client.zremrangebyscore(key, 0, window_start)
        
        # 获取当前窗口内的请求数
        current_requests = await redis_client.zcard(key)
        
        if current_requests >= self.requests_per_minute:
            return False
        
        # 记录当前请求
        await redis_client.zadd(key, {str(current_time): current_time})
        await redis_client.expire(key, self.window_size)
        
        return True