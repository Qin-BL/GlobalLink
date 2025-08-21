import logging
from typing import Optional, Dict, Any

from app.utils.redis_cache import get_redis_cache, set_redis_cache
from app.core.config import settings

# 配置日志
logger = logging.getLogger(__name__)


async def cache_user_token(token: str, user_id: int, expires_delta: int) -> bool:
    """
    缓存用户令牌到Redis
    
    参数:
        token: JWT令牌
        user_id: 用户ID
        expires_delta: 过期时间（秒）
    
    返回:
        成功返回True，失败返回False
    """
    try:
        # 缓存令牌 -> 用户ID的映射
        token_key = f"token:{token}"
        await set_redis_cache(token_key, {"user_id": user_id}, expires_delta)
        
        # 缓存用户ID -> 令牌的映射（用于令牌撤销）
        user_tokens_key = f"user_tokens:{user_id}"
        user_tokens = await get_redis_cache(user_tokens_key) or []
        if token not in user_tokens:
            user_tokens.append(token)
            await set_redis_cache(user_tokens_key, user_tokens, settings.TOKEN_CACHE_EXPIRE_SECONDS)
        
        return True
    except Exception as e:
        logger.error(f"缓存用户令牌失败: {e}")
        return False


async def get_cached_user_id(token: str) -> Optional[int]:
    """
    从Redis缓存获取令牌对应的用户ID
    
    参数:
        token: JWT令牌
    
    返回:
        用户ID或None（如果令牌不存在或已过期）
    """
    try:
        token_key = f"token:{token}"
        token_data = await get_redis_cache(token_key)
        if token_data and isinstance(token_data, dict):
            return token_data.get("user_id")
        return None
    except Exception as e:
        logger.error(f"获取缓存用户ID失败: {e}")
        return None


async def revoke_user_tokens(user_id: int) -> bool:
    """
    撤销用户的所有令牌（用于密码更改、账户锁定等）
    
    参数:
        user_id: 用户ID
    
    返回:
        成功返回True，失败返回False
    """
    try:
        # 获取用户的所有令牌
        user_tokens_key = f"user_tokens:{user_id}"
        user_tokens = await get_redis_cache(user_tokens_key) or []
        
        # 删除每个令牌的缓存
        for token in user_tokens:
            token_key = f"token:{token}"
            await set_redis_cache(token_key, None, 0)  # 设置为None并立即过期
        
        # 清空用户令牌列表
        await set_redis_cache(user_tokens_key, [], 0)  # 设置为空列表并立即过期
        
        return True
    except Exception as e:
        logger.error(f"撤销用户令牌失败: {e}")
        return False


async def revoke_token(token: str) -> bool:
    """
    撤销单个令牌（用于登出）
    
    参数:
        token: JWT令牌
    
    返回:
        成功返回True，失败返回False
    """
    try:
        # 获取令牌对应的用户ID
        token_key = f"token:{token}"
        token_data = await get_redis_cache(token_key)
        
        if token_data and isinstance(token_data, dict):
            user_id = token_data.get("user_id")
            if user_id:
                # 从用户令牌列表中移除此令牌
                user_tokens_key = f"user_tokens:{user_id}"
                user_tokens = await get_redis_cache(user_tokens_key) or []
                if token in user_tokens:
                    user_tokens.remove(token)
                    await set_redis_cache(user_tokens_key, user_tokens, settings.TOKEN_CACHE_EXPIRE_SECONDS)
        
        # 删除令牌缓存
        await set_redis_cache(token_key, None, 0)  # 设置为None并立即过期
        
        return True
    except Exception as e:
        logger.error(f"撤销令牌失败: {e}")
        return False