from datetime import datetime, timedelta
from typing import Any, Union, Optional

from jose import jwt
from passlib.context import CryptContext
import logging

from app.core.config import settings
from app.utils.token_cache import cache_user_token, get_cached_user_id, revoke_token
from app.utils.redis_cache import set_redis_cache
from app.utils.password_decrypt import decrypt_frontend_password, is_frontend_encrypted

# 配置日志
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


DEFAULT_ALGORITHM = "HS256"


async def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """创建访问令牌并缓存到Redis"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # 计算过期时间（秒）
    expires_in = int((expire - datetime.utcnow()).total_seconds())
    
    # 创建令牌 - 包含token类型标识
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=DEFAULT_ALGORITHM)
    
    # 缓存令牌到Redis
    try:
        await cache_user_token(encoded_jwt, int(subject), expires_in, token_type="access")
    except Exception as e:
        logger.error(f"缓存令牌失败: {e}")
    
    return encoded_jwt


async def create_refresh_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """创建刷新令牌并缓存到Redis"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    # 计算过期时间（秒）
    expires_in = int((expire - datetime.utcnow()).total_seconds())
    
    # 创建令牌 - 包含token类型标识
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=DEFAULT_ALGORITHM)
    
    # 缓存刷新令牌到Redis
    try:
        await cache_user_token(encoded_jwt, int(subject), expires_in, token_type="refresh")
    except Exception as e:
        logger.error(f"缓存刷新令牌失败: {e}")
    
    return encoded_jwt


def create_access_token_sync(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """同步版本的创建访问令牌（用于兼容现有代码）"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=DEFAULT_ALGORITHM)
    return encoded_jwt



def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码（支持前端加密密码）"""
    # 检查是否是前端加密的密码
    if is_frontend_encrypted(plain_password):
        # 解密前端加密的密码
        decrypted_password = decrypt_frontend_password(plain_password, settings.EXPECTED_DOMAIN)
        if decrypted_password is None:
            logger.warning("前端密码解密失败，使用原始密码验证")
            return pwd_context.verify(plain_password, hashed_password)
        
        # 使用解密后的密码哈希进行验证
        return pwd_context.verify(decrypted_password, hashed_password)
    
    # 普通密码验证
    return pwd_context.verify(plain_password, hashed_password)



def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


async def verify_token(token: str) -> Optional[int]:
    """验证访问令牌并从Redis缓存获取用户ID"""
    try:
        # 首先尝试从Redis缓存获取用户ID
        user_id = await get_cached_user_id(token, token_type="access")
        if user_id:
            return user_id
        
        # 如果缓存中没有，则解码JWT令牌
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[DEFAULT_ALGORITHM])
        
        # 验证令牌类型是否为access
        token_type = payload.get("type")
        if token_type != "access":
            logger.warning("无效的令牌类型")
            return None
        
        user_id = int(payload.get("sub"))
        
        # 计算剩余过期时间
        exp = payload.get("exp")
        if exp:
            now = datetime.utcnow().timestamp()
            expires_in = int(exp - now)
            if expires_in > 0:
                # 将令牌添加到缓存
                await cache_user_token(token, user_id, expires_in, token_type="access")
                return user_id
        
        return None
    except Exception as e:
        logger.error(f"验证令牌失败: {e}")
        return None


async def verify_refresh_token(token: str) -> Optional[int]:
    """验证刷新令牌并获取用户ID"""
    try:
        # 尝试从Redis缓存获取刷新令牌对应的用户ID
        user_id = await get_cached_user_id_for_refresh_token(token)
        if user_id:
            return user_id
        
        # 如果缓存中没有，则解码JWT令牌
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[DEFAULT_ALGORITHM])
        
        # 验证令牌类型是否为refresh
        token_type = payload.get("type")
        if token_type != "refresh":
            logger.warning("无效的刷新令牌类型")
            return None
        
        user_id = int(payload.get("sub"))
        
        # 计算剩余过期时间
        exp = payload.get("exp")
        if exp:
            now = datetime.utcnow().timestamp()
            expires_in = int(exp - now)
            if expires_in > 0:
                # 将刷新令牌添加到缓存
                await cache_user_token(token, user_id, expires_in, token_type="refresh")
                return user_id
        
        return None
    except Exception as e:
        logger.error(f"验证刷新令牌失败: {e}")
        return None


async def revoke_refresh_token(token: str) -> bool:
    """
    撤销刷新令牌
    """
    try:
        # 使用token_cache模块的函数撤销刷新令牌
        from app.utils.token_cache import revoke_refresh_token as revoke_refresh_token_impl
        return await revoke_refresh_token_impl(token)
    except Exception as e:
        logger.error(f"撤销刷新令牌失败: {e}")
        return False


async def revoke_all_refresh_tokens(user_id: int) -> bool:
    """撤销用户的所有刷新令牌"""
    try:
        await revoke_user_tokens(user_id, token_type="refresh")
        return True
    except Exception as e:
        logger.error(f"撤销用户所有刷新令牌失败: {e}")
        return False


async def revoke_user_token(token: str) -> bool:
    """撤销用户令牌（用于登出）"""
    try:
        # 同时尝试撤销访问令牌和刷新令牌
        result1 = await revoke_token(token, token_type="access")
        result2 = await revoke_refresh_token(token)
        return result1 or result2
    except Exception as e:
        logger.error(f"撤销令牌失败: {e}")
        return False


async def refresh_access_token(refresh_token: str) -> Optional[str]:
    """使用刷新令牌获取新的访问令牌"""
    # 验证刷新令牌
    user_id = await verify_refresh_token(refresh_token)
    if not user_id:
        logger.warning("无效的刷新令牌")
        return None
    
    # 创建新的访问令牌
    new_access_token = await create_access_token(user_id)
    
    # 记录刷新操作
    logger.info(f"用户 {user_id} 成功刷新访问令牌")
    
    return new_access_token