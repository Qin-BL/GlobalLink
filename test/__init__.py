# -*- coding: utf-8 -*-
"""
GlobalLink 测试模块
包含单元测试、黑盒测试、白盒测试、集成测试、功能测试等完整测试套件

测试模块结构:
- test_units.py: 单元测试 - 核心功能单元测试
- test_blackbox.py: 黑盒测试 - 外部行为测试
- test_whitebox.py: 白盒测试 - 内部实现测试
- test_integration.py: 集成测试 - 组件协作测试
- test_all_apis.py: 功能测试 - API接口测试套件
- test_error_notification.py: 专项测试 - 错误通知功能
- run_all_tests.py: 主测试运行器
"""

__version__ = "2.0.0"
__author__ = "GlobalLink Team"

# 导出主要的测试类和函数
from .test_all_apis import GlobalLinkAPITester
from .test_error_notification import ErrorNotificationTester
from .test_units import run_unit_tests
from .test_blackbox import run_blackbox_tests
from .test_whitebox import run_whitebox_tests
from .test_integration import run_integration_tests
from .run_all_tests import run_all_tests

__all__ = [
    'GlobalLinkAPITester',
    'ErrorNotificationTester', 
    'run_unit_tests',
    'run_blackbox_tests',
    'run_whitebox_tests',
    'run_integration_tests',
    'run_all_tests'
]

# 测试配置
TEST_CONFIG = {
    'default_server': 'http://localhost:8000',
    'test_email': '15010993510@163.com',
    'test_password': '12345678',
    'timeout': 30,
    'retry_count': 3
}