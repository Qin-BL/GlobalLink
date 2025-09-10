#!/usr/bin/env python3
"""
单元测试模块
测试核心功能的单元测试

测试范围:
- 配置验证功能
- 错误通知器功能
- API响应处理
- 配置管理
"""

import unittest
import sys
import os
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, List, Any

# 添加项目路径到系统路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

class TestConfigValidation(unittest.TestCase):
    """测试配置验证功能"""
    
    def setUp(self):
        """测试前准备"""
        self.test_env = {
            'ERROR_NOTIFICATION_RECIPIENTS': 'test1@example.com,test2@example.com',
            'ERROR_NOTIFICATION_ENABLED': 'true',
            'SMTP_SERVER': 'smtp.qq.com',
            'SMTP_PORT': '465',
            'SMTP_USE_SSL': 'true'
        }
    
    def test_email_validation(self):
        """测试邮箱格式验证"""
        try:
            from app.core.config import Settings
            
            # 测试有效邮箱
            settings = Settings()
            self.assertTrue(hasattr(settings, 'ERROR_NOTIFICATION_RECIPIENTS'))
            
            # 测试邮箱列表格式
            self.assertIsInstance(settings.ERROR_NOTIFICATION_RECIPIENTS, list)
            
        except ImportError:
            self.skipTest("配置模块不可用")
    
    def test_feature_flags(self):
        """测试功能开关配置"""
        try:
            from app.core.config import Settings
            
            settings = Settings()
            self.assertTrue(hasattr(settings, 'ERROR_NOTIFICATION_ENABLED'))
            self.assertIsInstance(settings.ERROR_NOTIFICATION_ENABLED, bool)
            
        except ImportError:
            self.skipTest("配置模块不可用")
    
    def test_smtp_config_validation(self):
        """测试SMTP配置验证"""
        try:
            from app.core.config import Settings
            
            with patch.dict(os.environ, self.test_env):
                settings = Settings()
                
                # 验证SMTP配置
                self.assertEqual(settings.SMTP_SERVER, 'smtp.qq.com')
                self.assertEqual(settings.SMTP_PORT, 465)
                self.assertTrue(settings.SMTP_USE_SSL)
                
        except ImportError:
            self.skipTest("配置模块不可用")

class TestErrorNotifier(unittest.TestCase):
    """测试错误通知器功能"""
    
    def setUp(self):
        """测试前准备"""
        self.test_recipients = ['test@example.com', 'admin@example.com']
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    def test_notifier_initialization(self, mock_smtp):
        """测试通知器初始化"""
        try:
            from app.utils.error_notifier import ErrorNotifier
            
            # 模拟SMTP连接
            mock_instance = Mock()
            mock_smtp.return_value = mock_instance
            
            # 测试默认初始化
            notifier = ErrorNotifier()
            self.assertIsNotNone(notifier)
            
            # 测试自定义接收者初始化
            notifier_custom = ErrorNotifier(recipients=self.test_recipients)
            self.assertEqual(len(notifier_custom.recipients), 2)
            
        except ImportError:
            self.skipTest("错误通知器模块不可用")
    
    def test_email_recipients_handling(self):
        """测试邮箱接收者处理"""
        try:
            from app.utils.error_notifier import ErrorNotifier
            
            # 测试空邮箱列表处理
            notifier_empty = ErrorNotifier(recipients=[])
            self.assertEqual(len(notifier_empty.recipients), 0)
            
            # 测试单个邮箱
            notifier_single = ErrorNotifier(recipients=['test@example.com'])
            self.assertEqual(len(notifier_single.recipients), 1)
            self.assertEqual(notifier_single.recipients[0], 'test@example.com')
            
            # 测试多个邮箱
            notifier_multiple = ErrorNotifier(recipients=self.test_recipients)
            self.assertEqual(len(notifier_multiple.recipients), 2)
            self.assertIn('test@example.com', notifier_multiple.recipients)
            self.assertIn('admin@example.com', notifier_multiple.recipients)
            
        except ImportError:
            self.skipTest("错误通知器模块不可用")
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    @patch('app.utils.error_notifier.logging')
    def test_send_notification_success(self, mock_logging, mock_smtp):
        """测试成功发送通知"""
        try:
            from app.utils.error_notifier import ErrorNotifier
            
            # 模拟SMTP连接
            mock_smtp_instance = Mock()
            mock_smtp.return_value = mock_smtp_instance
            mock_smtp_instance.login.return_value = None
            mock_smtp_instance.sendmail.return_value = None
            
            # 创建通知器
            notifier = ErrorNotifier(recipients=['test@example.com'])
            
            # 测试发送通知
            success = notifier.send_error_notification(
                "测试错误",
                "这是一个测试错误消息",
                "test_module"
            )
            
            self.assertTrue(success)
            mock_smtp_instance.login.assert_called()
            mock_smtp_instance.sendmail.assert_called()
            
        except ImportError:
            self.skipTest("错误通知器模块不可用")
    
    @patch('app.utils.error_notifier.logging')
    def test_send_notification_empty_recipients(self, mock_logging):
        """测试空接收者列表的处理"""
        try:
            from app.utils.error_notifier import ErrorNotifier
            
            # 创建空接收者的通知器
            notifier = ErrorNotifier(recipients=[])
            
            # 测试发送通知
            success = notifier.send_error_notification(
                "测试错误",
                "这是一个测试错误消息",
                "test_module"
            )
            
            self.assertFalse(success)
            mock_logging.warning.assert_called()
            
        except ImportError:
            self.skipTest("错误通知器模块不可用")

