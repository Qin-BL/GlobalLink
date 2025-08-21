import logging
from datetime import datetime
from typing import Dict, Any, Optional

from app.db.session import get_mongo_db

# 配置日志
logger = logging.getLogger(__name__)


async def log_user_activity(
    user_id: int,
    activity_type: str,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> bool:
    """
    记录用户活动到MongoDB
    
    参数:
        user_id: 用户ID
        activity_type: 活动类型 (login, logout, register, course_view, etc.)
        details: 活动详情
        ip_address: 用户IP地址
    
    返回:
        成功返回True，失败返回False
    """
    try:
        mongo_db = get_mongo_db()
        
        # 准备活动记录
        activity = {
            "user_id": user_id,
            "activity_type": activity_type,
            "timestamp": datetime.utcnow(),
            "details": details or {},
        }
        
        if ip_address:
            activity["ip_address"] = ip_address
        
        # 插入活动记录
        mongo_db.user_activities.insert_one(activity)
        return True
    except Exception as e:
        logger.error(f"记录用户活动失败: {e}")
        return False


async def log_api_request(
    path: str,
    method: str,
    status_code: int,
    process_time: float,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    request_data: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    记录API请求到MongoDB
    
    参数:
        path: 请求路径
        method: 请求方法 (GET, POST, etc.)
        status_code: 响应状态码
        process_time: 处理时间（秒）
        user_id: 用户ID（如果已认证）
        ip_address: 用户IP地址
        request_data: 请求数据（敏感数据应过滤）
    
    返回:
        成功返回True，失败返回False
    """
    try:
        mongo_db = get_mongo_db()
        
        # 准备API日志记录
        log_entry = {
            "path": path,
            "method": method,
            "status_code": status_code,
            "process_time": process_time,
            "timestamp": datetime.utcnow(),
        }
        
        if user_id:
            log_entry["user_id"] = user_id
        
        if ip_address:
            log_entry["ip_address"] = ip_address
        
        if request_data:
            # 过滤敏感数据
            filtered_data = filter_sensitive_data(request_data)
            log_entry["request_data"] = filtered_data
        
        # 插入API日志记录
        mongo_db.api_logs.insert_one(log_entry)
        return True
    except Exception as e:
        logger.error(f"记录API请求失败: {e}")
        return False


def filter_sensitive_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    过滤请求数据中的敏感信息
    """
    if not isinstance(data, dict):
        return data
    
    filtered = {}
    sensitive_fields = ["password", "token", "secret", "credit_card", "card_number"]
    
    for key, value in data.items():
        if any(sensitive in key.lower() for sensitive in sensitive_fields):
            filtered[key] = "[FILTERED]"  # 替换敏感数据
        elif isinstance(value, dict):
            filtered[key] = filter_sensitive_data(value)  # 递归处理嵌套字典
        else:
            filtered[key] = value
    
    return filtered