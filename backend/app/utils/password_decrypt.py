# -*- coding: utf-8 -*-
"""
密码解密工具
"""
import base64
import json
import logging
from typing import Optional
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

from ..core.config import settings

logger = logging.getLogger(__name__)

class PasswordDecryptor:
    """密码解密器"""
    
    def __init__(self):
        # 从配置获取解密密钥
        self.encryption_key = getattr(settings, 'ENCRYPTION_KEY', None)
        if self.encryption_key:
            self.encryption_key = base64.b64decode(self.encryption_key)
    
    def decrypt_password(self, encrypted_password: str) -> Optional[str]:
        """
        解密前端加密的密码
        """
        try:
            if not self.encryption_key:
                logger.warning("未配置加密密钥，使用明文密码")
                return encrypted_password
            
            # 解析加密数据
            encrypted_data = json.loads(base64.b64decode(encrypted_password))
            iv = base64.b64decode(encrypted_data['iv'])
            ciphertext = base64.b64decode(encrypted_data['data'])
            
            # 创建解密器
            cipher = Cipher(
                algorithms.AES(self.encryption_key),
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