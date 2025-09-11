"""
异步API路由集合
"""
from fastapi import APIRouter

from app.api.endpoints import async_auth, async_users, async_admin
from app.core.config import settings

async_api_router = APIRouter()

# 认证相关路由
async_api_router.include_router(
    async_auth.router, 
    prefix="/auth", 
    tags=["认证（异步）"]
)

# 用户管理路由
async_api_router.include_router(
    async_users.router, 
    prefix="/users", 
    tags=["用户管理（异步）"]
)

# 管理员路由
async_api_router.include_router(
    async_admin.router, 
    prefix="/admin", 
    tags=["管理员（异步）"]
)