# -*- coding: utf-8 -*-
"""
基于时间的一次性密码(TOTP)工具
用于双因素认证功能
"""
import base64
import struct
import time
import secrets
import string
from datetime import datetime, timedelta, UTC
import pyotp
import qrcode
from io import BytesIO
import hashlib
import json
from typing import Optional, List, Tuple

from ..core.config import settings

# TOTP配置
TOTP_DIGITS = 6  # 验证码位数
TOTP_INTERVAL = 30  # 验证码有效期（秒）
TOTP_ALGORITHM = 'sha1'  # 哈希算法
RECOVERY_CODE_LENGTH = 10  # 恢复码长度
RECOVERY_CODE_COUNT = 10  # 生成的恢复码数量


def generate_totp_secret() -> str:
    """
    生成新的TOTP密钥
    
    Returns:
        str: Base32编码的TOTP密钥
    """
    # 生成随机密钥并进行Base32编码
    return pyotp.random_base32()


def get_totp_uri(username: str, email: str, secret: str) -> str:
    """
    生成TOTP URI，用于生成QR码
    
    Args:
        username: 用户名
        email: 邮箱
        secret: TOTP密钥
        
    Returns:
        str: TOTP URI字符串
    """
    # 服务名称，通常是应用名称
    issuer_name = "GlobalLink"
    # 标签，通常是用户名或邮箱
    label = f"{issuer_name}:{email}"
    
    # 创建TOTP对象
    totp = pyotp.TOTP(
        secret,
        digits=TOTP_DIGITS,
        interval=TOTP_INTERVAL,
        algorithm=TOTP_ALGORITHM
    )
    
    # 生成URI
    return totp.provisioning_uri(
        name=username,
        issuer_name=issuer_name
    )


def generate_qr_code(uri: str) -> bytes:
    """
    根据TOTP URI生成QR码图片
    
    Args:
        uri: TOTP URI
        
    Returns:
        bytes: QR码图片的二进制数据
    """
    # 创建QR码对象
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    # 创建图片
    img = qr.make_image(fill_color="black", back_color="white")
    
    # 转换为二进制数据
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def verify_totp_code(secret: str, code: str) -> bool:
    """
    验证TOTP验证码
    
    Args:
        secret: TOTP密钥
        code: 用户输入的验证码
        
    Returns:
        bool: 验证码是否有效
    """
    try:
        # 创建TOTP对象
        totp = pyotp.TOTP(
            secret,
            digits=TOTP_DIGITS,
            interval=TOTP_INTERVAL,
            algorithm=TOTP_ALGORITHM
        )
        
        # 验证验证码
        # 允许一定的时间偏差（前后各一个时间窗口）
        return totp.verify(code, valid_window=1)
    except Exception:
        return False


def generate_recovery_codes() -> List[str]:
    """
    生成恢复码列表
    
    Returns:
        List[str]: 恢复码列表
    """
    recovery_codes = []
    alphabet = string.ascii_uppercase + string.digits
    
    # 生成指定数量的恢复码
    for _ in range(RECOVERY_CODE_COUNT):
        # 生成随机字符串
        code = ''.join(secrets.choice(alphabet) for _ in range(RECOVERY_CODE_LENGTH))
        # 格式化恢复码（每4个字符一组）
        formatted_code = '-'.join([code[i:i+4] for i in range(0, len(code), 4)])
        recovery_codes.append(formatted_code)
    
    return recovery_codes


def hash_recovery_codes(codes: List[str], salt: str) -> str:
    """
    加密存储恢复码
    
    Args:
        codes: 恢复码列表
        salt: 加密盐值
        
    Returns:
        str: 加密后的恢复码字符串
    """
    # 序列化恢复码列表
    codes_str = json.dumps(codes)
    
    # 使用盐值和哈希算法加密
    hashed = hashlib.sha256((codes_str + salt).encode()).hexdigest()
    
    # 返回盐值和哈希值的组合
    return json.dumps({
        "salt": salt,
        "hashed_codes": hashed,
        "codes": codes_str  # 实际项目中应该使用更强的加密方式
    })


def verify_recovery_code(encrypted_codes: str, code: str) -> Tuple[bool, Optional[List[str]]]:
    """
    验证恢复码
    
    Args:
        encrypted_codes: 加密后的恢复码字符串
        code: 用户输入的恢复码
        
    Returns:
        Tuple[bool, Optional[List[str]]]: (是否有效, 更新后的恢复码列表或None)
    """
    try:
        # 解析加密的恢复码
        data = json.loads(encrypted_codes)
        codes_str = data.get("codes")
        
        if not codes_str:
            return False, None
        
        # 解析恢复码列表
        codes = json.loads(codes_str)
        
        # 去除用户输入中的连字符并转为大写
        normalized_code = code.replace('-', '').upper()
        
        # 查找匹配的恢复码
        for i, recovery_code in enumerate(codes):
            normalized_recovery_code = recovery_code.replace('-', '').upper()
            if normalized_code == normalized_recovery_code:
                # 移除已使用的恢复码
                updated_codes = codes[:i] + codes[i+1:]
                # 如果所有恢复码都已使用，返回空列表
                return True, updated_codes
        
        # 未找到匹配的恢复码
        return False, None
    except Exception:
        return False, None


def should_enforce_2fa(user) -> bool:
    """
    检查是否应该强制用户使用双因素认证
    
    Args:
        user: 用户对象
        
    Returns:
        bool: 是否应该强制使用双因素认证
    """
    # 对管理员账户强制使用双因素认证
    if user.is_admin or user.is_superuser:
        return True
    
    # 可以根据其他条件添加更多规则
    # 例如：最近登录失败次数过多
    # 例如：用户角色包含敏感权限
    
    return False


def create_2fa_setup(user) -> Tuple[str, List[str], bytes]:
    """
    为用户创建双因素认证设置
    
    Args:
        user: 用户对象
        
    Returns:
        Tuple[str, List[str], bytes]: (TOTP密钥, 恢复码列表, QR码图片数据)
    """
    # 生成TOTP密钥
    secret = generate_totp_secret()
    
    # 生成恢复码
    recovery_codes = generate_recovery_codes()
    
    # 生成TOTP URI
    uri = get_totp_uri(user.username, user.email or user.username, secret)
    
    # 生成QR码
    qr_code_data = generate_qr_code(uri)
    
    return secret, recovery_codes, qr_code_data