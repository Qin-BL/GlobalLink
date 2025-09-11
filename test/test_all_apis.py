#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
功能测试模块 - API接口测试套件
测试完整的API接口功能

测试范围:
- 认证接口（登录、注册、令牌刷新）
- 课程接口（获取课程列表、课程详情）
- 用户接口（用户信息、学习进度）
- 支付接口（创建订单、查询订单）
- 健康检查接口（服务状态、数据库状态、邮件服务状态）
"""

import requests
import json
import sys
import os
import time
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin

class GlobalLinkAPITester:
    """GlobalLink API功能测试器"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.user_info = None
        self.test_results = {}
        
        # 设置请求头
        self.session.headers.update({
            'User-Agent': 'GlobalLink-API-Tester/2.0',
            'Accept': 'application/json'
        })
        
        # 测试统计
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Optional[requests.Response]:
        """安全地发起HTTP请求"""
        try:
            url = urljoin(self.base_url + '/', endpoint.lstrip('/'))
            # 设置默认超时
            if 'timeout' not in kwargs:
                kwargs['timeout'] = 30
            response = getattr(self.session, method.lower())(url, **kwargs)
            return response
        except requests.exceptions.RequestException as e:
            print(f"  ✗ 请求异常 {method} {endpoint}: {e}")
            return None
    
    def print_result(self, test_name: str, success: bool, response: Optional[requests.Response] = None, details: str = ""):
        """打印测试结果"""
        self.total_tests += 1
        
        if success:
            self.passed_tests += 1
            status = "✓ 成功"
            print(f"  {test_name:30} {status}")
            if details:
                print(f"    {details}")
        else:
            self.failed_tests += 1
            status = "✗ 失败"
            print(f"  {test_name:30} {status}")
            
            if response is not None:
                print(f"    状态码: {response.status_code}")
                try:
                    if response.headers.get('content-type', '').startswith('application/json'):
                        error_data = response.json()
                        if 'detail' in error_data:
                            print(f"    错误: {error_data['detail']}")
                        elif 'message' in error_data:
                            print(f"    错误: {error_data['message']}")
                    else:
                        print(f"    响应: {response.text[:200]}...")
                except:
                    print(f"    响应: 无法解析")
            
            if details:
                print(f"    详情: {details}")
    
    def login(self, email: str, password: str) -> bool:
        """用户登录"""
        print("\n=== 认证测试 ===")
        
        try:
            # 使用OAuth2表单格式发送登录请求
            login_data = {
                "username": email,
                "password": password,
                "grant_type": "password",
                "scope": ""
            }
            
            response = self._make_request(
                'POST',
                '/api/v1/auth/login',
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response is None:
                self.print_result("用户登录", False, details="连接失败")
                return False
            
            if response.status_code == 200:
                result = response.json()
                self.access_token = result.get("access_token")
                self.refresh_token = result.get("refresh_token")
                
                # 设置认证头
                if self.access_token:
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.access_token}"
                    })
                
                self.print_result(
                    "用户登录", 
                    True, 
                    details=f"令牌类型: {result.get('token_type', 'bearer')}"
                )
                return True
            else:
                self.print_result("用户登录", False, response)
                return False
                
        except Exception as e:
            self.print_result("用户登录", False, details=f"异常: {e}")
            return False
    
    def test_auth_endpoints(self) -> Dict[str, bool]:
        """测试认证相关接口"""
        results = {}
        
        # 1. 测试发送验证码
        try:
            response = self._make_request(
                'POST',
                '/api/v1/auth/send-verification-code',
                json={"email": "test@example.com"},
                headers={"Content-Type": "application/json"}
            )
            
            if response is None:
                success = False
                details = "连接失败"
            else:
                # 验证码接口可能返回200（成功）或400（邮箱已存在等）
                success = response.status_code in [200, 400, 422]
                details = f"状态码: {response.status_code}"
                
                if response.status_code == 200:
                    details += " - 验证码已发送"
                elif response.status_code == 400:
                    details += " - 邮箱可能已存在"
            
            results['send_verification_code'] = success
            self.print_result("发送验证码", success, response, details)
            
        except Exception as e:
            results['send_verification_code'] = False
            self.print_result("发送验证码", False, details=f"异常: {e}")
        
        # 2. 测试刷新令牌（如果已登录）
        if self.refresh_token:
            try:
                response = self._make_request(
                    'POST',
                    '/api/v1/auth/refresh',
                    json={"refresh_token": self.refresh_token},
                    headers={"Content-Type": "application/json"}
                )
                
                if response is None:
                    success = False
                    details = "连接失败"
                else:
                    success = response.status_code == 200
                    if success:
                        new_tokens = response.json()
                        # 更新令牌
                        if 'access_token' in new_tokens:
                            self.access_token = new_tokens['access_token']
                            self.session.headers.update({
                                "Authorization": f"Bearer {self.access_token}"
                            })
                        details = "令牌刷新成功"
                    else:
                        details = f"状态码: {response.status_code}"
                
                results['refresh_token'] = success
                self.print_result("刷新令牌", success, response, details)
                
            except Exception as e:
                results['refresh_token'] = False
                self.print_result("刷新令牌", False, details=f"异常: {e}")
        else:
            results['refresh_token'] = None
            print("  刷新令牌                        ⏸️ 跳过 (未登录)")
        
        # 3. 测试用户注册（使用测试邮箱）
        try:
            test_email = f"test_{int(time.time())}@example.com"
            response = self._make_request(
                'POST',
                '/api/v1/auth/register',
                json={
                    "email": test_email,
                    "password": "test_password_123",
                    "verification_code": "000000"  # 测试验证码
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response is None:
                success = False
                details = "连接失败"
            else:
                # 注册接口可能返回201（成功）或400（验证码错误等）
                success = response.status_code in [201, 400, 422]
                details = f"状态码: {response.status_code}"
                
                if response.status_code == 201:
                    details += " - 注册成功"
                elif response.status_code == 400:
                    details += " - 验证码错误或其他问题"
            
            results['user_register'] = success
            self.print_result("用户注册", success, response, details)
            
        except Exception as e:
            results['user_register'] = False
            self.print_result("用户注册", False, details=f"异常: {e}")
        
        return results
    
    def test_courses_endpoints(self) -> Dict[str, bool]:
        """测试课程相关接口"""
        print("\n=== 课程接口测试 ===")
        results = {}
        
        # 1. 获取课程列表
        try:
            response = self._make_request('GET', '/api/v1/courses/')
            
            if response is None:
                success = False
                details = "连接失败"
                courses = []
            else:
                success = response.status_code == 200
                if success:
                    courses = response.json()
                    details = f"获取到 {len(courses)} 门课程"
                else:
                    courses = []
                    details = f"状态码: {response.status_code}"
            
            results['get_courses'] = success
            self.print_result("获取课程列表", success, response, details)
            
        except Exception as e:
            results['get_courses'] = False
            courses = []
            self.print_result("获取课程列表", False, details=f"异常: {e}")
        
        # 2. 测试获取单个课程详情
        if courses and len(courses) > 0:
            try:
                course_id = courses[0]["id"]
                response = self._make_request('GET', f'/api/v1/courses/{course_id}')
                
                if response is None:
                    success = False
                    details = "连接失败"
                else:
                    success = response.status_code == 200
                    if success:
                        course_detail = response.json()
                        details = f"课程: {course_detail.get('title', '未知')}"
                    else:
                        details = f"状态码: {response.status_code}"
                
                results['get_course_detail'] = success
                self.print_result("获取课程详情", success, response, details)
                
            except Exception as e:
                results['get_course_detail'] = False
                self.print_result("获取课程详情", False, details=f"异常: {e}")
            
            # 3. 测试获取课程知识点
            try:
                course_id = courses[0]["id"]
                response = self._make_request('GET', f'/api/v1/courses/{course_id}/knowledge-points')
                
                if response is None:
                    success = False
                    details = "连接失败"
                    knowledge_points = []
                else:
                    success = response.status_code == 200
                    if success:
                        knowledge_points = response.json()
                        details = f"获取到 {len(knowledge_points)} 个知识点"
                    else:
                        knowledge_points = []
                        details = f"状态码: {response.status_code}"
                
                results['get_knowledge_points'] = success
                self.print_result("获取课程知识点", success, response, details)
                
                # 4. 测试获取单个知识点详情
                if knowledge_points and len(knowledge_points) > 0:
                    try:
                        kp_id = knowledge_points[0]["id"]
                        response = self._make_request('GET', f'/api/v1/knowledge-points/{kp_id}')
                        
                        if response is None:
                            success = False
                            details = "连接失败"
                        else:
                            success = response.status_code == 200
                            if success:
                                kp_detail = response.json()
                                details = f"知识点: {kp_detail.get('title', '未知')}"
                            else:
                                details = f"状态码: {response.status_code}"
                        
                        results['get_knowledge_point_detail'] = success
                        self.print_result("获取知识点详情", success, response, details)
                        
                    except Exception as e:
                        results['get_knowledge_point_detail'] = False
                        self.print_result("获取知识点详情", False, details=f"异常: {e}")
                else:
                    results['get_knowledge_point_detail'] = None
                    print("  获取知识点详情                  ⏸️ 跳过 (无知识点数据)")
                
            except Exception as e:
                results['get_knowledge_points'] = False
                self.print_result("获取课程知识点", False, details=f"异常: {e}")
        else:
            results['get_course_detail'] = None
            results['get_knowledge_points'] = None
            results['get_knowledge_point_detail'] = None
            print("  获取课程详情                    ⏸️ 跳过 (无课程数据)")
            print("  获取课程知识点                  ⏸️ 跳过 (无课程数据)")
            print("  获取知识点详情                  ⏸️ 跳过 (无课程数据)")
        
        return results
    
    def test_users_endpoints(self) -> Dict[str, bool]:
        """测试用户相关接口"""
        print("\n=== 用户接口测试 ===")
        results = {}
        
        # 1. 获取当前用户信息
        try:
            response = self._make_request('GET', '/api/v1/users/me')
            
            if response is None:
                success = False
                details = "连接失败"
            else:
                success = response.status_code == 200
                if success:
                    self.user_info = response.json()
                    details = f"用户: {self.user_info.get('email', '未知')}, 会员: {self.user_info.get('is_member', False)}"
                else:
                    details = f"状态码: {response.status_code}"
                    if response.status_code == 401:
                        details += " - 未认证"
            
            results['get_user_info'] = success
            self.print_result("获取用户信息", success, response, details)
            
        except Exception as e:
            results['get_user_info'] = False
            self.print_result("获取用户信息", False, details=f"异常: {e}")
        
        # 2. 测试更新用户信息（如果已登录）
        if self.user_info:
            try:
                update_data = {
                    "nickname": "测试用户昵称"
                }
                response = self._make_request(
                    'PUT',
                    '/api/v1/users/me',
                    json=update_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response is None:
                    success = False
                    details = "连接失败"
                else:
                    success = response.status_code == 200
                    if success:
                        updated_info = response.json()
                        details = f"昵称更新为: {updated_info.get('nickname', '未知')}"
                    else:
                        details = f"状态码: {response.status_code}"
                
                results['update_user_info'] = success
                self.print_result("更新用户信息", success, response, details)
                
            except Exception as e:
                results['update_user_info'] = False
                self.print_result("更新用户信息", False, details=f"异常: {e}")
        else:
            results['update_user_info'] = None
            print("  更新用户信息                    ⏸️ 跳过 (未获取到用户信息)")
        
        return results
    
    def test_payment_endpoints(self) -> Dict[str, bool]:
        """测试支付相关接口"""
        print("\n=== 支付接口测试 ===")
        results = {}
        
        # 1. 获取会员价格
        try:
            response = self._make_request('GET', '/api/v1/payments/membership-prices')
            
            if response is None:
                success = False
                details = "连接失败"
            else:
                success = response.status_code == 200
                if success:
                    prices = response.json()
                    monthly_price = prices.get('monthly_price', 0)
                    yearly_price = prices.get('yearly_price', 0)
                    details = f"月会员: ¥{monthly_price}, 年会员: ¥{yearly_price}"
                else:
                    details = f"状态码: {response.status_code}"
            
            results['get_membership_prices'] = success
            self.print_result("获取会员价格", success, response, details)
            
        except Exception as e:
            results['get_membership_prices'] = False
            self.print_result("获取会员价格", False, details=f"异常: {e}")
        
        # 2. 测试创建订单（如果已登录）
        if self.user_info:
            try:
                order_data = {
                    "membership_type": "monthly",
                    "payment_method": "alipay"
                }
                response = self._make_request(
                    'POST',
                    '/api/v1/payments/orders',
                    json=order_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response is None:
                    success = False
                    details = "连接失败"
                else:
                    success = response.status_code in [200, 201]
                    if success:
                        order = response.json()
                        details = f"订单ID: {order.get('id', '未知')}, 状态: {order.get('status', '未知')}"
                    else:
                        details = f"状态码: {response.status_code}"
                
                results['create_order'] = success
                self.print_result("创建订单", success, response, details)
                
            except Exception as e:
                results['create_order'] = False
                self.print_result("创建订单", False, details=f"异常: {e}")
        else:
            results['create_order'] = None
            print("  创建订单                        ⏸️ 跳过 (未登录)")
        
        # 3. 测试查询订单列表（如果已登录）
        if self.user_info:
            try:
                response = self._make_request('GET', '/api/v1/payments/orders')
                
                if response is None:
                    success = False
                    details = "连接失败"
                else:
                    success = response.status_code == 200
                    if success:
                        orders = response.json()
                        details = f"订单数量: {len(orders)}"
                    else:
                        details = f"状态码: {response.status_code}"
                
                results['get_orders'] = success
                self.print_result("查询订单列表", success, response, details)
                
            except Exception as e:
                results['get_orders'] = False
                self.print_result("查询订单列表", False, details=f"异常: {e}")
        else:
            results['get_orders'] = None
            print("  查询订单列表                    ⏸️ 跳过 (未登录)")
        
        return results
    
    def test_health_endpoints(self) -> Dict[str, bool]:
        """测试健康检查接口"""
        print("\n=== 健康检查接口测试 ===")
        results = {}
        
        # 1. 基础健康检查
        try:
            response = self._make_request('GET', '/api/v1/health')
            
            if response is None:
                success = False
                details = "连接失败"
            else:
                success = response.status_code == 200
                if success:
                    health_info = response.json()
                    status = health_info.get('status', 'unknown')
                    version = health_info.get('version', 'unknown')
                    details = f"状态: {status}, 版本: {version}"
                else:
                    details = f"状态码: {response.status_code}"
            
            results['health_check'] = success
            self.print_result("基础健康检查", success, response, details)
            
        except Exception as e:
            results['health_check'] = False
            self.print_result("基础健康检查", False, details=f"异常: {e}")
        
        # 2. 邮件服务健康检查
        try:
            response = self._make_request('GET', '/api/v1/health/email')
            
            if response is None:
                success = False
                details = "连接失败"
            else:
                success = response.status_code == 200
                if success:
                    email_health = response.json()
                    status = email_health.get('status', 'unknown')
                    server = email_health.get('server', 'unknown')
                    details = f"邮件服务: {status}, 服务器: {server}"
                else:
                    details = f"状态码: {response.status_code}"
            
            results['email_health_check'] = success
            self.print_result("邮件服务健康检查", success, response, details)
            
        except Exception as e:
            results['email_health_check'] = False
            self.print_result("邮件服务健康检查", False, details=f"异常: {e}")
        
        # 3. 数据库健康检查
        try:
            response = self._make_request('GET', '/api/v1/health/database')
            
            if response is None:
                success = False
                details = "连接失败"
            else:
                success = response.status_code == 200
                if success:
                    db_health = response.json()
                    status = db_health.get('status', 'unknown')
                    details = f"数据库: {status}"
                else:
                    details = f"状态码: {response.status_code}"
            
            results['database_health_check'] = success
            self.print_result("数据库健康检查", success, response, details)
            
        except Exception as e:
            results['database_health_check'] = False
            self.print_result("数据库健康检查", False, details=f"异常: {e}")
        
        return results
    
    def run_all_tests(self, email: str, password: str) -> bool:
        """运行所有功能测试"""
        print("=" * 70)
        print("开始 GlobalLink API 功能测试")
        print(f"服务器: {self.base_url}")
        print(f"测试账号: {email}")
        print("=" * 70)
        
        # 重置统计
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
        # 1. 登录测试
        login_success = self.login(email, password)
        
        if not login_success:
            print("\n❌ 登录失败，部分测试将被跳过")
        
        # 2. 运行各个模块的测试
        all_results = {}
        
        # 健康检查测试（不需要登录）
        health_results = self.test_health_endpoints()
        all_results.update(health_results)
        
        # 认证接口测试
        auth_results = self.test_auth_endpoints()
        all_results.update(auth_results)
        
        # 课程接口测试（不需要登录）
        courses_results = self.test_courses_endpoints()
        all_results.update(courses_results)
        
        # 用户接口测试（需要登录）
        users_results = self.test_users_endpoints()
        all_results.update(users_results)
        
        # 支付接口测试（部分需要登录）
        payment_results = self.test_payment_endpoints()
        all_results.update(payment_results)
        
        # 输出汇总结果
        self._print_summary(all_results)
        
        # 保存测试结果
        self.test_results = all_results
        
        return self.passed_tests == self.total_tests
    
    def _print_summary(self, results: Dict[str, Any]):
        """打印测试结果汇总"""
        print("\n" + "=" * 70)
        print("功能测试结果汇总:")
        print("=" * 70)
        
        # 按模块分组显示结果
        modules = {
            "健康检查": ["health_check", "email_health_check", "database_health_check"],
            "认证功能": ["send_verification_code", "refresh_token", "user_register"],
            "课程功能": ["get_courses", "get_course_detail", "get_knowledge_points", "get_knowledge_point_detail"],
            "用户功能": ["get_user_info", "update_user_info"],
            "支付功能": ["get_membership_prices", "create_order", "get_orders"]
        }
        
        for module_name, test_keys in modules.items():
            print(f"\n{module_name}:")
            for key in test_keys:
                if key in results:
                    result = results[key]
                    if result is True:
                        status = "✓ 通过"
                    elif result is False:
                        status = "✗ 失败"
                    else:
                        status = "⏸️ 跳过"
                    print(f"  {key:30} {status}")
        
        # 总体统计
        total_executed = sum(1 for r in results.values() if r is not None)
        total_passed = sum(1 for r in results.values() if r is True)
        total_failed = sum(1 for r in results.values() if r is False)
        total_skipped = sum(1 for r in results.values() if r is None)
        
        print("\n" + "-" * 70)
        print(f"总计: {total_executed} 个测试执行")
        print(f"通过: {total_passed}")
        print(f"失败: {total_failed}")
        print(f"跳过: {total_skipped}")
        
        if total_executed > 0:
            success_rate = total_passed / total_executed * 100
            print(f"成功率: {success_rate:.1f}%")
        
        if total_passed == total_executed and total_executed > 0:
            print("\n🎉 所有测试通过!")
        elif total_failed > 0:
            print("\n❌ 有测试失败，请检查详细日志")
        
        print("=" * 70)

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='运行 GlobalLink API 功能测试')
    parser.add_argument('base_url', nargs='?', default='http://localhost:8000',
                       help='服务器基础URL (默认: http://localhost:8000)')
    parser.add_argument('email', nargs='?', default='15010993510@163.com',
                       help='测试账号邮箱 (默认: 15010993510@163.com)')
    parser.add_argument('password', nargs='?', default='12345678',
                       help='测试账号密码 (默认: 12345678)')
    parser.add_argument('--timeout', type=int, default=30,
                       help='请求超时时间（秒）')
    parser.add_argument('--verbose', action='store_true',
                       help='显示详细输出')
    
    args = parser.parse_args()
    
    # 创建测试器并运行测试
    tester = GlobalLinkAPITester(args.base_url)
    
    success = tester.run_all_tests(args.email, args.password)
    
    # 提示错误通知测试
    print("\n" + "="*70)
    print("💡 提示：要测试错误通知功能，请运行:")
    print("python test_error_notification.py [base_url] [email] [password]")
    print("="*70)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())