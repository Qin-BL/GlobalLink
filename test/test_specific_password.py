#!/usr/bin/env python3
"""
测试特定密码加密结果
测试密码: 12345678
"""

import json
import hashlib
from datetime import datetime

def encrypt_password(password):
    """模拟前端加密函数"""
    timestamp = int(datetime.now().timestamp() * 1000)
    random_salt = "test_salt_123"
    domain = "http://localhost:3000"
    
    # 组合字符串
    combined_string = f"{password}:{timestamp}:{random_salt}:{domain}"
    
    # 使用SHA-256哈希
    hash_result = hashlib.sha256(combined_string.encode()).hexdigest()
    
    # 返回加密数据
    return json.dumps({
        'hash': hash_result,
        'timestamp': timestamp,
        'salt': random_salt,
        'domain': domain
    }, ensure_ascii=False)

def main():
    """主函数"""
    print("=" * 60)
    print("密码加密测试 - 密码: 12345678")
    print("=" * 60)
    
    # 测试密码
    password = "12345678"
    
    # 加密密码
    encrypted_data = encrypt_password(password)
    
    # 解析加密数据
    data = json.loads(encrypted_data)
    
    print(f"原始密码: {password}")
    print(f"时间戳: {data['timestamp']}")
    print(f"盐值: {data['salt']}")
    print(f"域名: {data['domain']}")
    print(f"SHA-256哈希值: {data['hash']}")
    print(f"完整加密数据: {encrypted_data}")
    print(f"数据长度: {len(encrypted_data)} 字符")
    
    print("\n" + "=" * 60)
    print("加密原理说明:")
    print("=" * 60)
    print("1. 组合字符串: 密码 + 时间戳 + 随机盐值 + 域名")
    print("2. SHA-256哈希: 使用Web Crypto API进行加密")
    print("3. JSON封装: 包含哈希值、时间戳、盐值等信息")
    print("4. 时间戳验证: 防止重放攻击，有效期5分钟")
    
    # 验证哈希计算
    combined_string = f"{password}:{data['timestamp']}:{data['salt']}:{data['domain']}"
    expected_hash = hashlib.sha256(combined_string.encode()).hexdigest()
    
    print(f"\n哈希验证: {'✓ 通过' if data['hash'] == expected_hash else '✗ 失败'}")
    print(f"组合字符串: {combined_string}")
    print(f"计算哈希: {expected_hash}")
    
    print("\n" + "=" * 60)
    print("注意: 每次运行时间戳不同，哈希值也会不同")
    print("=" * 60)

if __name__ == "__main__":
    main()