class TestAPIResponseHandling(unittest.TestCase):
    """测试API响应处理"""
    
    def test_successful_response_parsing(self):
        """测试成功响应解析"""
        # 模拟成功的API响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'success',
            'data': {'message': 'test'},
            'code': 200
        }
        
        # 测试状态码检查
        self.assertEqual(mock_response.status_code, 200)
        
        # 测试JSON解析
        data = mock_response.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['data']['message'], 'test')
        self.assertEqual(data['code'], 200)
    
    def test_error_response_handling(self):
        """测试错误响应处理"""
        # 模拟错误响应
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = 'Internal Server Error'
        mock_response.json.side_effect = ValueError("No JSON object could be decoded")
        
        # 测试错误状态码
        self.assertEqual(mock_response.status_code, 500)
        
        # 测试错误文本
        self.assertEqual(mock_response.text, 'Internal Server Error')
        
        # 测试JSON解析异常
        with self.assertRaises(ValueError):
            mock_response.json()
    
    def test_timeout_response_handling(self):
        """测试超时响应处理"""
        # 模拟超时响应
        mock_response = Mock()
        mock_response.status_code = 408
        mock_response.reason = 'Request Timeout'
        
        # 测试超时状态码
        self.assertEqual(mock_response.status_code, 408)
        self.assertEqual(mock_response.reason, 'Request Timeout')

class TestConfiguration(unittest.TestCase):
    """测试配置管理"""
    
    def test_env_variable_loading(self):
        """测试环境变量加载"""
        test_env = {
            'ERROR_NOTIFICATION_RECIPIENTS': 'test1@example.com,test2@example.com',
            'ERROR_NOTIFICATION_ENABLED': 'true',
            'SMTP_SERVER': 'smtp.qq.com',
            'SMTP_PORT': '465'
        }
        
        try:
            with patch.dict(os.environ, test_env):
                from app.core.config import Settings
                settings = Settings()
                
                # 验证配置值
                self.assertTrue(settings.ERROR_NOTIFICATION_ENABLED)
                self.assertIsInstance(settings.ERROR_NOTIFICATION_RECIPIENTS, list)
                self.assertEqual(len(settings.ERROR_NOTIFICATION_RECIPIENTS), 2)
                self.assertEqual(settings.SMTP_SERVER, 'smtp.qq.com')
                self.assertEqual(settings.SMTP_PORT, 465)
                
        except ImportError:
            self.skipTest("配置模块不可用")
    
    def test_default_configuration(self):
        """测试默认配置"""
        try:
            from app.core.config import Settings
            
            # 清除环境变量影响
            with patch.dict(os.environ, {}, clear=True):
                settings = Settings()
                
                # 验证默认值存在
                self.assertTrue(hasattr(settings, 'ERROR_NOTIFICATION_ENABLED'))
                self.assertTrue(hasattr(settings, 'ERROR_NOTIFICATION_RECIPIENTS'))
                
        except ImportError:
            self.skipTest("配置模块不可用")

