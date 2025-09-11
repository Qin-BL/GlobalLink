# -*- coding: utf-8 -*-
"""
微信支付工具
"""
import hashlib
import time
import uuid
import logging
from typing import Dict, Any, Optional

from ..core.config import settings

logger = logging.getLogger(__name__)

class WeChatPayment:
    """微信支付处理器"""
    
    def __init__(self):
        self.app_id = getattr(settings, 'WECHAT_APP_ID', '')
        self.mch_id = getattr(settings, 'WECHAT_MCH_ID', '')
        self.api_key = getattr(settings, 'WECHAT_API_KEY', '')
        self.notify_url = getattr(settings, 'WECHAT_NOTIFY_URL', '')
    
    def generate_wechat_pay_qrcode(
        self,
        transaction_id: str,
        amount: float,
        description: str
    ) -> str:
        """
        生成微信支付二维码
        """
        try:
            # 构建支付参数
            params = {
                'appid': self.app_id,
                'mch_id': self.mch_id,
                'nonce_str': self._generate_nonce_str(),
                'body': description,
                'out_trade_no': transaction_id,
                'total_fee': int(amount * 100),  # 转换为分
                'spbill_create_ip': '127.0.0.1',
                'notify_url': self.notify_url,
                'trade_type': 'NATIVE'
            }
            
            # 生成签名
            params['sign'] = self._generate_sign(params)
            
            # 这里应该调用微信支付API
            # 由于这是示例代码，我们返回一个模拟的二维码URL
            qrcode_url = f"weixin://wxpay/bizpayurl?pr={transaction_id}"
            
            logger.info(f"生成微信支付二维码: {transaction_id}")
            return qrcode_url
            
        except Exception as e:
            logger.error(f"生成微信支付二维码失败: {e}")
            return ""
    
    def verify_payment_callback(self, callback_data: Dict[str, Any]) -> bool:
        """验证微信支付回调"""
        try:
            # 验证签名
            sign = callback_data.pop('sign', '')
            expected_sign = self._generate_sign(callback_data)
            
            if sign != expected_sign:
                logger.warning("微信支付回调签名验证失败")
                return False
            
            # 验证支付状态
            return callback_data.get('return_code') == 'SUCCESS' and \
                   callback_data.get('result_code') == 'SUCCESS'
                   
        except Exception as e:
            logger.error(f"验证微信支付回调失败: {e}")
            return False
    
    def _generate_nonce_str(self) -> str:
        """生成随机字符串"""
        return str(uuid.uuid4()).replace('-', '')
    
    def _generate_sign(self, params: Dict[str, Any]) -> str:
        """生成微信支付签名"""
        # 排序参数
        sorted_params = sorted(params.items())
        
        # 构建签名字符串
        sign_str = '&'.join([f"{k}={v}" for k, v in sorted_params if v])
        sign_str += f"&key={self.api_key}"
        
        # MD5加密
        return hashlib.md5(sign_str.encode('utf-8')).hexdigest().upper()

# 全局微信支付实例
wechat_payment = WeChatPayment()

def generate_wechat_pay_qrcode(
    transaction_id: str,
    amount: float,
    description: str
) -> str:
    """生成微信支付二维码的便捷函数"""
    return wechat_payment.generate_wechat_pay_qrcode(transaction_id, amount, description)

def verify_wechat_payment_callback(callback_data: Dict[str, Any]) -> bool:
    """验证微信支付回调的便捷函数"""
    return wechat_payment.verify_payment_callback(callback_data)