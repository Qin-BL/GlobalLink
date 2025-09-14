# -*- coding: utf-8 -*-
"""
API路由集合
"""
from fastapi import APIRouter

from app.api.endpoints import auth_router, users_router, admin_router, courses_router, membership_router, progress_router, two_factor_router
from app.core.config import settings

api_router = APIRouter()

# 认证相关路由
api_router.include_router(
    auth_router, 
    prefix="/auth", 
    tags=["认证"]
)

# 用户管理路由
api_router.include_router(
    users_router, 
    prefix="/users", 
    tags=["用户管理"]
)

# 管理员路由
api_router.include_router(
    admin_router, 
    prefix="/admin", 
    tags=["管理员"]
)

# 课程管理路由
api_router.include_router(
    courses_router, 
    prefix="/courses", 
    tags=["课程管理"]
)

# 会员管理路由
api_router.include_router(
    membership_router, 
    prefix="/membership", 
    tags=["会员管理"]
)

# 学习进度路由
api_router.include_router(
    progress_router, 
    prefix="/progress", 
    tags=["学习进度"]
)

# 双因素认证相关路由
api_router.include_router(
    two_factor_router, 
    prefix="/two-factor", 
    tags=["双因素认证"]
)