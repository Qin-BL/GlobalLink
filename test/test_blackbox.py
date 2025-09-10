#!/usr/bin/env python3
"""
黑盒测试模块
测试系统外部行为，不关心内部实现
"""

import unittest
import requests
from typing import Dict, List, Any

class BlackBoxAPITester:
    """黑盒API测试器"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def test_api_endpoints_exist(self) -> Dict[str, bool]:
        """测试所有API端点是否存在"""
        endpoints = {
            "健康检查": "/api/v1/health",
            "认证登录": "/api/v1/auth/login",
            "用户信息": "/api/v1/users/me",
            "课程列表": "/api/v1/courses",
            "支付订单": "/api/v1/payments/orders",
            "邮件健康": "/api/v1/health/email"
        }
        
        results = {}
        
        for name, endpoint in endpoints.items():
            try:
                response = self.session.head(f"{self.base_url}{endpoint}")
                exists = response.status_code != 404
                results[name] = exists
                print(f"{name}端点: {'✓ 存在' if exists else '✗ 不存在'}")
            except Exception as e:
                results[name] = False
                print(f"{name}端点: ✗ 错误 ({e})")
        
        return results
    
    def test_response_format(self) -> Dict[str, bool]:
        """测试API响应格式"""
        test_cases = [
            {
                "name": "健康检查响应",
                "url": "/api/v1/health",
                "expected_fields": ["status", "version"]
            },
            {
                "name": "邮件健康响应",
                "url": "/api/v1/health/email",
                "expected_fields": ["status", "server"]
            }
        ]
        
        results = {}
        
        for test_case in test_cases:
            try:
                response = self.session.get(f"{self.base_url}{test_case['url']}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # 检查必需字段
                    missing_fields = []
                    for field in test_case['expected_fields']:
                        if field not in data:
                            missing_fields.append(field)
                    
                    success = len(missing_fields) == 0
                    results[test_case['name']] = success
                    
                    if success:
                        print(f"{test_case['name']}: ✓ 格式正确")
                    else:
                        print(f"{test_case['name']}: ✗ 缺少字段 {missing_fields}")
                else:
                    results[test_case['name']] = False
                    print(f"{test_case['name']}: ✗ 状态码 {response.status_code}")
                    
            except Exception as e:
                results[test_case['name']] = False
                print(f"{test_case['name']}: ✗ 错误 ({e})")
        
        return results
    
    def test_error_handling(self) -> Dict[str, bool]:
        """测试错误处理机制"""
        test_cases = [
            {
                "name": "404错误处理",
                "url": "/api/v1/non-existent-endpoint",
                "expected_status": 404
            },
            {
                "name": "405方法不允许",
                "url": "/api/v1/health",
                "method": "POST",
                "expected_status": 405
            }
        ]
        
        results = {}
        
        for test_case in test_cases:
            try:
                method = test_case.get('method', 'GET')
                
                if method == 'GET':
                    response = self.session.get(f"{self.base_url}{test_case['url']}")
                elif method == 'POST':
                    response = self.session.post(f"{self.base_url}{test_case['url']}")
                else:
                    response = self.session.get(f"{self.base_url}{test_case['url']}")
                
                success = response.status_code == test_case['expected_status']
                results[test_case['name']] = success
                
                if success:
                    print(f"{test_case['name']}: ✓ 正确处理")
                else:
                    print(f"{test_case['name']}: ✗ 期望 {test_case['expected_status']}, 实际 {response.status_code}")
                    
            except Exception as e:
                results[test_case['name']] = False
                print(f"{test_case['name']}: ✗ 错误 ({e})")
        
        return results
    
    def run_all_blackbox_tests(self) -> bool:
        """运行所有黑盒测试"""
        print("=" * 60)
        print("开始黑盒测试")
        print(f"目标服务器: {self.base_url}")
        print("=" * 60)
        
        # 运行各个测试模块
        print("\n1. 测试API端点存在性:")
        endpoint_results = self.test_api_endpoints_exist()
        
        print("\n2. 测试响应格式:")
        format_results = self.test_response_format()
        
        print("\n3. 测试错误处理:")
        error_results = self.test_error_handling()
        
        # 统计结果
        all_results = {**endpoint_results, **format_results, **error_results}
        total_tests = len(all_results)
        passed_tests = sum(1 for result in all_results.values() if result)
        
        print("\n" + "=" * 60)
        print(f"黑盒测试完成: {passed_tests}/{total_tests} 通过")
        print("=" * 60)
        
        return passed_tests == total_tests

def run_blackbox_tests(base_url: str = "http://localhost:8000") -> bool:
    """运行黑盒测试"""
    tester = BlackBoxAPITester(base_url)
    return tester.run_all_blackbox_tests()

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:8000"
    
    run_blackbox_tests(base_url)