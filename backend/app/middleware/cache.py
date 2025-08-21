import json
import hashlib
from typing import Callable, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse, JSONResponse
import logging

from app.core.config import settings
from app.utils.redis_cache import get_redis_cache, set_redis_cache

# 配置日志
logger = logging.getLogger(__name__)


class CacheMiddleware(BaseHTTPMiddleware):
    """
    API响应缓存中间件
    """
    
    def __init__(self, app, exclude_paths=None):
        super().__init__(app)
        # 排除不需要缓存的路径
        self.exclude_paths = exclude_paths or [
            "/api/v1/auth",  # 认证相关API不缓存
            "/api/v1/users/me",  # 当前用户信息不缓存
        ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 只缓存GET请求
        if request.method != "GET":
            return await call_next(request)
        
        # 检查是否在排除路径中
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)
        
        # 生成缓存键
        cache_key = self._generate_cache_key(request)
        
        # 尝试从缓存获取响应
        cached_response = await get_redis_cache(cache_key)
        
        # 如果缓存存在，直接返回
        if cached_response and isinstance(cached_response, dict):
            logger.debug(f"从缓存返回响应: {cache_key}")
            return JSONResponse(
                content=cached_response.get("body"),
                status_code=cached_response.get("status_code", 200),
                headers=cached_response.get("headers", {})
            )
        
        # 处理请求
        response = await call_next(request)
        
        # 不缓存流式响应
        if isinstance(response, StreamingResponse):
            return response
        
        # 不缓存错误响应
        if response.status_code >= 400:
            return response
        
        # 获取响应内容
        response_body = await self._get_response_body(response)
        
        # 缓存响应
        if response_body:
            cache_data = {
                "body": response_body,
                "status_code": response.status_code,
                "headers": dict(response.headers)
            }
            
            # 设置缓存，默认过期时间
            await set_redis_cache(cache_key, cache_data)
        
        return response
    
    def _generate_cache_key(self, request: Request) -> str:
        """
        生成缓存键
        """
        # 组合URL和查询参数
        url = str(request.url)
        
        # 添加认证信息（如果有）
        auth_header = request.headers.get("Authorization", "")
        if auth_header:
            # 只使用令牌的哈希值，避免存储完整令牌
            auth_hash = hashlib.md5(auth_header.encode()).hexdigest()
            url = f"{url}:{auth_hash}"
        
        # 生成MD5哈希作为缓存键
        return f"api_cache:{hashlib.md5(url.encode()).hexdigest()}"
    
    async def _get_response_body(self, response: Response) -> Optional[dict]:
        """
        获取响应内容
        """
        try:
            body = response.body
            if not body:
                return None
            
            # 尝试解析JSON
            return json.loads(body)
        except Exception as e:
            logger.error(f"解析响应内容失败: {str(e)}")
            return None