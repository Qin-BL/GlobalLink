from datetime import datetime, timedelta, timezone
from typing import Any
import secrets
import hashlib

from jose import jwt, JWTError
from passlib.context import CryptContext
from passlib.hash import bcrypt
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# 使用更安全的密码上下文配置
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # 增加bcrypt轮数提高安全性
)

# JWT算法
ALGORITHM = settings.JWT_ALGORITHM


def create_access_token(
    subject: str | Any, expires_delta: timedelta | None = None
) -> str:
    """创建访问令牌"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # 添加随机jti防止令牌重放攻击
    jti = secrets.token_urlsafe(32)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "jti": jti,
        "iat": datetime.now(timezone.utc)
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: str | Any, expires_delta: timedelta | None = None
) -> str:
    """创建刷新令牌"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    # 添加随机jti防止令牌重放攻击
    jti = secrets.token_urlsafe(32)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": jti,
        "iat": datetime.now(timezone.utc)
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt



def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"密码验证失败: {e}")
        return False


def get_password_hash(password: str) -> str:
    """生成密码哈希"""
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"密码哈希生成失败: {e}")
        raise


def verify_token(token: str) -> int | None:
    """验证访问令牌"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        
        # 验证令牌类型
        token_type = payload.get("type")
        if token_type != "access":
            logger.warning("无效的令牌类型")
            return None
        
        # 获取用户ID
        user_id = payload.get("sub")
        if user_id is None:
            return None
            
        return int(user_id)
        
    except JWTError as e:
        logger.warning(f"JWT验证失败: {e}")
        return None
    except Exception as e:
        logger.error(f"令牌验证失败: {e}")
        return None


def verify_refresh_token(token: str) -> int | None:
    """验证刷新令牌"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        
        # 验证令牌类型
        token_type = payload.get("type")
        if token_type != "refresh":
            logger.warning("无效的刷新令牌类型")
            return None
        
        # 获取用户ID
        user_id = payload.get("sub")
        if user_id is None:
            return None
            
        return int(user_id)
        
    except JWTError as e:
        logger.warning(f"刷新令牌验证失败: {e}")
        return None
    except Exception as e:
        logger.error(f"刷新令牌验证失败: {e}")
        return None


def refresh_access_token(refresh_token: str) -> str | None:
    """使用刷新令牌获取新的访问令牌"""
    # 验证刷新令牌
    user_id = verify_refresh_token(refresh_token)
    if not user_id:
        logger.warning("无效的刷新令牌")
        return None
    
    # 创建新的访问令牌
    new_access_token = create_access_token(user_id)
    
    logger.info(f"用户 {user_id} 成功刷新访问令牌")
    return new_access_token


def generate_secure_token() -> str:
    """生成安全的随机令牌"""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """对令牌进行哈希处理（用于存储）"""
    return hashlib.sha256(token.encode()).hexdigest()