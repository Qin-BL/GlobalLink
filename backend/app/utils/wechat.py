from typing import Optional
import uuid
from wechatpy.pay import WeChatPay
from app.core.config import settings

# 初始化微信支付客户端
wechat_pay = WeChatPay(
    appid=settings.WECHAT_APP_ID,
    api_key=settings.WECHAT_API_KEY,
    mch_id=settings.WECHAT_MCH_ID,
)


def generate_wechat_pay_qrcode(
    transaction_id: str,
    amount: float,
    description: str,
    time_expire: Optional[str] = None,
) -> str:
    """生成微信支付二维码
    
    Args:
        transaction_id: 交易ID
        amount: 支付金额（元）
        description: 商品描述
        time_expire: 交易过期时间，格式为yyyyMMddHHmmss
        
    Returns:
        str: 支付二维码URL
    """
    # 将元转换为分
    amount_cents = int(amount * 100)
    
    # 创建统一下单
    result = wechat_pay.order.create(
        trade_type="NATIVE",
        body=description,
        out_trade_no=transaction_id,
        total_fee=amount_cents,
        notify_url=f"https://example.com/api/v1/membership/payment-callback",  # 替换为实际的回调URL
        time_expire=time_expire,
    )
    
    # 返回二维码URL
    return result["code_url"]


def verify_wechat_pay_callback(data: dict) -> bool:
    """验证微信支付回调
    
    Args:
        data: 回调数据
        
    Returns:
        bool: 验证是否成功
    """
    try:
        return wechat_pay.parse_payment_result(data)
    except Exception:
        return False