# -*- coding: utf-8 -*-
"""
修复users表中缺失的is_superuser字段
"""
import asyncio
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

# 从项目导入配置和模型
try:
    from app.core.config import settings
    from app.db.session import create_async_database_engine
    from app.db.init_db import create_initial_users
    from app.core.security import get_password_hash
    from app.models.user import User
    PROJECT_IMPORTED = True
except ImportError:
    # 如果无法从项目导入，则使用硬编码配置
    PROJECT_IMPORTED = False
    
    # 硬编码配置（如果无法从项目导入）
    class Settings:
        POSTGRES_SERVER = "localhost"
        POSTGRES_USER = "globallink_user"
        POSTGRES_PASSWORD = "globallink_password"
        POSTGRES_DB = "globallink"
        POSTGRES_PORT = 5432
        FIRST_SUPERUSER_USERNAME = "admin"
        FIRST_SUPERUSER_EMAIL = "admin@example.com"
        FIRST_SUPERUSER_PASSWORD = "admin"
    
    settings = Settings()
    
    def get_password_hash(password: str) -> str:
        """简单的密码哈希函数（仅用于演示）"""
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_async_engine_from_config():
    """从配置创建异步数据库引擎"""
    if PROJECT_IMPORTED:
        return create_async_database_engine()
    else:
        db_uri = f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
        return create_async_engine(db_uri)

async def check_and_add_is_superuser_column():
    """检查并添加is_superuser字段"""
    try:
        # 创建数据库连接
        engine = await create_async_engine_from_config()
        async with engine.connect() as conn:
            # 检查is_superuser字段是否存在
            logger.info("正在检查users表中的is_superuser字段...")
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'is_superuser'
            """))
            
            column_exists = result.scalar() is not None
            
            if not column_exists:
                # 添加is_superuser字段
                logger.info("is_superuser字段不存在，正在添加...")
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN is_superuser BOOLEAN NOT NULL DEFAULT false
                """))
                await conn.commit()
                logger.info("成功添加is_superuser字段")
            else:
                logger.info("is_superuser字段已存在，无需添加")
                
            # 检查is_admin字段是否存在（因为登录时也用到了）
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'is_admin'
            """))
            
            admin_column_exists = result.scalar() is not None
            
            if not admin_column_exists:
                # 添加is_admin字段
                logger.info("is_admin字段不存在，正在添加...")
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false
                """))
                await conn.commit()
                logger.info("成功添加is_admin字段")
            else:
                logger.info("is_admin字段已存在，无需添加")
                
        await engine.dispose()
        
    except Exception as e:
        logger.error(f"添加字段时发生错误: {e}")
        raise

async def ensure_admin_user():
    """确保管理员用户存在并设置正确的权限"""
    try:
        if PROJECT_IMPORTED:
            # 使用项目的数据库会话和初始化函数
            from app.db.session import AsyncSessionLocal
            
            async with AsyncSessionLocal() as session:
                await create_initial_users(session)
        else:
            # 如果无法导入项目代码，手动创建管理员用户
            engine = await create_async_engine_from_config()
            async with engine.connect() as conn:
                # 检查admin用户是否存在
                result = await conn.execute(text("""
                    SELECT COUNT(*) FROM users WHERE username = :username
                """), {"username": settings.FIRST_SUPERUSER_USERNAME})
                
                user_count = result.scalar()
                
                if user_count == 0:
                    # 创建管理员用户
                    hashed_password = get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)
                    await conn.execute(text("""
                        INSERT INTO users (username, email, hashed_password, full_name, is_superuser, is_admin, is_active, referral_code)
                        VALUES (:username, :email, :hashed_password, :full_name, true, true, true, 'SUPERUSER')
                    """), {
                        "username": settings.FIRST_SUPERUSER_USERNAME,
                        "email": settings.FIRST_SUPERUSER_EMAIL,
                        "hashed_password": hashed_password,
                        "full_name": "Super User"
                    })
                    await conn.commit()
                    logger.info(f"成功创建管理员用户: {settings.FIRST_SUPERUSER_USERNAME}")
                else:
                    # 更新现有管理员用户的权限
                    await conn.execute(text("""
                        UPDATE users 
                        SET is_superuser = true, is_admin = true, is_active = true 
                        WHERE username = :username
                    """), {"username": settings.FIRST_SUPERUSER_USERNAME})
                    await conn.commit()
                    logger.info(f"已更新管理员用户权限: {settings.FIRST_SUPERUSER_USERNAME}")
                
            await engine.dispose()
            
    except Exception as e:
        logger.error(f"确保管理员用户时发生错误: {e}")
        raise

async def main():
    """主函数"""
    logger.info("开始修复users表...")
    
    # 检查并添加缺失的字段
    await check_and_add_is_superuser_column()
    
    # 确保管理员用户存在
    await ensure_admin_user()
    
    logger.info("修复完成！")

if __name__ == "__main__":
    asyncio.run(main())