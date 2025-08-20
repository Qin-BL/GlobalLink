import jwt
from typing import Optional

from app.core.config import settings


def generate_password_reset_token(email: str) -> str:
    """生成密码重置令牌"""
    delta = 60 * 30  # 30 minutes
    now = jwt.datetime.datetime.utcnow()
    expires = now + jwt.datetime.timedelta(seconds=delta)
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    """验证密码重置令牌"""
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return decoded_token["sub"]
    except jwt.JWTError:
        return None