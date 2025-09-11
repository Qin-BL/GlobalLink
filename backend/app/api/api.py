"""
API路由集合
"""
from fastapi import APIRouter

from app.api.endpoints import auth, users, admin
from app.core.config import settings

api_router = APIRouter()

# 认证相关路由
api_router.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["认证"]
)

# 用户管理路由
api_router.include_router(
    users.router, 
    prefix="/users", 
    tags=["用户管理"]
)

# 管理员路由
api_router.include_router(
    admin.router, 
    prefix="/admin", 
    tags=["管理员"]
)