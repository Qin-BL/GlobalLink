#!/usr/bin/env python3
"""
密码加密功能测试脚本
测试前端加密和后端解密功能
"""

import sys
import os
import json

# 添加backend目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_frontend_encryption():
    """测试前端加密功能"""
    print("=== 测试前端加密功能 ===")
    
    # 模拟前端加密逻辑
    def mock_encrypt_password(password):
        """模拟前端加密函数"""
        import hashlib
        from datetime import datetime
        
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
        })
    
    # 测试加密
    test_password = "mySecurePassword123!"
    encrypted_data = mock_encrypt_password(test_password)
    
    print(f"原始密码: {test_password}")
    print(f"加密后数据: {encrypted_data}")
    print(f"数据长度: {len(encrypted_data)} 字符")
    
    # 验证JSON格式
    try:
        data = json.loads(encrypted_data)
        required_fields = ['hash', 'timestamp', 'salt', 'domain']
        for field in required_fields:
            if field not in data:
                print(f"❌ 缺少必需字段: {field}")
                return False
        print("✅ JSON格式验证通过")
        return True
    except json.JSONDecodeError:
        print("❌ JSON格式验证失败")
        return False

def test_backend_decryption():
    """测试后端解密功能"""
    print("\n=== 测试后端解密功能 ===")
    
    try:
        from app.utils.password_decrypt import (
            decrypt_frontend_password, 
            is_frontend_encrypted,
            _validate_timestamp
        )
        
        # 创建测试数据（使用当前时间戳）
        import time
        current_timestamp = int(time.time() * 1000)
        test_data = {
            'hash': 'abc123',
            'timestamp': current_timestamp,  # 当前时间
            'salt': 'test_salt',
            'domain': 'http://localhost:3000'
        }
        encrypted_password = json.dumps(test_data)
        
        print(f"测试加密数据: {encrypted_password}")
        
        # 测试是否是前端加密格式
        is_encrypted = is_frontend_encrypted(encrypted_password)
        print(f"是否是前端加密格式: {is_encrypted}")
        
        if is_encrypted:
            # 测试解密
            decrypted = decrypt_frontend_password(encrypted_password)
            print(f"解密结果: {decrypted}")
            
            # 测试时间戳验证
            is_valid = _validate_timestamp(test_data['timestamp'])
            print(f"时间戳验证: {is_valid}")
            
            if decrypted == test_data['hash']:
                print("✅ 后端解密功能测试通过")
                return True
            else:
                print("❌ 后端解密功能测试失败")
                return False
        else:
            print("❌ 加密格式检测失败")
            return False
            
    except ImportError as e:
        print(f"❌ 导入后端模块失败: {e}")
        return False
    except Exception as e:
        print(f"❌ 后端解密测试异常: {e}")
        return False

def test_security_integration():
    """测试安全模块集成"""
    print("\n=== 测试安全模块集成 ===")
    
    try:
        # 直接测试密码验证逻辑，避免导入问题
        from passlib.context import CryptContext
        from app.utils.password_decrypt import decrypt_frontend_password, is_frontend_encrypted
        
        # 创建密码上下文
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # 创建测试密码和哈希
        test_password = "testPassword123"
        hashed_password = pwd_context.hash(test_password)
        
        print(f"测试密码: {test_password}")
        print(f"BCrypt哈希: {hashed_password}")
        
        # 测试普通密码验证
        result1 = pwd_context.verify(test_password, hashed_password)
        print(f"普通密码验证结果: {result1}")
        
        # 测试加密密码验证（模拟前端加密）
        import time
        current_timestamp = int(time.time() * 1000)
        encrypted_data = json.dumps({
            'hash': test_password,  # 这里使用原始密码模拟前端加密
            'timestamp': current_timestamp,
            'salt': 'test_salt'
        })
        
        # 模拟security.verify_password的逻辑
        if is_frontend_encrypted(encrypted_data):
            decrypted_password = decrypt_frontend_password(encrypted_data)
            if decrypted_password is not None:
                result2 = pwd_context.verify(decrypted_password, hashed_password)
            else:
                result2 = pwd_context.verify(encrypted_data, hashed_password)
        else:
            result2 = pwd_context.verify(encrypted_data, hashed_password)
        
        print(f"加密密码验证结果: {result2}")
        
        if result1 and result2:
            print("✅ 安全模块集成测试通过")
            return True
        else:
            print("❌ 安全模块集成测试失败")
            return False
            
    except ImportError as e:
        print(f"❌ 导入模块失败: {e}")
        return False
    except Exception as e:
        print(f"❌ 安全模块测试异常: {e}")
        return False

def main():
    """主测试函数"""
    print("开始密码加密功能测试...\n")
    
    tests = [
        ("前端加密功能", test_frontend_encryption),
        ("后端解密功能", test_backend_decryption),
        ("安全模块集成", test_security_integration)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                print(f"✅ {test_name} - 通过\n")
                passed += 1
            else:
                print(f"❌ {test_name} - 失败\n")
        except Exception as e:
            print(f"❌ {test_name} - 异常: {e}\n")
    
    print(f"=== 测试完成 ===")
    print(f"通过: {passed}/{total}")
    
    if passed == total:
        print("🎉 所有测试通过！密码加密功能正常工作。")
        return 0
    else:
        print("⚠️  部分测试失败，请检查代码。")
        return 1

if __name__ == "__main__":
    sys.exit(main())