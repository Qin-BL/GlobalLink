from fastapi import APIRouter

from app.api.endpoints import auth, users, courses, progress, membership

api_router = APIRouter()

# 认证相关路由
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# 用户相关路由
api_router.include_router(users.router, prefix="/users", tags=["users"])

# 课程相关路由
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])

# 学习进度相关路由
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])

# 会员相关路由
api_router.include_router(membership.router, prefix="/membership", tags=["membership"])