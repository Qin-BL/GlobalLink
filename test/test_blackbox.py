#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
黑盒测试模块
测试系统外部行为，不关心内部实现

测试范围:
- API端点存在性检查
- 响应格式验证
- 错误处理机制
- 性能基准测试
"""

import unittest
import requests
import time
import json
from typing import Dict, List, Any, Optional
from urllib.parse import urljoin

class BlackBoxAPITester:
    """黑盒API测试器"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.timeout = 30
        self.test_results = {}
        
        # 设置通用请求头
        self.session.headers.update({
            'User-Agent': 'GlobalLink-BlackBox-Tester/1.0',
            'Accept': 'application/json'
        })
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Optional[requests.Response]:
        """安全地发起HTTP请求"""
        try:
            url = urljoin(self.base_url + '/', endpoint.lstrip('/'))
            response = getattr(self.session, method.lower())(url, **kwargs)
            return response
        except requests.exceptions.RequestException as e:
            print(f"请求异常 {method} {endpoint}: {e}")
            return None
    
    def test_api_endpoints_exist(self) -> Dict[str, bool]:
        """测试所有API端点是否存在"""
        print("测试API端点存在性...")
        
        endpoints = {
            "健康检查": "/api/v1/health",
            "邮件健康检查": "/api/v1/health/email",
            "数据库健康检查": "/api/v1/health/database",
            "认证登录": "/api/v1/auth/login",
            "发送验证码": "/api/v1/auth/send-verification-code",
            "刷新令牌": "/api/v1/auth/refresh",
            "用户注册": "/api/v1/auth/register",
            "用户信息": "/api/v1/users/me",
            "课程列表": "/api/v1/courses/",
            "课程详情": "/api/v1/courses/1",
            "知识点列表": "/api/v1/courses/1/knowledge-points",
            "知识点详情": "/api/v1/knowledge-points/1",
            "会员价格": "/api/v1/payments/membership-prices",
            "创建订单": "/api/v1/payments/orders",
            "查询订单": "/api/v1/payments/orders/1"
        }
        
        results = {}
        
        for name, endpoint in endpoints.items():
            response = self._make_request('HEAD', endpoint)
            
            if response is None:
                exists = False
                status = "连接失败"
            else:
                # 端点存在的判断：不是404，且不是405（方法不允许但端点存在）
                exists = response.status_code not in [404]
                status = f"状态码: {response.status_code}"
            
            results[name] = exists
            print(f"  {name:20} {'✓ 存在' if exists else '✗ 不存在'} ({status})")
        
        return results
    
    def test_response_format(self) -> Dict[str, bool]:
        """测试API响应格式"""
        print("\n测试API响应格式...")
        
        test_cases = [
            {
                "name": "健康检查响应",
                "endpoint": "/api/v1/health",
                "method": "GET",
                "expected_fields": ["status"],
                "expected_status": 200
            },
            {
                "name": "邮件健康响应",
                "endpoint": "/api/v1/health/email",
                "method": "GET",
                "expected_fields": ["status"],
                "expected_status": 200
            },
            {
                "name": "数据库健康响应",
                "endpoint": "/api/v1/health/database",
                "method": "GET",
                "expected_fields": ["status"],
                "expected_status": 200
            },
            {
                "name": "课程列表响应",
                "endpoint": "/api/v1/courses/",
                "method": "GET",
                "expected_type": list,
                "expected_status": 200
            }
        ]
        
        results = {}
        
        for test_case in test_cases:
            response = self._make_request(test_case['method'], test_case['endpoint'])
            
            if response is None:
                results[test_case['name']] = False
                print(f"  {test_case['name']:25} ✗ 连接失败")
                continue
            
            success = True
            issues = []
            
            # 检查状态码
            if response.status_code != test_case.get('expected_status', 200):
                success = False
                issues.append(f"状态码 {response.status_code}")
            
            # 检查响应格式
            try:
                data = response.json()
                
                # 检查必需字段
                if 'expected_fields' in test_case:
                    missing_fields = []
                    for field in test_case['expected_fields']:
                        if field not in data:
                            missing_fields.append(field)
                    
                    if missing_fields:
                        success = False
                        issues.append(f"缺少字段: {missing_fields}")
                
                # 检查数据类型
                if 'expected_type' in test_case:
                    if not isinstance(data, test_case['expected_type']):
                        success = False
                        issues.append(f"类型错误: 期望 {test_case['expected_type'].__name__}")
                
            except (ValueError, json.JSONDecodeError):
                success = False
                issues.append("JSON解析失败")
            
            results[test_case['name']] = success
            
            if success:
                print(f"  {test_case['name']:25} ✓ 格式正确")
            else:
                print(f"  {test_case['name']:25} ✗ {', '.join(issues)}")
        
        return results
    
    def test_error_handling(self) -> Dict[str, bool]:
        """测试错误处理机制"""
        print("\n测试错误处理机制...")
        
        test_cases = [
            {
                "name": "404错误处理",
                "endpoint": "/api/v1/non-existent-endpoint",
                "method": "GET",
                "expected_status": 404
            },
            {
                "name": "405方法不允许",
                "endpoint": "/api/v1/health",
                "method": "POST",
                "expected_status": 405
            },
            {
                "name": "无效JSON请求",
                "endpoint": "/api/v1/auth/login",
                "method": "POST",
                "data": "invalid json",
                "headers": {"Content-Type": "application/json"},
                "expected_status": [400, 422]
            },
            {
                "name": "缺少认证头",
                "endpoint": "/api/v1/users/me",
                "method": "GET",
                "expected_status": 401
            }
        ]
        
        results = {}
        
        for test_case in test_cases:
            kwargs = {}
            if 'data' in test_case:
                kwargs['data'] = test_case['data']
            if 'headers' in test_case:
                kwargs['headers'] = test_case['headers']
            
            response = self._make_request(test_case['method'], test_case['endpoint'], **kwargs)
            
            if response is None:
                results[test_case['name']] = False
                print(f"  {test_case['name']:25} ✗ 连接失败")
                continue
            
            expected_status = test_case['expected_status']
            if isinstance(expected_status, list):
                success = response.status_code in expected_status
            else:
                success = response.status_code == expected_status
            
            results[test_case['name']] = success
            
            if success:
                print(f"  {test_case['name']:25} ✓ 正确处理 (状态码: {response.status_code})")
            else:
                print(f"  {test_case['name']:25} ✗ 期望 {expected_status}, 实际 {response.status_code}")
        
        return results
    
    def test_response_time(self) -> Dict[str, bool]:
        """测试响应时间"""
        print("\n测试响应时间...")
        
        endpoints = [
            ("/api/v1/health", "健康检查", 1.0),
            ("/api/v1/courses/", "课程列表", 3.0),
            ("/api/v1/health/email", "邮件健康", 2.0)
        ]
        
        results = {}
        
        for endpoint, name, max_time in endpoints:
            start_time = time.time()
            response = self._make_request('GET', endpoint)
            end_time = time.time()
            
            if response is None:
                results[name] = False
                print(f"  {name:20} ✗ 连接失败")
                continue
            
            response_time = end_time - start_time
            success = response_time <= max_time and response.status_code == 200
            
            results[name] = success
            
            if success:
                print(f"  {name:20} ✓ {response_time:.3f}s (< {max_time}s)")
            else:
                print(f"  {name:20} ✗ {response_time:.3f}s (> {max_time}s) 或状态码错误")
        
        return results
    
    def test_cors_headers(self) -> Dict[str, bool]:
        """测试CORS头部"""
        print("\n测试CORS头部...")
        
        response = self._make_request('OPTIONS', '/api/v1/health')
        
        if response is None:
            return {"CORS支持": False}
        
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers'
        ]
        
        has_cors = any(header in response.headers for header in cors_headers)
        
        print(f"  CORS支持: {'✓ 支持' if has_cors else '✗ 不支持'}")
        
        return {"CORS支持": has_cors}
    
    def run_all_blackbox_tests(self) -> bool:
        """运行所有黑盒测试"""
        print("=" * 70)
        print("开始黑盒测试")
        print(f"目标服务器: {self.base_url}")
        print("=" * 70)
        
        # 运行各个测试模块
        all_results = {}
        
        # 1. 端点存在性测试
        endpoint_results = self.test_api_endpoints_exist()
        all_results.update(endpoint_results)
        
        # 2. 响应格式测试
        format_results = self.test_response_format()
        all_results.update(format_results)
        
        # 3. 错误处理测试
        error_results = self.test_error_handling()
        all_results.update(error_results)
        
        # 4. 响应时间测试
        time_results = self.test_response_time()
        all_results.update(time_results)
        
        # 5. CORS测试
        cors_results = self.test_cors_headers()
        all_results.update(cors_results)
        
        # 统计结果
        total_tests = len(all_results)
        passed_tests = sum(1 for result in all_results.values() if result)
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 70)
        print("黑盒测试结果统计:")
        print("=" * 70)
        print(f"总测试数: {total_tests}")
        print(f"通过: {passed_tests}")
        print(f"失败: {failed_tests}")
        print(f"成功率: {passed_tests/total_tests*100:.1f}%")
        
        # 显示失败的测试
        if failed_tests > 0:
            print("\n失败的测试:")
            for test_name, result in all_results.items():
                if not result:
                    print(f"  ✗ {test_name}")
        
        print("=" * 70)
        
        # 保存测试结果
        self.test_results = all_results
        
        return passed_tests == total_tests

