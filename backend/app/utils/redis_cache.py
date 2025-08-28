import json
import logging
from typing import Any, Optional, Union

from app.core.config import settings
from app.db.session import get_redis

# 配置日志
logger = logging.getLogger(__name__)


async def set_redis_cache(
    key: str,
    value: Any,
    expire_seconds: Optional[int] = None
) -> bool:
    """
    设置Redis缓存
    
    参数:
        key: 缓存键
        value: 缓存值
        expire_seconds: 过期时间（秒），如果为None则使用默认过期时间
    
    返回:
        bool: 是否成功
    """
    try:
        redis_client = get_redis()
        
        # 如果值为None，则删除键
        if value is None:
            redis_client.delete(key)
            return True
        
        # 如果值不是字符串、整数或浮点数，则转换为字符串
        if isinstance(value, bool):
            # 布尔值转换为字符串'true'或'false'
            value = str(value).lower()
        elif not isinstance(value, (str, int, float)):
            # 其他类型转换为JSON字符串
            value = json.dumps(value)
        
        # 设置缓存
        redis_client.set(key, value)
        
        # 设置过期时间
        if expire_seconds is None:
            expire_seconds = settings.REDIS_CACHE_EXPIRE_SECONDS
        
        if expire_seconds > 0:
            redis_client.expire(key, expire_seconds)
        
        return True
    except Exception as e:
        logger.error(f"设置Redis缓存失败: {str(e)}")
        return False


async def get_redis_cache(key: str) -> Union[str, dict, list, None]:
    """
    获取Redis缓存
    
    参数:
        key: 缓存键
    
    返回:
        缓存值，如果不存在则返回None
    """
    try:
        redis_client = get_redis()
        value = redis_client.get(key)
        
        if value is None:
            return None
        
        # 尝试解析JSON
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value
    except Exception as e:
        logger.error(f"获取Redis缓存失败: {str(e)}")
        return None


async def delete_redis_cache(key: str) -> bool:
    """
    删除Redis缓存
    
    参数:
        key: 缓存键
    
    返回:
        bool: 是否成功
    """
    try:
        redis_client = get_redis()
        redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"删除Redis缓存失败: {str(e)}")
        return False


async def set_rate_limit(key: str, window: int = None) -> int:
    """
    设置请求频率限制
    
    参数:
        key: 限制键（通常是用户ID或IP地址）
        window: 时间窗口（秒），如果为None则使用默认窗口
    
    返回:
        int: 当前请求次数
    """
    try:
        redis_client = get_redis()
        
        # 构建键
        rate_key = f"rate_limit:{key}"
        
        # 设置窗口
        if window is None:
            window = settings.RATE_LIMIT_WINDOW
        
        # 增加计数
        current = redis_client.incr(rate_key)
        
        # 如果是第一次请求，设置过期时间
        if current == 1:
            redis_client.expire(rate_key, window)
        
        return current
    except Exception as e:
        logger.error(f"设置请求频率限制失败: {str(e)}")
        return 0


async def get_rate_limit(key: str) -> int:
    """
    获取当前请求频率
    
    参数:
        key: 限制键（通常是用户ID或IP地址）
    
    返回:
        int: 当前请求次数
    """
    try:
        redis_client = get_redis()
        rate_key = f"rate_limit:{key}"
        count = redis_client.get(rate_key)
        return int(count) if count else 0
    except Exception as e:
        logger.error(f"获取请求频率失败: {str(e)}")
        return 0