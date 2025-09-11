# -*- coding: utf-8 -*-
"""
缓存中间件
"""
import json
import hashlib
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from ..utils.redis_cache import get_cache, set_cache

class CacheMiddleware(BaseHTTPMiddleware):
    """
    HTTP缓存中间件
    对GET请求进行缓存
    """
    
    def __init__(self, app, cache_ttl: int = 300):
        super().__init__(app)
        self.cache_ttl = cache_ttl
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 只缓存GET请求
        if request.method != "GET":
            return await call_next(request)
        
        # 生成缓存键
        cache_key = self._generate_cache_key(request)
        
        # 尝试从缓存获取
        cached_response = await get_cache(cache_key)
        if cached_response:
            return JSONResponse(content=json.loads(cached_response))
        
        # 处理请求
        response = await call_next(request)
        
        # 缓存成功响应
        if response.status_code == 200:
            # 读取响应内容
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk
            
            # 缓存响应
            await set_cache(cache_key, response_body.decode('utf-8'), self.cache_ttl)
            
            # 重新创建响应
            return Response(
                content=response_body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )
        
        return response
    
    def _generate_cache_key(self, request: Request) -> str:
        """生成缓存键"""
        key_data = f"{request.url.path}?{request.url.query}"
        return f"cache:{hashlib.md5(key_data.encode('utf-8')).hexdigest()}"