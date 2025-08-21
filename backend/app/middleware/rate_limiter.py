from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import time
import logging
from typing import Callable, Dict

from app.core.config import settings
from app.utils.redis_cache import set_rate_limit

# 配置日志
logger = logging.getLogger(__name__)


class RateLimiter:
    """
    请求频率限制中间件
    """
    
    async def __call__(self, request: Request, call_next: Callable):
        # 获取客户端IP
        client_ip = request.client.host if request.client else "unknown"
        
        # 跳过OPTIONS请求（预检请求）
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # 跳过静态文件
        if request.url.path.startswith("/static"):
            return await call_next(request)
        
        # 构建限制键（IP + 路径）
        rate_key = f"{client_ip}:{request.url.path}"
        
        # 检查请求频率
        current_requests = await set_rate_limit(rate_key)
        
        # 如果超过限制，返回429错误
        if current_requests > settings.RATE_LIMIT_REQUESTS:
            logger.warning(f"请求频率超限: {rate_key}, 当前: {current_requests}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "请求过于频繁，请稍后再试"
                }
            )
        
        # 记录请求开始时间
        start_time = time.time()
        
        # 处理请求
        response = await call_next(request)
        
        # 计算请求处理时间
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        return response