"""
Redis缓存工具
"""
import json
import logging
from typing import Any, Optional, Union
import redis.asyncio as aioredis

from ..db.session import get_redis

logger = logging.getLogger(__name__)

async def get_cache(key: str) -> Optional[str]:
    """
    从Redis获取缓存值
    """
    try:
        redis_client = await get_redis()
        value = await redis_client.get(key)
        return value
    except Exception as e:
        logger.error(f"Redis获取缓存失败: {e}")
        return None

async def set_cache(key: str, value: Union[str, dict, list], ttl: int = 3600) -> bool:
    """
    设置Redis缓存值
    """
    try:
        redis_client = await get_redis()
        
        # 如果值是字典或列表，序列化为JSON
        if isinstance(value, (dict, list)):
            value = json.dumps(value, ensure_ascii=False)
        
        await redis_client.setex(key, ttl, value)
        return True
    except Exception as e:
        logger.error(f"Redis设置缓存失败: {e}")
        return False

async def delete_cache(key: str) -> bool:
    """
    删除Redis缓存
    """
    try:
        redis_client = await get_redis()
        await redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Redis删除缓存失败: {e}")
        return False

async def get_json_cache(key: str) -> Optional[Union[dict, list]]:
    """
    获取JSON格式的缓存值
    """
    try:
        value = await get_cache(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        logger.error(f"Redis获取JSON缓存失败: {e}")
        return None

async def set_json_cache(key: str, value: Union[dict, list], ttl: int = 3600) -> bool:
    """
    设置JSON格式的缓存值
    """
    return await set_cache(key, value, ttl)

async def cache_exists(key: str) -> bool:
    """
    检查缓存是否存在
    """
    try:
        redis_client = await get_redis()
        result = await redis_client.exists(key)
        return bool(result)
    except Exception as e:
        logger.error(f"Redis检查缓存存在失败: {e}")
        return False

async def increment_cache(key: str, amount: int = 1, ttl: Optional[int] = None) -> Optional[int]:
    """
    递增缓存值
    """
    try:
        redis_client = await get_redis()
        result = await redis_client.incrby(key, amount)
        
        if ttl:
            await redis_client.expire(key, ttl)
        
        return result
    except Exception as e:
        logger.error(f"Redis递增缓存失败: {e}")
        return None

async def set_rate_limit(key: str, window: int, limit: int = 1) -> int:
    """
    设置频率限制
    """
    try:
        redis_client = await get_redis()
        
        # 使用管道执行原子操作
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        results = await pipe.execute()
        
        return results[0]
    except Exception as e:
        logger.error(f"Redis设置频率限制失败: {e}")
        return 0

async def clear_pattern_cache(pattern: str) -> int:
    """
    清除匹配模式的所有缓存
    """
    try:
        redis_client = await get_redis()
        keys = await redis_client.keys(pattern)
        if keys:
            return await redis_client.delete(*keys)
        return 0
    except Exception as e:
        logger.error(f"Redis清除模式缓存失败: {e}")
        return 0