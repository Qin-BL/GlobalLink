from datetime import datetime
from pydantic import BaseModel, EmailStr, validator, Field
import re


# 共享属性
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="用户名")


# 创建用户时的属性
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="密码")
    email: EmailStr | None = Field(None, description="邮箱地址")
    phone: str | None = Field(None, description="手机号码")
    referral_code: str | None = Field(None, description="推广人的推广码")
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is None:
            return v
        # 中国手机号验证
        if not re.match(r'^1[3-9]\d{9}$', v):
            raise ValueError('无效的手机号码')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        # 用户名只能包含字母、数字、下划线
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('用户名只能包含字母、数字和下划线')
        return v


# 更新用户时的属性
class UserUpdate(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=50)
    email: EmailStr | None = None
    phone: str | None = None
    password: str | None = Field(None, min_length=8)
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is None:
            return v
        if not re.match(r'^1[3-9]\d{9}$', v):
            raise ValueError('无效的手机号码')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        if v is None:
            return v
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('用户名只能包含字母、数字和下划线')
        return v


# API响应中的用户属性
class UserResponse(UserBase):
    id: int
    email: str | None = None
    phone: str | None = None
    is_active: bool
    is_admin: bool
    is_superuser: bool
    referral_code: str | None = None
    reward_balance: float
    created_at: datetime
    updated_at: datetime
    last_login: datetime | None = None
    
    class Config:
        orm_mode = True


# 数据库中存储的用户属性（内部使用）
class UserInDB(UserResponse):
    hashed_password: str


# 用户登录请求
class UserLogin(BaseModel):
    username: str = Field(..., description="用户名、邮箱或手机号")
    password: str = Field(..., description="密码")


# 令牌响应
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str


# 令牌数据
class TokenPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None


# 管理员创建用户
class UserCreateAdmin(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    email: EmailStr | None = None
    phone: str | None = None
    is_active: bool = True
    is_admin: bool = False
    is_superuser: bool = False
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is None:
            return v
        if not re.match(r'^1[3-9]\d{9}$', v):
            raise ValueError('无效的手机号码')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('用户名只能包含字母、数字和下划线')
        return v


# 管理员更新用户
class UserUpdateAdmin(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=50)
    email: EmailStr | None = None
    phone: str | None = None
    password: str | None = Field(None, min_length=6)
    is_active: bool | None = None
    is_admin: bool | None = None
    is_superuser: bool | None = None
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is None:
            return v
        if not re.match(r'^1[3-9]\d{9}$', v):
            raise ValueError('无效的手机号码')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        if v is None:
            return v
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('用户名只能包含字母、数字和下划线')
        return v


# 推广信息响应
class ReferralInfo(BaseModel):
    referral_code: str
    referral_rate: float
    reward_balance: float
    total_referred: int = 0


# 推广历史记录
class ReferralHistory(BaseModel):
    id: int
    username: str
    register_time: datetime
    membership_status: str
    reward_status: str
    reward_amount: float | None = None


# 用户统计信息（管理员使用）
class UserStats(BaseModel):
    total_users: int
    active_users: int
    new_users_today: int
    new_users_this_month: int


# 简化的用户信息（用于列表显示）
class UserSummary(BaseModel):
    id: int
    username: str
    email: str | None = None
    is_active: bool
    is_admin: bool
    created_at: datetime
    last_login: datetime | None = None
    
    class Config:
        orm_mode = True


# 兼容性别名
User = UserResponse