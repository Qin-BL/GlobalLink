#!/usr/bin/env python3
"""
错误通知功能测试脚本
测试错误邮件通知功能是否正常工作
"""

import requests
import json
import sys
import os
from typing import Dict, List, Optional

class ErrorNotificationTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        
    def print_result(self, test_name: str, success: bool, response: Optional[requests.Response] = None):
        """打印测试结果"""
        status = "✓ 成功" if success else "✗ 失败"
        print(f"{test_name}: {status}")
        
        if response is not None and not success:
            print(f"  状态码: {response.status_code}")
            try:
                print(f"  响应: {response.text}")
            except:
                print(f"  响应: 无法读取")
        print()
    
    def login(self, email: str, password: str) -> bool:
        """用户登录"""
        try:
            # 使用OAuth2表单格式发送登录请求
            login_data = {
                "username": email,
                "password": password,
                "grant_type": "password",
                "scope": ""
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                result = response.json()
                self.access_token = result.get("access_token")
                self.refresh_token = result.get("refresh_token")
                
                # 设置认证头
                if self.access_token:
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.access_token}"
                    })
                return True
            return False
            
        except Exception as e:
            print(f"登录异常: {e}")
            return False
    
    def test_error_notification_config(self) -> bool:
        """测试错误通知配置信息"""
        print("=== 测试错误通知配置 ===")
        
        try:
            # 获取健康检查接口（可能触发错误通知）
            response = self.session.get(f"{self.base_url}/api/v1/health")
            success = response.status_code == 200
            self.print_result("健康检查接口", success, response if not success else None)
            
            if success:
                health_info = response.json()
                print(f"  服务状态: {health_info.get('status', 'unknown')}")
                print(f"  版本: {health_info.get('version', 'unknown')}")
                
            # 测试一个可能触发错误的接口
            response = self.session.get(f"{self.base_url}/api/v1/non-existent-endpoint")
            # 404错误不应该触发邮件通知
            self.print_result("测试404错误（不应触发通知）", response.status_code == 404)
            
            return True
            
        except Exception as e:
            self.print_result("错误通知配置测试", False)
            print(f"  异常: {e}")
            return False
    
    def test_server_error(self) -> bool:
        """测试服务器错误（可能触发邮件通知）"""
        print("=== 测试服务器错误 ===")
        
        try:
            # 测试一个可能触发服务器错误的接口
            # 注意：这个测试可能会触发邮件通知
            response = self.session.get(f"{self.base_url}/api/v1/test-error")
            
            # 500错误应该触发邮件通知
            success = response.status_code == 500
            self.print_result("测试服务器错误（可能触发通知）", success, response if not success else None)
            
            if response.status_code == 500:
                print("  ✓ 服务器错误已触发，请检查邮箱是否收到错误通知")
            
            return True
            
        except Exception as e:
            self.print_result("服务器错误测试", False)
            print(f"  异常: {e}")
            return False
    
    def test_email_configuration(self) -> bool:
        """测试邮件服务配置"""
        print("=== 测试邮件服务配置 ===")
        
        try:
            # 测试邮件服务状态
            response = self.session.get(f"{self.base_url}/api/v1/health/email")
            success = response.status_code == 200
            self.print_result("邮件服务健康检查", success, response if not success else None)
            
            if success:
                email_health = response.json()
                print(f"  邮件服务状态: {email_health.get('status', 'unknown')}")
                print(f"  配置服务器: {email_health.get('server', 'unknown')}")
            
            return True
            
        except Exception as e:
            self.print_result("邮件配置测试", False)
            print(f"  异常: {e}")
            return False
    
    def run_all_tests(self, email: str, password: str) -> bool:
        """运行所有测试"""
        print(f"开始测试错误通知功能")
        print(f"服务器: {self.base_url}")
        print(f"测试账号: {email}")
        print("=" * 50)
        
        # 登录
        print("正在登录...")
        login_success = self.login(email, password)
        self.print_result("用户登录", login_success)
        
        if not login_success:
            print("登录失败，无法继续测试")
            return False
        
        # 运行各个模块的测试
        self.test_error_notification_config()
        self.test_email_configuration()
        
        # 警告：以下测试会触发真实的错误通知
        print("警告：以下测试可能会触发真实的错误邮件通知！")
        print("请确保邮件配置正确，且接收邮箱已设置")
        confirm = input("是否继续测试服务器错误？(y/N): ")
        
        if confirm.lower() == 'y':
            self.test_server_error()
        else:
            print("跳过服务器错误测试")
        
        print("=" * 50)
        print("错误通知功能测试完成！")
        print("请检查配置的接收邮箱是否收到错误通知邮件")
        return True

def main():
    """主函数"""
    # 服务器配置
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:8000"
    
    # 测试账号（从参数或默认值获取）
    if len(sys.argv) > 3:
        email = sys.argv[2]
        password = sys.argv[3]
    else:
        # 使用提供的默认账号
        email = "15010993510@163.com"
        password = "12345678"
    
    # 创建测试器并运行测试
    tester = ErrorNotificationTester(base_url)
    tester.run_all_tests(email, password)

if __name__ == "__main__":
    main()