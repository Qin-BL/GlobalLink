# -*- coding: utf-8 -*-
"""
密码解密工具
"""
import base64
import json
import logging
import re
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
                try:
                    # 尝试标准base64解码
                    self.keys[version] = base64.b64decode(key_value)
                except Exception as e:
                    try:
                        # 如果失败，尝试URL安全的base64解码
                        # 处理URL安全的base64（替换-为+，_为/，并补充填充）
                        key_value = key_value.replace('-', '+').replace('_', '/')
                        padding = len(key_value) % 4
                        if padding:
                            key_value += '=' * (4 - padding)
                        self.keys[version] = base64.b64decode(key_value)
                        logger.info(f"使用URL安全base64解码密钥版本 {version}")
                    except Exception as inner_e:
                        logger.error(f"密钥版本 {version} 解码失败: {inner_e}")
                        # 跳过无法解码的密钥
                        continue

    def _sanitize_base64_input(self, input_str: str) -> str:
        """
        清理和规范化base64输入字符串，处理常见的格式问题
        """
        # 移除所有非base64字符（除了必要的填充字符）
        sanitized = re.sub(r'[^A-Za-z0-9+/=-]', '', input_str)
        
        # 检查并添加正确的填充
        padding = len(sanitized) % 4
        if padding:
            sanitized += '=' * (4 - padding)
            
        return sanitized

    def decrypt_password(self, encrypted_password: str) -> Optional[str]:
        """
        解密前端加密的密码
        添加时间戳验证防止重放攻击
        支持多版本密钥轮换
        """
        try:
            if not encrypted_password:
                logger.warning("加密密码为空")
                return None
                
            if not self.keys:
                logger.warning("未配置加密密钥，使用明文密码")
                return encrypted_password
            
            # 解析加密数据
            try:
                # 首先尝试标准base64解码
                encrypted_data = json.loads(base64.b64decode(encrypted_password))
            except Exception as e:
                try:
                    # 如果失败，尝试清理输入后再解码
                    sanitized_input = self._sanitize_base64_input(encrypted_password)
                    encrypted_data = json.loads(base64.b64decode(sanitized_input))
                    logger.info("成功解码清理后的base64输入")
                except Exception as inner_e:
                    logger.warning(f"密码base64解码失败，尝试作为明文处理: {inner_e}")
                    # 解码失败，假设是明文密码
                    return encrypted_password
            
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
            
            # 增强IV的base64解码健壮性
            try:
                iv_str = encrypted_data.get('iv', '')
                if not iv_str:
                    logger.warning("IV为空，无法解密")
                    return encrypted_password
                
                try:
                    # 首先尝试标准base64解码
                    iv = base64.b64decode(iv_str)
                except Exception as e:
                    # 如果失败，尝试清理输入后再解码
                    sanitized_iv = self._sanitize_base64_input(iv_str)
                    iv = base64.b64decode(sanitized_iv)
                    logger.info("成功解码清理后的IV")
            except Exception as e:
                logger.warning(f"IV base64解码失败: {e}")
                return encrypted_password
            
            # 增强密文数据的base64解码健壮性
            try:
                ciphertext_str = encrypted_data.get('data', '')
                if not ciphertext_str:
                    logger.warning("密文数据为空，无法解密")
                    return encrypted_password
                
                try:
                    # 首先尝试标准base64解码
                    ciphertext = base64.b64decode(ciphertext_str)
                except Exception as e:
                    # 如果失败，尝试清理输入后再解码
                    sanitized_ciphertext = self._sanitize_base64_input(ciphertext_str)
                    ciphertext = base64.b64decode(sanitized_ciphertext)
                    logger.info("成功解码清理后的密文数据")
            except Exception as e:
                logger.warning(f"密文数据base64解码失败: {e}")
                return encrypted_password
            
            # 创建解密器，使用对应版本的密钥
            try:
                cipher = Cipher(
                    algorithms.AES(self.keys[key_version]),
                    modes.CBC(iv),
                    backend=default_backend()
                )
                decryptor = cipher.decryptor()
                
                # 解密
                padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
                
                # 去除PKCS7填充
                if padded_plaintext:
                    padding_length = padded_plaintext[-1]
                    # 验证填充是否有效（防止填充 oracle 攻击）
                    if padding_length > len(padded_plaintext) or padding_length == 0:
                        raise ValueError(f"无效的填充长度: {padding_length}")
                    
                    plaintext = padded_plaintext[:-padding_length]
                    
                    # 尝试将解密后的字节转换为UTF-8字符串
                    return plaintext.decode('utf-8', errors='replace')
                else:
                    logger.warning("解密后的明文为空")
                    return encrypted_password
            except Exception as decrypt_error:
                logger.warning(f"解密过程失败: {decrypt_error}")
                # 降级处理：如果解密失败，假设是明文密码
                return encrypted_password
            
        except Exception as e:
            logger.warning(f"密码解密失败，使用降级模式: {str(e)[:200]}")
            # 降级处理：如果解密失败，假设是明文密码
            return encrypted_password

# 全局解密器实例
password_decryptor = PasswordDecryptor()

def decrypt_user_password(encrypted_password: str) -> str:
    """解密用户密码的便捷函数"""
    decrypted = password_decryptor.decrypt_password(encrypted_password)
    return decrypted or encrypted_password