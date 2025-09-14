# -*- coding: utf-8 -*-
"""
通用工具函数
"""
from typing import Any, List, Optional, Dict
import re
from datetime import datetime, timedelta

# 从async_security导入密码重置令牌相关函数，避免重复代码
from app.core.async_security import (
    generate_password_reset_token,
    verify_password_reset_token
)


def validate_email(email: str) -> bool:
    """
    验证邮箱格式是否正确
    """
    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return re.match(email_regex, email) is not None


def format_datetime(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    格式化日期时间
    """
    return dt.strftime(format_str)


def parse_duration(duration_str: str) -> timedelta:
    """
    解析时长字符串为timedelta对象
    支持格式: 1h30m, 2d, 5m等
    """
    units = {
        'd': 86400,  # 天
        'h': 3600,   # 小时
        'm': 60,     # 分钟
        's': 1       # 秒
    }
    
    total_seconds = 0
    matches = re.findall(r'(\d+)([dhms])', duration_str.lower())
    
    for value, unit in matches:
        if unit in units:
            total_seconds += int(value) * units[unit]
    
    return timedelta(seconds=total_seconds)


def sanitize_string(s: str, allowed_chars: str = None) -> str:
    """
    清理字符串，移除不允许的字符
    """
    if allowed_chars:
        return ''.join(c for c in s if c in allowed_chars)
    # 默认只保留字母、数字、空格和基本标点
    return re.sub(r'[^a-zA-Z0-9\s.,!?-]', '', s)


def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """
    将列表分成指定大小的块
    """
    return [lst[i:i+chunk_size] for i in range(0, len(lst), chunk_size)]


def safe_get(d: Dict[Any, Any], keys: List[Any], default: Any = None) -> Any:
    """
    安全地从嵌套字典中获取值
    """
    for key in keys:
        if not isinstance(d, dict) or key not in d:
            return default
        d = d[key]
    return d


def truncate_string(s: str, max_length: int, suffix: str = "...") -> str:
    """
    截断字符串到指定长度
    """
    if len(s) <= max_length:
        return s
    return s[:max_length - len(suffix)] + suffix
