import logging
from datetime import datetime

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import User
from ..schemas import TokenPayload
from ..core import security
from ..core.config import settings
from ..db.session import get_db

logger = logging.getLogger(__name__)

# OAuth2密码流认证
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

# HTTP Bearer认证（用于API密钥等）
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme)
) -> User:
    """获取当前认证用户"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValueError) as e:
        logger.warning(f"JWT解码失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户账户已被禁用"
        )
    
    # 更新最后登录时间
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前活跃用户"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户账户已被禁用"
        )
    return current_user


def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前超级用户"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，需要超级用户权限"
        )
    return current_user


def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """获取当前管理员用户"""
    if not (current_user.is_superuser or current_user.is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，需要管理员权限"
        )
    return current_user


def get_optional_current_user(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme)
) -> User | None:
    """获取可选的当前用户（用于可选认证的端点）"""
    if not token:
        return None
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        user = db.query(User).filter(User.id == token_data.sub).first()
        
        if user and user.is_active:
            return user
        return None
    except (JWTError, ValueError):
        return None


def check_rate_limit(
    request: Request,
    max_requests: int = 100,
    window_seconds: int = 3600
) -> None:
    """检查请求频率限制"""
    client_ip = request.client.host if request.client else "unknown"
    
    # 这里可以集成Redis来实现真正的速率限制
    # 目前只是一个占位符实现
    logger.info(f"Rate limit check for IP: {client_ip}")


def validate_api_key(
    request: Request,
    api_key: str | None = None
) -> bool:
    """验证API密钥"""
    if not api_key:
        return False
    
    # 这里应该从数据库或配置中验证API密钥
    # 目前只是一个占位符实现
    return api_key == settings.API_KEY if hasattr(settings, 'API_KEY') else False


def get_user_permissions(user: User) -> list[str]:
    """获取用户权限列表"""
    permissions = ["read"]
    
    if user.is_active:
        permissions.append("write")
    
    if user.is_admin:
        permissions.extend(["admin", "manage_users"])
    
    if user.is_superuser:
        permissions.extend(["superuser", "manage_system"])
    
    return permissions


def require_permission(permission: str):
    """权限装饰器工厂"""
    def permission_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        user_permissions = get_user_permissions(current_user)
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足，需要 '{permission}' 权限"
            )
        return current_user
    
    return permission_checker