"""
GlobalLink 测试模块
包含单元测试、集成测试、功能测试等
"""

__version__ = "1.0.0"
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