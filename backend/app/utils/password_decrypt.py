# -*- coding: utf-8 -*-
"""
密码解密工具
"""
import base64
import json
import logging
from typing import Optional
from datetime import datetime, timedelta
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

from ..core.config import settings

logger = logging.getLogger(__name__)

class PasswordDecryptor:
    """密码解密器"""
    
    def __init__(self):
        # 初始化多版本密钥支持
        self.keys = {}
        # 获取支持的密钥版本列表，如果未配置则默认为版本1
        supported_versions = getattr(settings, 'SUPPORTED_KEY_VERSIONS', [1])
        # 为每个版本初始化密钥
        for version in supported_versions:
            # 优先从版本化密钥配置获取，否则使用默认密钥
            key_value = getattr(settings, 'ENCRYPTION_KEYS', {}).get(version, getattr(settings, 'ENCRYPTION_KEY', None))
            if key_value:
                self.keys[version] = base64.b64decode(key_value)
    
    def decrypt_password(self, encrypted_password: str) -> Optional[str]:
        """
        解密前端加密的密码
        添加时间戳验证防止重放攻击
        支持多版本密钥轮换
        """
        try:
            if not self.keys:
                logger.warning("未配置加密密钥，使用明文密码")
                return encrypted_password
            
            # 解析加密数据
            encrypted_data = json.loads(base64.b64decode(encrypted_password))
            
            # 验证时间戳，防止重放攻击
            if 'timestamp' in encrypted_data:
                try:
                    # 获取当前时间和加密时间
                    current_time = datetime.now().timestamp() * 1000  # 转为毫秒
                    encrypted_time = int(encrypted_data['timestamp'])
                    
                    # 允许5分钟的时间窗口（300,000毫秒）
                    time_diff = current_time - encrypted_time
                    if time_diff > 300000:
                        logger.warning(f"加密密码已过期，时间差: {time_diff/1000}秒")
                        raise Exception("加密密码已过期")
                    elif time_diff < 0:
                        logger.warning("加密密码时间戳异常，可能来自未来")
                        # 允许小的时间偏差（如服务器时间不同步）
                        if abs(time_diff) > 300000:
                            raise Exception("加密密码时间戳异常")
                except Exception as time_error:
                    logger.warning(f"时间戳验证失败: {time_error}")
                    # 时间戳验证失败，拒绝解密
                    raise
            
            # 获取密钥版本，默认为1
            key_version = encrypted_data.get('key_version', 1)
            
            # 检查密钥版本是否支持
            if key_version not in self.keys:
                logger.warning(f"不支持的密钥版本: {key_version}")
                raise Exception(f"不支持的密钥版本: {key_version}")
            
            iv = base64.b64decode(encrypted_data['iv'])
            ciphertext = base64.b64decode(encrypted_data['data'])
            
            # 创建解密器，使用对应版本的密钥
            cipher = Cipher(
                algorithms.AES(self.keys[key_version]),
                modes.CBC(iv),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            
            # 解密
            padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            
            # 去除PKCS7填充
            padding_length = padded_plaintext[-1]
            plaintext = padded_plaintext[:-padding_length]
            
            return plaintext.decode('utf-8')
            
        except Exception as e:
            logger.warning(f"密码解密失败，使用降级模式: {e}")
            # 降级处理：如果解密失败，假设是明文密码
            return encrypted_password

# 全局解密器实例
password_decryptor = PasswordDecryptor()

def decrypt_user_password(encrypted_password: str) -> str:
    """解密用户密码的便捷函数"""
    decrypted = password_decryptor.decrypt_password(encrypted_password)
    return decrypted or encrypted_password