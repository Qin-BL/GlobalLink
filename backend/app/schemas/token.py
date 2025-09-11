# -*- coding: utf-8 -*-
"""
令牌相关的Pydantic模型
"""
from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """令牌响应模型"""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """令牌载荷模型"""
    sub: Optional[int] = None
    exp: Optional[int] = None
    iat: Optional[int] = None
    type: Optional[str] = None