def run_blackbox_tests(base_url: str = "http://localhost:8000") -> bool:
    """运行黑盒测试"""
    tester = BlackBoxAPITester(base_url)
    return tester.run_all_blackbox_tests()

# 单元测试类（用于集成到unittest框架）
class BlackBoxTestCase(unittest.TestCase):
    """黑盒测试用例"""
    
    @classmethod
    def setUpClass(cls):
        """设置测试类"""
        cls.base_url = "http://localhost:8000"
        cls.tester = BlackBoxAPITester(cls.base_url)
    
    def test_endpoints_exist(self):
        """测试端点存在性"""
        results = self.tester.test_api_endpoints_exist()
        failed_endpoints = [name for name, result in results.items() if not result]
        self.assertEqual(len(failed_endpoints), 0, f"以下端点不存在: {failed_endpoints}")
    
    def test_response_formats(self):
        """测试响应格式"""
        results = self.tester.test_response_format()
        failed_formats = [name for name, result in results.items() if not result]
        self.assertEqual(len(failed_formats), 0, f"以下响应格式错误: {failed_formats}")
    
    def test_error_handling(self):
        """测试错误处理"""
        results = self.tester.test_error_handling()
        failed_errors = [name for name, result in results.items() if not result]
        self.assertEqual(len(failed_errors), 0, f"以下错误处理失败: {failed_errors}")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:8000"
    
    success = run_blackbox_tests(base_url)
    sys.exit(0 if success else 1)