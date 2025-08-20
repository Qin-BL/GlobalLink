from typing import Optional
from datetime import datetime
from pydantic import BaseModel


# 会员基础模式
class MembershipBase(BaseModel):
    membership_type: str  # 'monthly' or 'yearly'


# 创建会员时的属性
class MembershipCreate(MembershipBase):
    user_id: int
    start_date: datetime
    end_date: datetime


# 数据库中的会员
class MembershipInDB(MembershipBase):
    id: int
    user_id: int
    start_date: datetime
    end_date: datetime
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True


# API响应中的会员
class Membership(MembershipBase):
    id: int
    start_date: datetime
    end_date: datetime
    is_active: bool
    
    class Config:
        orm_mode = True


# 支付基础模式
class PaymentBase(BaseModel):
    amount: float
    payment_type: str  # 'monthly' or 'yearly'


# 创建支付时的属性
class PaymentCreate(PaymentBase):
    user_id: int


# 数据库中的支付
class PaymentInDB(PaymentBase):
    id: int
    user_id: int
    transaction_id: Optional[str] = None
    status: str  # 'pending', 'completed', 'failed'
    created_at: datetime
    
    class Config:
        orm_mode = True


# API响应中的支付
class Payment(PaymentBase):
    id: int
    status: str
    created_at: datetime
    
    class Config:
        orm_mode = True


# 支付二维码响应
class PaymentQRCode(BaseModel):
    payment_id: int
    qrcode_url: str


# 奖励金基础模式
class RewardBase(BaseModel):
    amount: float
    source: str  # 'referral'


# 创建奖励金时的属性
class RewardCreate(RewardBase):
    user_id: int
    related_payment_id: Optional[int] = None
    related_user_id: Optional[int] = None


# 数据库中的奖励金
class RewardInDB(RewardBase):
    id: int
    user_id: int
    related_payment_id: Optional[int] = None
    related_user_id: Optional[int] = None
    status: str  # 'pending', 'available', 'withdrawn'
    created_at: datetime
    
    class Config:
        orm_mode = True


# API响应中的奖励金
class Reward(RewardBase):
    id: int
    status: str
    created_at: datetime
    
    class Config:
        orm_mode = True


# 提现基础模式
class WithdrawalBase(BaseModel):
    amount: float
    payment_method: str  # 'wechat', 'alipay', 'bank'
    account_info: str


# 创建提现时的属性
class WithdrawalCreate(WithdrawalBase):
    user_id: int


# 数据库中的提现
class WithdrawalInDB(WithdrawalBase):
    id: int
    user_id: int
    status: str  # 'pending', 'completed', 'failed'
    created_at: datetime
    
    class Config:
        orm_mode = True


# API响应中的提现
class Withdrawal(WithdrawalBase):
    id: int
    status: str
    created_at: datetime
    
    class Config:
        orm_mode = True