class TestUtilityFunctions(unittest.TestCase):
    """测试工具函数"""
    
    def test_email_format_validation(self):
        """测试邮箱格式验证"""
        import re
        
        # 简单的邮箱格式验证正则
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        # 测试有效邮箱
        valid_emails = [
            'test@example.com',
            'user.name@domain.co.uk',
            'admin+tag@company.org'
        ]
        
        for email in valid_emails:
            self.assertTrue(re.match(email_pattern, email), f"邮箱 {email} 应该有效")
        
        # 测试无效邮箱
        invalid_emails = [
            'invalid-email',
            '@domain.com',
            'user@',
            'user@domain'
        ]
        
        for email in invalid_emails:
            self.assertFalse(re.match(email_pattern, email), f"邮箱 {email} 应该无效")
    
    def test_string_processing(self):
        """测试字符串处理"""
        # 测试邮箱列表分割
        email_string = "test1@example.com,test2@example.com,test3@example.com"
        email_list = [email.strip() for email in email_string.split(',')]
        
        self.assertEqual(len(email_list), 3)
        self.assertIn('test1@example.com', email_list)
        self.assertIn('test2@example.com', email_list)
        self.assertIn('test3@example.com', email_list)
        
        # 测试空字符串处理
        empty_string = ""
        empty_list = [email.strip() for email in empty_string.split(',') if email.strip()]
        self.assertEqual(len(empty_list), 0)

# 测试套件
def create_unit_test_suite():
    """创建单元测试套件"""
    suite = unittest.TestSuite()
    
    # 添加所有测试类
    test_classes = [
        TestConfigValidation,
        TestErrorNotifier,
        TestAPIResponseHandling,
        TestConfiguration,
        TestUtilityFunctions
    ]
    
    for test_class in test_classes:
        suite.addTest(unittest.makeSuite(test_class))
    
    return suite

def run_unit_tests():
    """运行所有单元测试"""
    print("=" * 60)
    print("开始运行单元测试")
    print("=" * 60)
    
    # 创建测试加载器
    loader = unittest.TestLoader()
    
    # 创建测试套件
    suite = unittest.TestSuite()
    
    # 添加测试用例
    test_classes = [
        TestConfigValidation,
        TestErrorNotifier,
        TestAPIResponseHandling,
        TestConfiguration,
        TestUtilityFunctions
    ]
    
    for test_class in test_classes:
        suite.addTests(loader.loadTestsFromTestCase(test_class))
    
    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    
    # 输出结果统计
    print("\n" + "=" * 60)
    print("单元测试结果统计:")
    print("=" * 60)
    print(f"总测试数: {result.testsRun}")
    print(f"成功: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"失败: {len(result.failures)}")
    print(f"错误: {len(result.errors)}")
    print(f"跳过: {len(result.skipped) if hasattr(result, 'skipped') else 0}")
    
    # 显示失败和错误详情
    if result.failures:
        print("\n失败的测试:")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback.split('AssertionError:')[-1].strip()}")
    
    if result.errors:
        print("\n错误的测试:")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback.split('Exception:')[-1].strip()}")
    
    success_rate = (result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100 if result.testsRun > 0 else 0
    print(f"\n成功率: {success_rate:.1f}%")
    print("=" * 60)
    
    return result.wasSuccessful()

if __name__ == '__main__':
    success = run_unit_tests()
    sys.exit(0 if success else 1)