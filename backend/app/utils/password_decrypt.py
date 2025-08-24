"""
前端加密密码解密工具
处理前端使用 Web Crypto API 加密的密码
"""
import json
import hashlib
from datetime import datetime, timedelta
import logging
from typing import Optional, Tuple

# 配置日志
logger = logging.getLogger(__name__)

# 时间戳有效期（5分钟）
TIMESTAMP_VALIDITY = timedelta(minutes=5)


def decrypt_frontend_password(encrypted_data: str, expected_domain: Optional[str] = None) -> Optional[str]:
    """
    解密前端加密的密码
    
    Args:
        encrypted_data: 前端加密的JSON字符串
        expected_domain: 预期的域名（用于验证）
        
    Returns:
        str: 原始密码，如果解密失败返回None
    """
    try:
        # 解析前端加密数据
        data = json.loads(encrypted_data)
        
        # 检查必需字段
        if not all(key in data for key in ['hash', 'timestamp', 'salt']):
            logger.warning("前端加密数据缺少必需字段")
            return None
        
        # 验证时间戳有效性
        timestamp = data['timestamp']
        if not _validate_timestamp(timestamp):
            logger.warning(f"时间戳已过期或无效: {timestamp}")
            return None
        
        # 如果是降级模式（加密失败），直接返回原始密码
        if data.get('error') == 'encryption_failed':
            logger.info("前端加密失败，使用降级模式")
            return data['hash']
        
        # 验证域名（如果提供）
        if expected_domain and 'domain' in data:
            if data['domain'] != expected_domain:
                logger.warning(f"域名不匹配: 预期 {expected_domain}, 实际 {data.get('domain')}")
                return None
        
        # 返回原始哈希值（前端已经做了哈希，我们只需要验证时间戳）
        # 在实际应用中，这里可以添加额外的验证逻辑
        return data['hash']
        
    except json.JSONDecodeError:
        logger.warning("前端加密数据不是有效的JSON")
        # 可能是原始密码（降级模式）
        return encrypted_data
    except Exception as e:
        logger.error(f"解密前端密码失败: {e}")
        return None


def _validate_timestamp(timestamp: int) -> bool:
    """
    验证时间戳是否在有效期内
    
    Args:
        timestamp: Unix时间戳（毫秒）
        
    Returns:
        bool: 是否有效
    """
    try:
        # 转换为datetime对象
        timestamp_dt = datetime.fromtimestamp(timestamp / 1000)
        current_dt = datetime.now()
        
        # 检查时间戳是否在未来（防止时间戳伪造）
        if timestamp_dt > current_dt:
            logger.warning(f"时间戳在未来: {timestamp}")
            return False
        
        # 检查是否在有效期内
        time_diff = current_dt - timestamp_dt
        if time_diff > TIMESTAMP_VALIDITY:
            logger.warning(f"时间戳已过期: {timestamp}, 差异: {time_diff}")
            return False
        
        return True
    except Exception as e:
        logger.error(f"验证时间戳失败: {e}")
        return False


def is_frontend_encrypted(password_data: str) -> bool:
    """
    检查密码数据是否是前端加密的格式
    
    Args:
        password_data: 密码数据
        
    Returns:
        bool: 是否是前端加密格式
    """
    try:
        data = json.loads(password_data)
        return all(key in data for key in ['hash', 'timestamp', 'salt'])
    except (json.JSONDecodeError, TypeError):
        return False


def extract_password_hash(encrypted_data: str) -> Optional[Tuple[str, int]]:
    """
    从加密数据中提取密码哈希和时间戳
    
    Args:
        encrypted_data: 加密数据
        
    Returns:
        Optional[Tuple[str, int]]: (密码哈希, 时间戳) 或 None
    """
    try:
        data = json.loads(encrypted_data)
        if all(key in data for key in ['hash', 'timestamp']):
            return data['hash'], data['timestamp']
        return None
    except (json.JSONDecodeError, TypeError):
        return None


def create_backend_hash(password: str, timestamp: int, salt: str = "") -> str:
    """
    在后端创建密码哈希（用于验证前端哈希）
    
    Args:
        password: 原始密码
        timestamp: 时间戳
        salt: 盐值
        
    Returns:
        str: 哈希值
    """
    # 组合字符串（与前端相同的逻辑）
    combined_string = f"{password}:{timestamp}:{salt}:{timestamp}"
    
    # 使用SHA-256哈希
    return hashlib.sha256(combined_string.encode()).hexdigest()