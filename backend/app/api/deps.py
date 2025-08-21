from typing import Generator, Optional, AsyncGenerator
import logging

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app import models, schemas
from app.core import security
from app.core.config import settings
from app.db.session import SessionLocal, get_redis, get_mongo_db
from app.utils.activity_logger import log_user_activity

# 配置日志
logger = logging.getLogger(__name__)

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_db() -> Generator:
    """获取SQLite数据库会话"""
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


async def get_redis_client() -> AsyncGenerator:
    """获取Redis客户端"""
    redis = await get_redis()
    try:
        yield redis
    finally:
        await redis.close()


async def get_mongodb() -> AsyncGenerator:
    """获取MongoDB客户端"""
    mongo = await get_mongo_db()
    yield mongo


async def get_current_user_async(
    request: Request,
    db: Session = Depends(get_db), 
    token: str = Depends(reusable_oauth2)
) -> models.User:
    """异步获取当前用户（使用Redis缓存）"""
    try:
        # 首先尝试从Redis缓存验证令牌
        user_id = await security.verify_token(token)
        
        if not user_id:
            # 如果缓存中没有，则解码JWT令牌
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[security.DEFAULT_ALGORITHM]
            )
            token_data = schemas.TokenPayload(**payload)
            user_id = token_data.sub
        
        # 从数据库获取用户
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="用户未激活")
        
        # 记录用户活动
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")
        await log_user_activity(
            user_id=user.id,
            activity_type="api_access",
            details={
                "path": request.url.path,
                "method": request.method,
                "ip": client_ip,
                "user_agent": user_agent
            }
        )
        
        return user
    except (jwt.JWTError, ValidationError) as e:
        logger.error(f"令牌验证失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无法验证凭据",
        )


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> models.User:
    """同步获取当前用户（用于兼容现有代码）"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.DEFAULT_ALGORITHM]
        )
        token_data = schemas.TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无法验证凭据",
        )
    user = db.query(models.User).filter(models.User.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="用户未激活")
    return user


def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """获取当前活跃用户"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用户未激活")
    return current_user


async def get_current_active_user_async(
    current_user: models.User = Depends(get_current_user_async),
) -> models.User:
    """异步获取当前活跃用户"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用户未激活")
    return current_user


def get_current_admin_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """获取当前管理员用户"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="权限不足"
        )
    return current_user


async def get_current_admin_user_async(
    current_user: models.User = Depends(get_current_user_async),
) -> models.User:
    """异步获取当前管理员用户"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="权限不足"
        )
    return current_user


def check_user_membership(
    db: Session,
    user_id: int,
) -> Optional[models.Membership]:
    # 查询用户的有效会员
    membership = (
        db.query(models.Membership)
        .filter(
            models.Membership.user_id == user_id,
            models.Membership.is_active == True,
            models.Membership.end_date > models.func.now()
        )
        .first()
    )
    return membership