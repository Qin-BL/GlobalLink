# -*- coding: utf-8 -*-
"""
异步数据库初始化
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..core.config import settings
from ..core.security import get_password_hash
from ..models import User
from .session import async_engine, AsyncSessionLocal
from .session import Base

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """初始化数据库（异步版本）"""
    try:
        # 创建所有表
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        # 创建初始用户
        async with AsyncSessionLocal() as session:
            await create_initial_users(session)
        
        logger.info("数据库初始化完成")
        
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
        raise


async def create_initial_users(db: AsyncSession) -> None:
    """创建初始用户（异步版本）"""
    try:
        # 使用管理员用户名生成邮箱地址
        admin_email = f"{settings.ADMIN_USERNAME}@globallink.com"
        
        # 检查是否已存在管理员用户（通过用户名查找）
        result = await db.execute(
            select(User).where(User.username == settings.ADMIN_USERNAME)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            # 创建管理员用户
            user_in = {
                "username": settings.ADMIN_USERNAME,
                "email": admin_email,
                "hashed_password": get_password_hash(settings.ADMIN_PASSWORD),
                "full_name": "Admin User",
                "is_superuser": True,
                "is_admin": True,
                "is_active": True,
                "referral_code": "ADMIN"
            }
            
            user = User(**user_in)
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            logger.info(f"创建管理员用户: {user.username}")
        else:
            logger.info("管理员用户已存在，跳过创建")
            
    except Exception as e:
        logger.error(f"创建初始用户失败: {e}")
        await db.rollback()
        raise
