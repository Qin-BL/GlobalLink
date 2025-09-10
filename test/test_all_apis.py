#!/usr/bin/env python3
"""
GlobalLink 测试环境接口测试脚本
测试环境服务器: 47.108.76.21
"""

import requests
import json
import sys
import os
from typing import Dict, List, Optional

class GlobalLinkAPITester:
    def __init__(self, base_url: str = "http://47.108.76.21:8000"):
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
    
    def test_auth_endpoints(self) -> bool:
        """测试认证相关接口"""
        print("=== 测试认证接口 ===")
        
        # 1. 测试获取验证码
        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/auth/send-verification-code",
                json={"email": "test@example.com"},
                headers={"Content-Type": "application/json"}
            )
            self.print_result("发送验证码", response.status_code in [200, 400])
        except Exception as e:
            self.print_result("发送验证码", False)
        
        # 2. 测试刷新令牌（如果已登录）
        if self.refresh_token:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/v1/auth/refresh",
                    json={"refresh_token": self.refresh_token},
                    headers={"Content-Type": "application/json"}
                )
                self.print_result("刷新令牌", response.status_code == 200)
            except Exception as e:
                self.print_result("刷新令牌", False)
        
        return True
    
    def test_courses_endpoints(self) -> bool:
        """测试课程相关接口"""
        print("=== 测试课程接口 ===")
        
        # 1. 获取课程列表
        try:
            response = self.session.get(f"{self.base_url}/api/v1/courses/")
            success = response.status_code == 200
            self.print_result("获取课程列表", success, response if not success else None)
            
            if success:
                courses = response.json()
                print(f"  获取到 {len(courses)} 门课程")
                
                # 2. 测试获取单个课程详情
                if courses:
                    course_id = courses[0]["id"]
                    response = self.session.get(f"{self.base_url}/api/v1/courses/{course_id}")
                    self.print_result("获取课程详情", response.status_code == 200)
                    
                    # 3. 测试获取课程知识点
                    response = self.session.get(f"{self.base_url}/api/v1/courses/{course_id}/knowledge-points")
                    self.print_result("获取课程知识点", response.status_code == 200)
                    
                    if response.status_code == 200:
                        knowledge_points = response.json()
                        print(f"  获取到 {len(knowledge_points)} 个知识点")
                        
                        # 4. 测试获取单个知识点
                        if knowledge_points:
                            kp_id = knowledge_points[0]["id"]
                            response = self.session.get(f"{self.base_url}/api/v1/knowledge-points/{kp_id}")
                            self.print_result("获取知识点详情", response.status_code == 200)
        
        except Exception as e:
            self.print_result("课程接口测试", False)
            print(f"  异常: {e}")
        
        return True
    
    def test_users_endpoints(self) -> bool:
        """测试用户相关接口"""
        print("=== 测试用户接口 ===")
        
        try:
            # 1. 获取当前用户信息
            response = self.session.get(f"{self.base_url}/api/v1/users/me")
            success = response.status_code == 200
            self.print_result("获取用户信息", success, response if not success else None)
            
            if success:
                user_info = response.json()
                print(f"  用户: {user_info.get('email')}")
                print(f"  会员状态: {user_info.get('is_member', False)}")
        
        except Exception as e:
            self.print_result("用户接口测试", False)
            print(f"  异常: {e}")
        
        return True
    
    def test_payment_endpoints(self) -> bool:
        """测试支付相关接口"""
        print("=== 测试支付接口 ===")
        
        try:
            # 1. 获取会员价格
            response = self.session.get(f"{self.base_url}/api/v1/payments/membership-prices")
            success = response.status_code == 200
            self.print_result("获取会员价格", success, response if not success else None)
            
            if success:
                prices = response.json()
                print(f"  月会员: ¥{prices.get('monthly_price', 0)}")
                print(f"  年会员: ¥{prices.get('yearly_price', 0)}")
        
        except Exception as e:
            self.print_result("支付接口测试", False)
            print(f"  异常: {e}")
        
        return True
    
    def test_health_endpoints(self) -> bool:
        """测试健康检查接口"""
        print("=== 测试健康检查接口 ===")
        
        try:
            # 1. 健康检查
            response = self.session.get(f"{self.base_url}/api/v1/health")
            success = response.status_code == 200
            self.print_result("健康检查", success, response if not success else None)
            
            if success:
                health_info = response.json()
                print(f"  状态: {health_info.get('status', 'unknown')}")
                print(f"  版本: {health_info.get('version', 'unknown')}")
            
            # 2. 测试邮件服务健康检查
            response = self.session.get(f"{self.base_url}/api/v1/health/email")
            email_success = response.status_code == 200
            self.print_result("邮件服务健康检查", email_success, response if not email_success else None)
            
            if email_success:
                email_health = response.json()
                print(f"  邮件服务状态: {email_health.get('status', 'unknown')}")
                print(f"  配置服务器: {email_health.get('server', 'unknown')}")
            
            return success and email_success
            
        except Exception as e:
            self.print_result("健康检查接口测试", False)
            print(f"  异常: {e}")
            return False
    
    def run_all_tests(self, email: str, password: str) -> bool:
        """运行所有测试"""
        print(f"开始测试 GlobalLink 接口")
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
        self.test_health_endpoints()
        self.test_auth_endpoints()
        self.test_courses_endpoints()
        self.test_users_endpoints()
        self.test_payment_endpoints()
        
        print("=" * 50)
        print("所有接口测试完成！")
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
    tester = GlobalLinkAPITester(base_url)
    tester.run_all_tests(email, password)
    
    print("\n" + "="*60)
    print("提示：要测试错误通知功能，请运行:")
    print("python test_error_notification.py [base_url] [email] [password]")
    print("="*60)

if __name__ == "__main__":
    main()