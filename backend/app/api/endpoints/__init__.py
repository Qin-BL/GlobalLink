# -*- coding: utf-8 -*-
# API端点统一导出文件
from .auth import router as auth_router
from .users import router as users_router
from .admin import router as admin_router
from .courses import router as courses_router
from .membership import router as membership_router
from .progress import router as progress_router

__all__ = [
    'auth_router',
    'users_router', 
    'admin_router',
    'courses_router',
    'membership_router',
    'progress_router'
]