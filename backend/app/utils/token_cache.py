import logging
from typing import Optional, Dict, Any, List

from app.utils.redis_cache import get_redis_cache, set_redis_cache
from app.core.config import settings

# 配置日志
logger = logging.getLogger(__name__)


async def cache_user_token(token: str, user_id: int, expires_delta: int, token_type: str = "access") -> bool:
    """
    缓存用户令牌到Redis
    
    参数:
        token: JWT令牌
        user_id: 用户ID
        expires_delta: 过期时间（秒）
        token_type: 令牌类型，默认为"access"，也可以是"refresh"
    
    返回:
        成功返回True，失败返回False
    """
    try:
        # 缓存令牌 -> 用户ID的映射
        token_key = f"{token_type}_token:{token}"
        await set_redis_cache(token_key, {"user_id": user_id, "type": token_type}, expires_delta)
        
        # 缓存用户ID -> 令牌的映射（用于令牌撤销）
        user_tokens_key = f"user_{token_type}_tokens:{user_id}"
        user_tokens = await get_redis_cache(user_tokens_key) or []
        if token not in user_tokens:
            user_tokens.append(token)
            expire_time = settings.REFRESH_TOKEN_CACHE_EXPIRE_SECONDS if token_type == "refresh" else settings.TOKEN_CACHE_EXPIRE_SECONDS
            await set_redis_cache(user_tokens_key, user_tokens, expire_time)
        
        return True
    except Exception as e:
        logger.error(f"缓存用户{token_type}令牌失败: {e}")
        return False


async def get_cached_user_id(token: str, token_type: str = "access") -> Optional[int]:
    """
    从Redis缓存获取令牌对应的用户ID
    
    参数:
        token: JWT令牌
        token_type: 令牌类型，默认为"access"，也可以是"refresh"
    
    返回:
        用户ID或None（如果令牌不存在或已过期）
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
    从Redis缓存获取刷新令牌对应的用户ID（便捷函数）
    
    参数:
        refresh_token: 刷新令牌
    
    返回:
        用户ID或None（如果令牌不存在或已过期）
    """
    return await get_cached_user_id(refresh_token, token_type="refresh")


async def revoke_user_tokens(user_id: int, token_type: str = "access") -> bool:
    """
    撤销用户的所有令牌（用于密码更改、账户锁定等）
    
    参数:
        user_id: 用户ID
        token_type: 令牌类型，默认为"access"，也可以是"refresh"或"all"
    
    返回:
        成功返回True，失败返回False
    """
    try:
        if token_type == "all":
            # 撤销所有类型的令牌
            access_result = await revoke_user_tokens(user_id, token_type="access")
            refresh_result = await revoke_user_tokens(user_id, token_type="refresh")
            return access_result and refresh_result
        
        # 获取用户的指定类型令牌
        user_tokens_key = f"user_{token_type}_tokens:{user_id}"
        user_tokens = await get_redis_cache(user_tokens_key) or []
        
        # 删除每个令牌的缓存
        for token in user_tokens:
            token_key = f"{token_type}_token:{token}"
            await set_redis_cache(token_key, None, 0)  # 设置为None并立即过期
        
        # 清空用户令牌列表
        await set_redis_cache(user_tokens_key, [], 0)  # 设置为空列表并立即过期
        
        return True
    except Exception as e:
        logger.error(f"撤销用户{token_type}令牌失败: {e}")
        return False


async def revoke_all_user_tokens(user_id: int) -> bool:
    """
    撤销用户的所有类型令牌（便捷函数）
    
    参数:
        user_id: 用户ID
    
    返回:
        成功返回True，失败返回False
    """
    return await revoke_user_tokens(user_id, token_type="all")


async def revoke_token(token: str, token_type: str = "access") -> bool:
    """
    撤销单个令牌（用于登出）
    
    参数:
        token: JWT令牌
        token_type: 令牌类型，默认为"access"，也可以是"refresh"
    
    返回:
        成功返回True，失败返回False
    """
    try:
        # 获取令牌对应的用户ID
        token_key = f"{token_type}_token:{token}"
        token_data = await get_redis_cache(token_key)
        
        if token_data and isinstance(token_data, dict):
            user_id = token_data.get("user_id")
            if user_id:
                # 从用户令牌列表中移除此令牌
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
        logger.error(f"撤销{token_type}令牌失败: {e}")
        return False


async def revoke_refresh_token(refresh_token: str) -> bool:
    """
    撤销单个刷新令牌（便捷函数）
    
    参数:
        refresh_token: 刷新令牌
    
    返回:
        成功返回True，失败返回False
    """
    return await revoke_token(refresh_token, token_type="refresh")