# -*- coding: utf-8 -*-
"""
用户活动日志记录工具
"""
from datetime import datetime
import logging
from typing import Dict, Any, Optional
from ..models.log import UserActivity, ApiLog
from ..db.session import get_db
from ..core.config import settings

# 尝试导入异步日志处理器
try:
    from .async_logger import log_activity as async_log_activity
    from .async_logger import log_api as async_log_api
    HAS_ASYNC_LOGGER = True
except ImportError:
    HAS_ASYNC_LOGGER = False

logger = logging.getLogger(__name__)

def log_user_activity(
    user_id: int,
    action: str,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> bool:
    """
    记录用户活动到PostgreSQL
    
    Args:
        user_id: 用户ID
        action: 操作类型
        details: 详细信息
        ip_address: IP地址
        user_agent: 用户代理
    
    Returns:
        bool: 是否记录成功
    """
    # 根据配置决定使用同步还是异步方式
    if settings.ASYNC_LOGGING_ENABLED and HAS_ASYNC_LOGGER:
        try:
            # 使用异步日志处理器
            return async_log_activity(
                user_id=user_id,
                activity_type=action,
                description="",
                details=details,
                ip_address=ip_address,
                user_agent=user_agent
            )
        except Exception as e:
            logger.error(f"异步记录用户活动失败: {e}")
            # 如果异步记录失败，降级到同步记录
            pass
    
    # 同步记录方式（保持原有实现）
    try:
        db = next(get_db())
        
        activity = UserActivity(
            user_id=user_id,
            action=action,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow()
        )
        
        db.add(activity)
        db.commit()
        return True
        
    except Exception as e:
        logger.error(f"记录用户活动失败: {e}")
        if 'db' in locals():
            db.rollback()
        return False
    finally:
        if 'db' in locals():
            db.close()

def log_api_request(
    method: str,
    path: str,
    status_code: int,
    response_time: float,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    request_data: Optional[Dict[str, Any]] = None
) -> bool:
    """
    记录API请求到PostgreSQL
    
    Args:
        method: HTTP方法
        path: 请求路径
        status_code: 状态码
        response_time: 响应时间
        user_id: 用户ID
        ip_address: IP地址
        user_agent: 用户代理
        request_data: 请求数据
    
    Returns:
        bool: 是否记录成功
    """
    # 根据配置决定使用同步还是异步方式
    if settings.ASYNC_LOGGING_ENABLED and HAS_ASYNC_LOGGER:
        try:
            # 使用异步日志处理器
            return async_log_api(
                method=method,
                path=path,
                status_code=status_code,
                response_time=response_time,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                request_data=request_data
            )
        except Exception as e:
            logger.error(f"异步记录API请求失败: {e}")
            # 如果异步记录失败，降级到同步记录
            pass
    
    # 同步记录方式（保持原有实现）
    try:
        db = next(get_db())
        
        log_entry = ApiLog(
            method=method,
            path=path,
            status_code=status_code,
            response_time=response_time,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            request_data=request_data or {},
            created_at=datetime.utcnow()
        )
        
        db.add(log_entry)
        db.commit()
        return True
        
    except Exception as e:
        logger.error(f"记录API请求失败: {e}")
        if 'db' in locals():
            db.rollback()
        return False
    finally:
        if 'db' in locals():
            db.close()
