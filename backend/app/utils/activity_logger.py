"""
用户活动日志记录工具
"""
import logging
from typing import Dict, Any, Optional

# 直接导入异步日志处理器
from .async_logger import log_activity as async_log_activity
from .async_logger import log_api as async_log_api
from .async_utils import async_with_error_handling

logger = logging.getLogger(__name__)

@async_with_error_handling(
    log_type="ACTIVITY_LOGGER_ERROR",
    log_message="记录用户活动失败",
    raise_exception=False,
    default_return=False
)
def log_user_activity(
    user_id: int,
    action: str,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> bool:
    """
    记录用户活动到PostgreSQL（仅异步方式）
    
    Args:
        user_id: 用户ID
        action: 操作类型
        details: 详细信息
        ip_address: IP地址
        user_agent: 用户代理
    
    Returns:
        bool: 是否记录成功
    """
    # 直接使用异步日志处理器
    return async_log_activity(
        user_id=user_id,
        activity_type=action,
        description="",
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )

@async_with_error_handling(
    log_type="API_LOGGER_ERROR",
    log_message="记录API请求失败",
    raise_exception=False,
    default_return=False
)
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
    记录API请求到PostgreSQL（仅异步方式）
    
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
    # 直接使用异步日志处理器
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
