from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, validator
import re


# 共享属性
class UserBase(BaseModel):
    username: str


# 创建用户时的属性
class UserCreate(UserBase):
    password: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    referral_code: Optional[str] = None  # 推广人的推广码
    
    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('密码长度至少为8个字符')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is None:
            return v
        # 简单的中国手机号验证
        if not re.match(r'^1[3-9]\d{9}$', v):
            raise ValueError('无效的手机号码')
        return v
    
    @validator('username', 'email', 'phone')
    def check_auth_fields(cls, v, values, **kwargs):
        field = kwargs['field']
        if field.name == 'username':
            return v
        
        # 确保至少提供了邮箱或手机号之一
        if 'email' in values or 'phone' in values:
            return v
        
        if field.name == 'email' and not v and 'phone' not in values:
            raise ValueError('邮箱和手机号至少提供一个')
        
        if field.name == 'phone' and not v and 'email' not in values:
            raise ValueError('邮箱和手机号至少提供一个')
        
        return v


# 更新用户时的属性
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    
    @validator('password')
    def password_min_length(cls, v):
        if v is not None and len(v) < 8:
            raise ValueError('密码长度至少为8个字符')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is None:
            return v
        # 简单的中国手机号验证
        if not re.match(r'^1[3-9]\d{9}$', v):
            raise ValueError('无效的手机号码')
        return v


# 数据库中存储的用户属性
class UserInDB(UserBase):
    id: int
    email: Optional[str] = None
    phone: Optional[str] = None
    hashed_password: str
    is_active: bool
    role: str
    referral_code: Optional[str] = None
    referrer_id: Optional[int] = None
    reward_balance: float
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        orm_mode = True


# API响应中的用户属性
class User(UserBase):
    id: int
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    role: str
    referral_code: Optional[str] = None
    reward_balance: float
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        orm_mode = True


# 用户登录请求
class UserLogin(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str
    
    @validator('username', 'email', 'phone')
    def check_auth_fields(cls, v, values, **kwargs):
        field = kwargs['field']
        
        # 确保至少提供了用户名、邮箱或手机号之一
        if field.name == 'username' and v:
            return v
        if field.name == 'email' and v:
            return v
        if field.name == 'phone' and v:
            return v
        
        # 检查是否已经提供了其他登录方式
        if 'username' in values and values['username']:
            return v
        if 'email' in values and values['email']:
            return v
        if 'phone' in values and values['phone']:
            return v
        
        # 如果都没有提供，抛出错误
        if field.name == 'phone':
            raise ValueError('用户名、邮箱和手机号至少提供一个')
        
        return v


# 令牌响应
class Token(BaseModel):
    access_token: str
    token_type: str


# 令牌数据
class TokenPayload(BaseModel):
    sub: Optional[int] = None