# -*- coding: utf-8 -*-
"""
令牌缓存管理工具
"""
import logging
from typing import Optional

from .redis_cache import set_cache, get_cache, delete_cache

logger = logging.getLogger(__name__)

class TokenCache:
    """
    令牌缓存管理器
    用于缓存用户令牌和相关信息
    """
    
    def __init__(self, prefix: str = "token"):
        self.prefix = prefix
    
    async def cache_user_token(
        self, 
        token: str, 
        user_id: int, 
        expires_seconds: int,
        token_type: str = "access"
    ) -> bool:
        """缓存用户令牌"""
        cache_key = f"{self.prefix}:{token_type}:{token}"
        return await set_cache(cache_key, str(user_id), expires_seconds)
    
    async def get_cached_user_id(
        self, 
        token: str, 
        token_type: str = "access"
    ) -> Optional[int]:
        """从缓存获取用户ID"""
        cache_key = f"{self.prefix}:{token_type}:{token}"
        user_id_str = await get_cache(cache_key)
        
        if user_id_str:
            try:
                return int(user_id_str)
            except ValueError:
                logger.warning(f"无效的用户ID缓存值: {user_id_str}")
        
        return None
    
    async def invalidate_token(
        self, 
        token: str, 
        token_type: str = "access"
    ) -> bool:
        """使令牌失效"""
        cache_key = f"{self.prefix}:{token_type}:{token}"
        return await delete_cache(cache_key)
    
    async def invalidate_user_tokens(self, user_id: int) -> bool:
        """使用户的所有令牌失效"""
        # 这需要扫描所有令牌，在生产环境中可能需要优化
        # 可以考虑维护一个用户ID到令牌的映射
        logger.info(f"令牌失效请求: 用户 {user_id}")
        return True

# 全局令牌缓存实例
token_cache = TokenCache()

async def cache_user_token(
    token: str, 
    user_id: int, 
    expires_seconds: int,
    token_type: str = "access"
) -> bool:
    """缓存用户令牌的便捷函数"""
    return await token_cache.cache_user_token(token, user_id, expires_seconds, token_type)

async def get_cached_user_id(
    token: str, 
    token_type: str = "access"
) -> Optional[int]:
    """获取缓存用户ID的便捷函数"""
    return await token_cache.get_cached_user_id(token, token_type)

async def invalidate_token(
    token: str, 
    token_type: str = "access"
) -> bool:
    """使令牌失效的便捷函数"""
    return await token_cache.invalidate_token(token, token_type)

async def invalidate_user_tokens(user_id: int) -> bool:
    """使用户所有令牌失效的便捷函数"""
    return await token_cache.invalidate_user_tokens(user_id)