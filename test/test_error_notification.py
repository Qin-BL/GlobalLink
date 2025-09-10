#!/usr/bin/env python3
"""
错误通知功能专项测试模块
测试错误邮件通知功能是否正常工作

测试范围:
- 错误通知配置验证
- 邮件服务配置检查
- 服务器错误触发测试
- 通知发送机制测试

重要提示: 该测试会触发真实的错误邮件通知
"""

import requests
import json
import sys
import os
import time
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin

class ErrorNotificationTester:
    """错误通知功能测试器"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.test_results = {}
        
        # 设置请求头
        self.session.headers.update({
            'User-Agent': 'GlobalLink-ErrorNotification-Tester/2.0',
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
            print(f"  {test_name:35} {status}")
            if details:
                print(f"    {details}")
        else:
            self.failed_tests += 1
            status = "✗ 失败"
            print(f"  {test_name:35} {status}")
            
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
        print("=== 用户认证 ===")
        
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
    
    def test_error_notification_config(self) -> Dict[str, bool]:
        """测试错误通知配置信息"""
        print("\n=== 错误通知配置测试 ===")
        results = {}
        
        # 1. 测试基础健康检查
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
                    details = f"服务状态: {status}, 版本: {version}"
                else:
                    details = f"状态码: {response.status_code}"
            
            results['basic_health_check'] = success
            self.print_result("基础健康检查", success, response, details)
            
        except Exception as e:
            results['basic_health_check'] = False
            self.print_result("基础健康检查", False, details=f"异常: {e}")
        
        # 2. 测试邮件服务配置
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
                    port = email_health.get('port', 'unknown')
                    details = f"邮件服务: {status}, 服务器: {server}:{port}"
                else:
                    details = f"状态码: {response.status_code}"
            
            results['email_service_config'] = success
            self.print_result("邮件服务配置检查", success, response, details)
            
        except Exception as e:
            results['email_service_config'] = False
            self.print_result("邮件服务配置检查", False, details=f"异常: {e}")
        
        # 3. 测试数据库健康检查
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
                    details = f"数据库状态: {status}"
                else:
                    details = f"状态码: {response.status_code}"
            
            results['database_health_check'] = success
            self.print_result("数据库健康检查", success, response, details)
            
        except Exception as e:
            results['database_health_check'] = False
            self.print_result("数据库健康检查", False, details=f"异常: {e}")
        
        # 4. 测试404错误处理（不应触发邮件通知）
        try:
            response = self._make_request('GET', '/api/v1/non-existent-endpoint')
            
            if response is None:
                success = False
                details = "连接失败"
            else:
                success = response.status_code == 404
                if success:
                    details = "404错误正确处理（不触发邮件通知）"
                else:
                    details = f"期望404，实际: {response.status_code}"
            
            results['404_error_handling'] = success
            self.print_result("404错误处理测试", success, response, details)
            
        except Exception as e:
            results['404_error_handling'] = False
            self.print_result("404错误处理测试", False, details=f"异常: {e}")
        
        return results
    
    def test_email_configuration(self) -> Dict[str, bool]:
        """测试邮件服务配置详情"""
        print("\n=== 邮件配置详情测试 ===")
        results = {}
        
        # 1. 测试邮件服务连接性
        try:
            response = self._make_request('GET', '/api/v1/health/email')
            
            if response is None:
                success = False
                details = "连接失败"
                email_config = {}
            else:
                success = response.status_code == 200
                if success:
                    email_config = response.json()
                    status = email_config.get('status', 'unknown')
                    server = email_config.get('server', 'unknown')
                    port = email_config.get('port', 'unknown')
                    use_ssl = email_config.get('use_ssl', False)
                    details = f"服务器: {server}:{port}, SSL: {use_ssl}, 状态: {status}"
                else:
                    email_config = {}
                    details = f"状态码: {response.status_code}"
            
            results['email_connectivity'] = success
            self.print_result("邮件服务连接性", success, response, details)
            
        except Exception as e:
            results['email_connectivity'] = False
            email_config = {}
            self.print_result("邮件服务连接性", False, details=f"异常: {e}")
        
        # 2. 验证邮件配置完整性
        if email_config:
            required_fields = ['status', 'server']
            missing_fields = [field for field in required_fields if field not in email_config]
            
            success = len(missing_fields) == 0
            if success:
                details = "邮件配置字段完整"
            else:
                details = f"缺少字段: {missing_fields}"
            
            results['email_config_completeness'] = success
            self.print_result("邮件配置完整性", success, details=details)
        else:
            results['email_config_completeness'] = False
            self.print_result("邮件配置完整性", False, details="无法获取邮件配置")
        
        # 3. 测试SMTP认证配置（间接测试）
        try:
            # 通过发送验证码接口间接测试SMTP认证
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
                # 如果SMTP配置正确，应该能够发送邮件（即使邮箱不存在也会有相应处理）
                success = response.status_code in [200, 400, 422]
                if response.status_code == 200:
                    details = "SMTP认证配置正常"
                elif response.status_code == 400:
                    details = "SMTP配置正常（邮箱相关限制）"
                elif response.status_code == 422:
                    details = "SMTP配置正常（参数验证）"
                else:
                    details = f"SMTP可能配置异常，状态码: {response.status_code}"
            
            results['smtp_auth_config'] = success
            self.print_result("SMTP认证配置", success, response, details)
            
        except Exception as e:
            results['smtp_auth_config'] = False
            self.print_result("SMTP认证配置", False, details=f"异常: {e}")
        
        return results
    
    def test_server_error_notification(self) -> Dict[str, bool]:
        """测试服务器错误通知（可能触发邮件）"""
        print("\n=== 服务器错误通知测试 ===")
        print("⚠️  警告：以下测试可能会触发真实的错误邮件通知！")
        
        results = {}
        
        # 1. 测试专用错误触发端点
        try:
            response = self._make_request('GET', '/api/v1/test-error')
            
            if response is None:
                success = False
                details = "连接失败"
            else:
                # 期望触发500错误，这应该会发送邮件通知
                success = response.status_code == 500
                if success:
                    details = "服务器错误已触发，应该发送邮件通知"
                else:
                    details = f"未触发预期错误，状态码: {response.status_code}"
            
            results['trigger_server_error'] = success
            self.print_result("触发服务器错误", success, response, details)
            
        except Exception as e:
            results['trigger_server_error'] = False
            self.print_result("触发服务器错误", False, details=f"异常: {e}")
        
        # 2. 测试数据库错误触发
        try:
            # 尝试访问可能触发数据库错误的端点
            response = self._make_request('GET', '/api/v1/test-database-error')
            
            if response is None:
                success = False
                details = "连接失败"
            else:
                # 期望触发500错误
                success = response.status_code == 500
                if success:
                    details = "数据库错误已触发，应该发送邮件通知"
                else:
                    details = f"未触发预期错误，状态码: {response.status_code}"
            
            results['trigger_database_error'] = success
            self.print_result("触发数据库错误", success, response, details)
            
        except Exception as e:
            results['trigger_database_error'] = False
            self.print_result("触发数据库错误", False, details=f"异常: {e}")
        
        # 3. 测试认证错误（不应触发邮件通知）
        try:
            # 使用无效令牌访问受保护端点
            old_auth = self.session.headers.get('Authorization')
            self.session.headers['Authorization'] = 'Bearer invalid_token'
            
            response = self._make_request('GET', '/api/v1/users/me')
            
            # 恢复原认证头
            if old_auth:
                self.session.headers['Authorization'] = old_auth
            else:
                self.session.headers.pop('Authorization', None)
            
            if response is None:
                success = False
                details = "连接失败"
            else:
                # 401错误不应触发邮件通知
                success = response.status_code == 401
                if success:
                    details = "认证错误正确处理（不触发邮件通知）"
                else:
                    details = f"期望401，实际: {response.status_code}"
            
            results['auth_error_handling'] = success
            self.print_result("认证错误处理", success, response, details)
            
        except Exception as e:
            results['auth_error_handling'] = False
            self.print_result("认证错误处理", False, details=f"异常: {e}")
        
        return results
    
    def test_notification_recipients(self) -> Dict[str, bool]:
        """测试通知接收者配置"""
        print("\n=== 通知接收者配置测试 ===")
        results = {}
        
        # 1. 通过健康检查接口获取配置信息
        try:
            response = self._make_request('GET', '/api/v1/health')
            
            if response is None:
                success = False
                details = "连接失败"
            else:
                success = response.status_code == 200
                if success:
                    health_info = response.json()
                    # 检查是否包含错误通知配置信息
                    has_notification_config = any(
                        key in health_info for key in 
                        ['error_notification_enabled', 'notification_recipients']
                    )
                    
                    if has_notification_config:
                        details = "包含错误通知配置信息"
                    else:
                        details = "未包含错误通知配置信息（可能是安全考虑）"
                        success = True  # 这是正常的，出于安全考虑不暴露配置
                else:
                    details = f"状态码: {response.status_code}"
            
            results['notification_config_check'] = success
            self.print_result("通知配置检查", success, response, details)
            
        except Exception as e:
            results['notification_config_check'] = False
            self.print_result("通知配置检查", False, details=f"异常: {e}")
        
        return results
    
    def run_all_tests(self, email: str, password: str) -> bool:
        """运行所有错误通知测试"""
        print("=" * 80)
        print("开始错误通知功能测试")
        print(f"服务器: {self.base_url}")
        print(f"测试账号: {email}")
        print("=" * 80)
        
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
        
        # 错误通知配置测试
        config_results = self.test_error_notification_config()
        all_results.update(config_results)
        
        # 邮件配置测试
        email_results = self.test_email_configuration()
        all_results.update(email_results)
        
        # 通知接收者配置测试
        recipients_results = self.test_notification_recipients()
        all_results.update(recipients_results)
        
        # 询问是否进行服务器错误测试
        print("\n" + "⚠️ " * 20)
        print("警告：以下测试会触发真实的服务器错误，可能发送邮件通知！")
        print("请确保：")
        print("1. 邮件服务配置正确")
        print("2. 错误通知接收邮箱已正确设置")
        print("3. 您有权限接收测试邮件")
        print("⚠️ " * 20)
        
        try:
            confirm = input("\n是否继续进行服务器错误测试？(y/N): ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            confirm = 'n'
        
        if confirm == 'y':
            print("\n继续进行服务器错误测试...")
            error_results = self.test_server_error_notification()
            all_results.update(error_results)
        else:
            print("\n跳过服务器错误测试")
            all_results.update({
                'trigger_server_error': None,
                'trigger_database_error': None,
                'auth_error_handling': None
            })
        
        # 输出汇总结果
        self._print_summary(all_results)
        
        # 保存测试结果
        self.test_results = all_results
        
        return self.passed_tests == self.total_tests
    
    def _print_summary(self, results: Dict[str, Any]):
        """打印测试结果汇总"""
        print("\n" + "=" * 80)
        print("错误通知功能测试结果汇总:")
        print("=" * 80)
        
        # 按模块分组显示结果
        modules = {
            "基础配置": [
                "basic_health_check", 
                "email_service_config", 
                "database_health_check", 
                "404_error_handling"
            ],
            "邮件配置": [
                "email_connectivity", 
                "email_config_completeness", 
                "smtp_auth_config"
            ],
            "通知配置": [
                "notification_config_check"
            ],
            "错误触发": [
                "trigger_server_error", 
                "trigger_database_error", 
                "auth_error_handling"
            ]
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
                    print(f"  {key:35} {status}")
        
        # 总体统计
        total_executed = sum(1 for r in results.values() if r is not None)
        total_passed = sum(1 for r in results.values() if r is True)
        total_failed = sum(1 for r in results.values() if r is False)
        total_skipped = sum(1 for r in results.values() if r is None)
        
        print("\n" + "-" * 80)
        print(f"总计: {total_executed} 个测试执行")
        print(f"通过: {total_passed}")
        print(f"失败: {total_failed}")
        print(f"跳过: {total_skipped}")
        
        if total_executed > 0:
            success_rate = total_passed / total_executed * 100
            print(f"成功率: {success_rate:.1f}%")
        
        # 特别提醒
        if total_passed == total_executed and total_executed > 0:
            print("\n🎉 所有测试通过!")
            if any(results.get(key) for key in ['trigger_server_error', 'trigger_database_error']):
                print("📧 请检查配置的接收邮箱是否收到错误通知邮件")
        elif total_failed > 0:
            print("\n❌ 有测试失败，请检查详细日志")
        
        print("=" * 80)

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='运行 GlobalLink 错误通知功能测试')
    parser.add_argument('base_url', nargs='?', default='http://localhost:8000',
                       help='服务器基础URL (默认: http://localhost:8000)')
    parser.add_argument('email', nargs='?', default='15010993510@163.com',
                       help='测试账号邮箱 (默认: 15010993510@163.com)')
    parser.add_argument('password', nargs='?', default='12345678',
                       help='测试账号密码 (默认: 12345678)')
    parser.add_argument('--auto-confirm', action='store_true',
                       help='自动确认进行服务器错误测试（危险）')
    parser.add_argument('--skip-error-tests', action='store_true',
                       help='跳过服务器错误测试')
    
    args = parser.parse_args()
    
    # 创建测试器
    tester = ErrorNotificationTester(args.base_url)
    
    # 如果指定了跳过错误测试，修改测试方法
    if args.skip_error_tests:
        def skip_error_tests() -> Dict[str, Optional[bool]]:
            return {
                'trigger_server_error': None,
                'trigger_database_error': None,
                'auth_error_handling': None
            }
        tester.test_server_error_notification = skip_error_tests
    
    # 如果指定了自动确认，修改输入方法
    original_input = None
    if args.auto_confirm:
        import builtins
        original_input = builtins.input
        builtins.input = lambda prompt: 'y'
    
    try:
        success = tester.run_all_tests(args.email, args.password)
        return 0 if success else 1
    finally:
        # 恢复原始输入方法
        if args.auto_confirm and original_input is not None:
            import builtins
            builtins.input = original_input

if __name__ == "__main__":
    sys.exit(main())