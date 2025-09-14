"""
双因素认证工具函数
提供TOTP（基于时间的一次性密码）生成、验证和恢复码管理功能
"""
import pyotp
import base64
import secrets
import json
from datetime import datetime, timezone
import hashlib
from passlib.context import CryptContext
from typing import List, Tuple

# 密码上下文，用于加密恢复码
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_totp_secret() -> str:
    """
    生成新的TOTP密钥
    :return: base32编码的密钥字符串
    """
    return pyotp.random_base32()


def get_totp_uri(secret: str, username: str, issuer_name: str = "GlobalLink") -> str:
    """
    生成TOTP URI，用于创建二维码
    :param secret: TOTP密钥
    :param username: 用户名
    :param issuer_name: 发行者名称
    :return: TOTP URI字符串
    """
    return pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name=issuer_name)


def generate_qr_code_data(uri: str) -> str:
    """
    生成二维码数据URL（简化版本，实际应用中可能需要使用qrcode库）
    :param uri: TOTP URI
    :return: 数据URL字符串
    """
    # 注意：实际应用中应使用qrcode库生成真实的二维码图片
    # 这里返回一个简化的表示
    import qrcode
    from io import BytesIO
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    img_bytes = buffer.getvalue()
    
    return base64.b64encode(img_bytes).decode('utf-8')


def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    """
    验证TOTP验证码
    :param secret: TOTP密钥
    :param code: 用户输入的验证码
    :param window: 时间窗口（向前/向后多少步）
    :return: 验证是否通过
    """
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=window)


def generate_recovery_codes(count: int = 10) -> List[str]:
    """
    生成恢复码列表
    :param count: 恢复码数量
    :return: 恢复码列表
    """
    codes = []
    for _ in range(count):
        # 生成16位随机字符串，格式化为4-4-4-4
        code = secrets.token_hex(8)
        formatted_code = f"{code[:4]}-{code[4:8]}-{code[8:12]}-{code[12:16]}"
        codes.append(formatted_code)
    return codes


def hash_recovery_code(code: str) -> str:
    """
    哈希单个恢复码
    :param code: 原始恢复码
    :return: 哈希后的恢复码
    """
    # 使用bcrypt加密恢复码
    return pwd_context.hash(code)


def hash_recovery_codes(codes: List[str]) -> str:
    """
    哈希多个恢复码并序列化为JSON
    :param codes: 原始恢复码列表
    :return: JSON格式的哈希恢复码字符串
    """
    hashed_codes = [hash_recovery_code(code) for code in codes]
    return json.dumps(hashed_codes)


def verify_recovery_code(hashed_codes_json: str, code: str) -> Tuple[bool, List[str]]:
    """
    验证恢复码并返回更新后的恢复码列表
    :param hashed_codes_json: 哈希恢复码的JSON字符串
    :param code: 用户输入的恢复码
    :return: (验证是否通过, 更新后的哈希恢复码列表)
    """
    if not hashed_codes_json:
        return False, []
    
    try:
        hashed_codes = json.loads(hashed_codes_json)
        # 创建一个新的列表，排除已使用的恢复码
        remaining_codes = []
        is_valid = False
        
        for hashed_code in hashed_codes:
            if pwd_context.verify(code, hashed_code):
                is_valid = True
            else:
                remaining_codes.append(hashed_code)
        
        return is_valid, remaining_codes
    except json.JSONDecodeError:
        return False, []


def get_current_timestamp() -> datetime:
    """
    获取当前时间戳（带时区）
    :return: 当前时间
    """
    return datetime.now(timezone.utc)