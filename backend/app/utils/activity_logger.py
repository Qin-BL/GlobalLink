from sqlalchemy.orm import Session
from datetime import datetime
import logging
from typing import Dict, Any, Optional
from ..models.log import SystemLog, UserActivity, ApiLog
from ..db.session import get_db

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
