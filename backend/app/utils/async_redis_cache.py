"""
异步Redis缓存工具
"""
import json
import logging
from typing import Any, Optional, Union
import redis.asyncio as aioredis

from ..core.config import settings
from ..db.async_session import get_async_redis_connection

logger = logging.getLogger(__name__)


async def set_redis_cache(
    key: str,
    value: Union[str, dict, list, int, float, bool, None],
    expire_seconds: int = None
) -> bool:
    """
    设置Redis缓存（异步版本）
    
    Args:
        key: 缓存键
        value: 缓存值
        expire_seconds: 过期时间（秒），None表示使用默认过期时间
    
    Returns:
        bool: 设置是否成功
    """
    try:
        redis_client = get_async_redis_connection()
        
        # 序列化值
        if value is None:
            serialized_value = "null"
        elif isinstance(value, (dict, list)):
            serialized_value = json.dumps(value, ensure_ascii=False)
        elif isinstance(value, (int, float, bool)):
            serialized_value = json.dumps(value)
        else:
            serialized_value = str(value)
        
        # 设置过期时间
        if expire_seconds is None:
            expire_seconds = settings.REDIS_CACHE_EXPIRE_SECONDS
        
        # 设置缓存
        if expire_seconds > 0:
            await redis_client.setex(key, expire_seconds, serialized_value)
        else:
            await redis_client.delete(key)  # 立即删除
        
        return True
        
    except Exception as e:
        logger.error(f"设置Redis缓存失败: {key} - {e}")
        return False


async def get_redis_cache(key: str) -> Optional[Union[str, dict, list, None]]:
    """
    获取Redis缓存（异步版本）
    
    Args:
        key: 缓存键
    
    Returns:
        缓存值，如果不存在则返回None
    """
    try:
        redis_client = get_async_redis_connection()
        
        value = await redis_client.get(key)
        if value is None:
            return None
        
        # 尝试反序列化
        try:
            if value == "null":
                return None
            return json.loads(value)
        except json.JSONDecodeError:
            # 如果不是JSON格式，直接返回字符串
            return value
        
    except Exception as e:
        logger.error(f"获取Redis缓存失败: {key} - {e}")
        return None


async def delete_redis_cache(key: str) -> bool:
    """
    删除Redis缓存（异步版本）
    
    Args:
        key: 缓存键
    
    Returns:
        bool: 删除是否成功
    """
    try:
        redis_client = get_async_redis_connection()
        result = await redis_client.delete(key)
        return result > 0
        
    except Exception as e:
        logger.error(f"删除Redis缓存失败: {key} - {e}")
        return False


async def set_rate_limit(key: str, window: int = None) -> int:
    """
    设置频率限制（异步版本）
    
    Args:
        key: 限制键
        window: 时间窗口（秒）
    
    Returns:
        int: 当前请求次数
    """
    try:
        redis_client = get_async_redis_connection()
        
        if window is None:
            window = 60  # 默认1分钟窗口
        
        # 使用Redis的INCR和EXPIRE命令实现滑动窗口
        current_requests = await redis_client.incr(key)
        
        if current_requests == 1:
            # 第一次请求，设置过期时间
            await redis_client.expire(key, window)
        
        return current_requests
        
    except Exception as e:
        logger.error(f"设置频率限制失败: {key} - {e}")
        return 0


async def get_rate_limit(key: str) -> int:
    """
    获取当前频率限制计数（异步版本）
    
    Args:
        key: 限制键
    
    Returns:
        int: 当前请求次数
    """
    try:
        redis_client = get_async_redis_connection()
        
        value = await redis_client.get(key)
        return int(value) if value else 0
        
    except Exception as e:
        logger.error(f"获取频率限制失败: {key} - {e}")
        return 0


async def clear_cache_pattern(pattern: str) -> int:
    """
    清除匹配模式的缓存（异步版本）
    
    Args:
        pattern: 匹配模式，如 "user:*"
    
    Returns:
        int: 删除的键数量
    """
    try:
        redis_client = get_async_redis_connection()
        
        # 获取匹配的键
        keys = await redis_client.keys(pattern)
        
        if keys:
            # 批量删除
            deleted_count = await redis_client.delete(*keys)
            logger.info(f"清除缓存模式 {pattern}: 删除了 {deleted_count} 个键")
            return deleted_count
        
        return 0
        
    except Exception as e:
        logger.error(f"清除缓存模式失败: {pattern} - {e}")
        return 0


async def cache_exists(key: str) -> bool:
    """
    检查缓存是否存在（异步版本）
    
    Args:
        key: 缓存键
    
    Returns:
        bool: 缓存是否存在
    """
    try:
        redis_client = get_async_redis_connection()
        return await redis_client.exists(key) > 0
        
    except Exception as e:
        logger.error(f"检查缓存存在性失败: {key} - {e}")
        return False


async def get_cache_ttl(key: str) -> int:
    """
    获取缓存剩余生存时间（异步版本）
    
    Args:
        key: 缓存键
    
    Returns:
        int: 剩余秒数，-1表示永不过期，-2表示键不存在
    """
    try:
        redis_client = get_async_redis_connection()
        return await redis_client.ttl(key)
        
    except Exception as e:
        logger.error(f"获取缓存TTL失败: {key} - {e}")
        return -2