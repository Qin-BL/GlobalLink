from typing import Any, List, Optional
from datetime import datetime, timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.core.config import settings
from app.utils.wechat import generate_wechat_pay_qrcode

router = APIRouter()


@router.get("/", response_model=schemas.Membership)
def read_membership(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取用户的会员信息"""
    membership = deps.check_user_membership(db, current_user.id)
    if not membership:
        raise HTTPException(status_code=404, detail="未找到有效的会员")
    
    return membership


@router.post("/subscribe", response_model=schemas.Payment)
def subscribe_membership(
    *,
    db: Session = Depends(deps.get_db),
    membership_type: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """订阅会员"""
    # 验证会员类型
    if membership_type not in ["monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="无效的会员类型")
    
    # 确定会员价格
    amount = (
        settings.MONTHLY_MEMBERSHIP_PRICE
        if membership_type == "monthly"
        else settings.YEARLY_MEMBERSHIP_PRICE
    )
    
    # 创建支付记录
    payment = models.Payment(
        user_id=current_user.id,
        amount=amount,
        payment_type=membership_type,
        status="pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return payment


@router.get("/payment-qrcode", response_model=schemas.PaymentQRCode)
def get_payment_qrcode(
    *,
    db: Session = Depends(deps.get_db),
    payment_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取支付二维码"""
    # 查找支付记录
    payment = (
        db.query(models.Payment)
        .filter(
            models.Payment.id == payment_id,
            models.Payment.user_id == current_user.id,
            models.Payment.status == "pending"
        )
        .first()
    )
    
    if not payment:
        raise HTTPException(status_code=404, detail="未找到有效的支付记录")
    
    # 生成唯一的交易ID
    transaction_id = str(uuid.uuid4())
    payment.transaction_id = transaction_id
    db.commit()
    
    # 生成微信支付二维码
    qrcode_url = generate_wechat_pay_qrcode(
        transaction_id=transaction_id,
        amount=payment.amount,
        description=f"GlobalLink {payment.payment_type} 会员"
    )
    
    return {
        "payment_id": payment.id,
        "qrcode_url": qrcode_url
    }


@router.post("/payment-callback", response_model=dict)
def payment_callback(
    *,
    db: Session = Depends(deps.get_db),
    transaction_id: str,
    status: str,
) -> Any:
    """支付回调处理"""
    # 查找支付记录
    payment = (
        db.query(models.Payment)
        .filter(
            models.Payment.transaction_id == transaction_id,
            models.Payment.status == "pending"
        )
        .first()
    )
    
    if not payment:
        raise HTTPException(status_code=404, detail="未找到有效的支付记录")
    
    # 更新支付状态
    payment.status = status
    db.commit()
    
    # 如果支付成功，创建或更新会员
    if status == "completed":
        # 查找现有会员
        membership = (
            db.query(models.Membership)
            .filter(
                models.Membership.user_id == payment.user_id,
                models.Membership.is_active == True
            )
            .first()
        )
        
        now = datetime.utcnow()
        
        # 确定会员期限
        if payment.payment_type == "monthly":
            duration = timedelta(days=30)
        else:  # yearly
            duration = timedelta(days=365)
        
        # 如果存在有效会员，延长期限
        if membership and membership.end_date > now:
            membership.end_date = membership.end_date + duration
        # 否则，创建新会员
        else:
            membership = models.Membership(
                user_id=payment.user_id,
                membership_type=payment.payment_type,
                start_date=now,
                end_date=now + duration,
                is_active=True
            )
            db.add(membership)
        
        db.commit()
        
        # 处理推广奖励
        user = db.query(models.User).filter(models.User.id == payment.user_id).first()
        if user and user.referrer_id:
            # 计算奖励金额
            reward_amount = payment.amount * settings.REFERRAL_RATE
            
            # 创建奖励记录
            reward = models.Reward(
                user_id=user.referrer_id,
                amount=reward_amount,
                source="referral",
                related_payment_id=payment.id,
                related_user_id=user.id,  # 添加被推广用户ID
                status="available"
            )
            db.add(reward)
            
            # 更新推广人的奖励金余额
            referrer = db.query(models.User).filter(models.User.id == user.referrer_id).first()
            if referrer:
                referrer.reward_balance += reward_amount
                db.add(referrer)
            
            db.commit()
    
    return {"status": "success"}


@router.get("/rewards", response_model=List[schemas.Reward])
def read_rewards(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取用户的奖励金记录"""
    rewards = (
        db.query(models.Reward)
        .filter(models.Reward.user_id == current_user.id)
        .all()
    )
    return rewards


@router.post("/withdraw", response_model=schemas.Withdrawal)
def withdraw_reward(
    *,
    db: Session = Depends(deps.get_db),
    withdrawal_in: schemas.WithdrawalCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """提现奖励金"""
    # 确保用户只能提现自己的奖励金
    if withdrawal_in.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只能提现自己的奖励金",
        )
    
    # 检查用户的奖励金余额是否足够
    if current_user.reward_balance < withdrawal_in.amount:
        raise HTTPException(status_code=400, detail="奖励金余额不足")
    
    # 创建提现记录
    withdrawal = models.Withdrawal(
        user_id=current_user.id,
        amount=withdrawal_in.amount,
        payment_method=withdrawal_in.payment_method,
        account_info=withdrawal_in.account_info,
        status="pending"
    )
    db.add(withdrawal)
    
    # 扣减用户的奖励金余额
    current_user.reward_balance -= withdrawal_in.amount
    db.add(current_user)
    
    db.commit()
    db.refresh(withdrawal)
    
    return withdrawal


@router.get("/payment-status", response_model=schemas.Payment)
def get_payment_status(
    *,
    db: Session = Depends(deps.get_db),
    payment_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """获取支付状态"""
    # 查找支付记录
    payment = (
        db.query(models.Payment)
        .filter(
            models.Payment.id == payment_id,
            models.Payment.user_id == current_user.id
        )
        .first()
    )
    
    if not payment:
        raise HTTPException(status_code=404, detail="未找到支付记录")
    
    return payment