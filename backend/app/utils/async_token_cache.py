"""
异步令牌缓存管理
"""
import logging
from typing import Optional, List

from .async_redis_cache import set_redis_cache, get_redis_cache
from ..core.config import settings

logger = logging.getLogger(__name__)


async def cache_user_token(token: str, user_id: int, expires_delta: int, token_type: str = "access") -> bool:
    """
    缓存用户令牌（异步版本）
    
    Args:
        token: JWT令牌
        user_id: 用户ID
        expires_delta: 过期时间（秒）
        token_type: 令牌类型 ("access" 或 "refresh")
    
    Returns:
        bool: 缓存是否成功
    """
    try:
        # 缓存令牌到用户ID的映射
        token_key = f"{token_type}_token:{token}"
        await set_redis_cache(token_key, {"user_id": user_id, "type": token_type}, expires_delta)
        
        # 维护用户的令牌列表
        user_tokens_key = f"user_{token_type}_tokens:{user_id}"
        user_tokens = await get_redis_cache(user_tokens_key) or []
        if token not in user_tokens:
            user_tokens.append(token)
            expire_time = settings.REFRESH_TOKEN_CACHE_EXPIRE_SECONDS if token_type == "refresh" else settings.TOKEN_CACHE_EXPIRE_SECONDS
            await set_redis_cache(user_tokens_key, user_tokens, expire_time)
        
        return True
        
    except Exception as e:
        logger.error(f"缓存用户令牌失败: {e}")
        return False


async def get_cached_user_id(token: str, token_type: str = "access") -> Optional[int]:
    """
    从缓存获取令牌对应的用户ID（异步版本）
    
    Args:
        token: JWT令牌
        token_type: 令牌类型 ("access" 或 "refresh")
    
    Returns:
        Optional[int]: 用户ID，如果不存在则返回None
    """
    try:
        token_key = f"{token_type}_token:{token}"
        token_data = await get_redis_cache(token_key)
        if token_data and isinstance(token_data, dict):
            return token_data.get("user_id")
        return None
        
    except Exception as e:
        logger.error(f"获取缓存用户ID失败: {e}")
        return None


async def get_cached_user_id_for_refresh_token(refresh_token: str) -> Optional[int]:
    """
    从缓存获取刷新令牌对应的用户ID（异步版本）
    
    Args:
        refresh_token: 刷新令牌
    
    Returns:
        Optional[int]: 用户ID，如果不存在则返回None
    """
    return await get_cached_user_id(refresh_token, token_type="refresh")


async def revoke_user_tokens(user_id: int, token_type: str = "access") -> bool:
    """
    撤销用户的所有令牌（异步版本）
    
    Args:
        user_id: 用户ID
        token_type: 令牌类型 ("access", "refresh" 或 "all")
    
    Returns:
        bool: 撤销是否成功
    """
    try:
        if token_type == "all":
            # 撤销所有类型的令牌
            access_result = await revoke_user_tokens(user_id, token_type="access")
            refresh_result = await revoke_user_tokens(user_id, token_type="refresh")
            return access_result and refresh_result
        
        user_tokens_key = f"user_{token_type}_tokens:{user_id}"
        user_tokens = await get_redis_cache(user_tokens_key) or []
        
        # 撤销每个令牌
        for token in user_tokens:
            token_key = f"{token_type}_token:{token}"
            await set_redis_cache(token_key, None, 0)  # 设置为None并立即过期
        
        # 清空用户令牌列表
        await set_redis_cache(user_tokens_key, [], 0)  # 设置为空列表并立即过期
        
        return True
        
    except Exception as e:
        logger.error(f"撤销用户令牌失败: {e}")
        return False


async def revoke_all_user_tokens(user_id: int) -> bool:
    """
    撤销用户的所有令牌（异步版本）
    
    Args:
        user_id: 用户ID
    
    Returns:
        bool: 撤销是否成功
    """
    return await revoke_user_tokens(user_id, token_type="all")


async def revoke_token(token: str, token_type: str = "access") -> bool:
    """
    撤销特定令牌（异步版本）
    
    Args:
        token: JWT令牌
        token_type: 令牌类型 ("access" 或 "refresh")
    
    Returns:
        bool: 撤销是否成功
    """
    try:
        token_key = f"{token_type}_token:{token}"
        token_data = await get_redis_cache(token_key)
        
        if token_data and isinstance(token_data, dict):
            user_id = token_data.get("user_id")
            if user_id:
                # 从用户令牌列表中移除
                user_tokens_key = f"user_{token_type}_tokens:{user_id}"
                user_tokens = await get_redis_cache(user_tokens_key) or []
                if token in user_tokens:
                    user_tokens.remove(token)
                    expire_time = settings.REFRESH_TOKEN_CACHE_EXPIRE_SECONDS if token_type == "refresh" else settings.TOKEN_CACHE_EXPIRE_SECONDS
                    await set_redis_cache(user_tokens_key, user_tokens, expire_time)
        
        # 删除令牌缓存
        await set_redis_cache(token_key, None, 0)  # 设置为None并立即过期
        
        return True
        
    except Exception as e:
        logger.error(f"撤销令牌失败: {e}")
        return False


async def revoke_refresh_token(refresh_token: str) -> bool:
    """
    撤销刷新令牌（异步版本）
    
    Args:
        refresh_token: 刷新令牌
    
    Returns:
        bool: 撤销是否成功
    """
    return await revoke_token(refresh_token, token_type="refresh")


async def get_user_tokens(user_id: int, token_type: str = "access") -> List[str]:
    """
    获取用户的所有令牌（异步版本）
    
    Args:
        user_id: 用户ID
        token_type: 令牌类型 ("access" 或 "refresh")
    
    Returns:
        List[str]: 令牌列表
    """
    try:
        user_tokens_key = f"user_{token_type}_tokens:{user_id}"
        user_tokens = await get_redis_cache(user_tokens_key) or []
        return user_tokens
        
    except Exception as e:
        logger.error(f"获取用户令牌失败: {e}")
        return []


async def cleanup_expired_tokens() -> int:
    """
    清理过期的令牌缓存（异步版本）
    
    Returns:
        int: 清理的令牌数量
    """
    try:
        from .async_redis_cache import clear_cache_pattern
        
        # 清理过期的访问令牌
        access_count = await clear_cache_pattern("access_token:*")
        
        # 清理过期的刷新令牌
        refresh_count = await clear_cache_pattern("refresh_token:*")
        
        # 清理用户令牌列表
        user_tokens_count = await clear_cache_pattern("user_*_tokens:*")
        
        total_count = access_count + refresh_count + user_tokens_count
        logger.info(f"清理过期令牌完成: 总计 {total_count} 个")
        
        return total_count
        
    except Exception as e:
        logger.error(f"清理过期令牌失败: {e}")
        return 0