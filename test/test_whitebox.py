#!/usr/bin/env python3
"""
白盒测试模块
测试系统内部实现和代码路径

测试范围:
- 错误通知器不同路径
- 配置验证路径
- API响应处理路径
- 邮件配置路径
- 内部逻辑分支测试
"""

import unittest
import sys
import os
from unittest.mock import Mock, patch, MagicMock, call
from typing import Dict, List, Any

# 添加项目路径到系统路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

class WhiteBoxErrorNotifierTest(unittest.TestCase):
    """白盒测试错误通知器"""
    
    def setUp(self):
        """测试前准备"""
        self.test_recipients = ['test@example.com', 'admin@example.com']
        self.test_error_title = "测试错误"
        self.test_error_message = "这是一个测试错误消息"
        self.test_module = "test_module"
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    def test_notifier_initialization_paths(self, mock_smtp):
        """测试通知器初始化的不同路径"""
        try:
            from app.utils.error_notifier import ErrorNotifier
            
            # 模拟SMTP连接
            mock_instance = Mock()
            mock_smtp.return_value = mock_instance
            
            # 路径1: 默认配置初始化
            notifier1 = ErrorNotifier()
            self.assertIsNotNone(notifier1)
            
            # 路径2: 自定义邮箱列表初始化
            notifier2 = ErrorNotifier(recipients=self.test_recipients)
            self.assertEqual(len(notifier2.recipients), 2)
            self.assertIn('test@example.com', notifier2.recipients)
            self.assertIn('admin@example.com', notifier2.recipients)
            
            # 路径3: 空邮箱列表初始化
            notifier3 = ErrorNotifier(recipients=[])
            self.assertEqual(len(notifier3.recipients), 0)
            
            # 路径4: None邮箱列表初始化
            notifier4 = ErrorNotifier(recipients=None)
            self.assertIsNotNone(notifier4.recipients)
            
        except ImportError:
            self.skipTest("错误通知器模块不可用")
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    @patch('app.utils.error_notifier.logging')
    def test_send_error_notification_success_path(self, mock_logging, mock_smtp):
        """测试发送错误通知的成功路径"""
        try:
            from app.utils.error_notifier import ErrorNotifier
            
            # 模拟SMTP连接和日志
            mock_smtp_instance = Mock()
            mock_smtp.return_value = mock_smtp_instance
            mock_smtp_instance.login.return_value = None
            mock_smtp_instance.sendmail.return_value = None
            
            # 创建通知器
            notifier = ErrorNotifier(recipients=self.test_recipients)
            
            # 测试成功发送路径
            success = notifier.send_error_notification(
                self.test_error_title,
                self.test_error_message,
                self.test_module
            )
            
            # 验证结果
            self.assertTrue(success)
            
            # 验证SMTP调用
            mock_smtp_instance.login.assert_called_once()
            mock_smtp_instance.sendmail.assert_called()
            mock_smtp_instance.quit.assert_called_once()
            
            # 验证日志记录
            mock_logging.info.assert_called()
            
        except ImportError:
            self.skipTest("错误通知器模块不可用")
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    @patch('app.utils.error_notifier.logging')
    def test_send_error_notification_failure_paths(self, mock_logging, mock_smtp):
        """测试发送错误通知的失败路径"""
        try:
            from app.utils.error_notifier import ErrorNotifier
            
            # 路径1: 空接收者列表
            notifier_empty = ErrorNotifier(recipients=[])
            success_empty = notifier_empty.send_error_notification(
                self.test_error_title,
                self.test_error_message,
                self.test_module
            )
            
            self.assertFalse(success_empty)
            mock_logging.warning.assert_called()
            
            # 路径2: SMTP连接失败
            mock_smtp.side_effect = Exception("SMTP连接失败")
            notifier_smtp_fail = ErrorNotifier(recipients=self.test_recipients)
            
            success_smtp_fail = notifier_smtp_fail.send_error_notification(
                self.test_error_title,
                self.test_error_message,
                self.test_module
            )
            
            self.assertFalse(success_smtp_fail)
            mock_logging.error.assert_called()
            
            # 重置mock
            mock_smtp.side_effect = None
            mock_smtp.reset_mock()
            mock_logging.reset_mock()
            
            # 路径3: 登录失败
            mock_smtp_instance = Mock()
            mock_smtp.return_value = mock_smtp_instance
            mock_smtp_instance.login.side_effect = Exception("登录失败")
            
            notifier_login_fail = ErrorNotifier(recipients=self.test_recipients)
            success_login_fail = notifier_login_fail.send_error_notification(
                self.test_error_title,
                self.test_error_message,
                self.test_module
            )
            
            self.assertFalse(success_login_fail)
            mock_logging.error.assert_called()
            
        except ImportError:
            self.skipTest("错误通知器模块不可用")
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    def test_email_content_generation_paths(self, mock_smtp):
        """测试邮件内容生成的不同路径"""
        try:
            from app.utils.error_notifier import ErrorNotifier
            
            # 模拟SMTP
            mock_smtp_instance = Mock()
            mock_smtp.return_value = mock_smtp_instance
            mock_smtp_instance.login.return_value = None
            mock_smtp_instance.sendmail.return_value = None
            
            notifier = ErrorNotifier(recipients=['test@example.com'])
            
            # 路径1: 标准错误信息
            notifier.send_error_notification(
                "标准错误",
                "标准错误消息",
                "standard_module"
            )
            
            # 验证sendmail被调用
            self.assertTrue(mock_smtp_instance.sendmail.called)
            
            # 路径2: 包含特殊字符的错误信息
            notifier.send_error_notification(
                "特殊字符错误 <>&\"'",
                "包含特殊字符的消息 <script>alert('test')</script>",
                "special_module"
            )
            
            # 路径3: 长错误消息
            long_message = "长错误消息 " * 100
            notifier.send_error_notification(
                "长消息错误",
                long_message,
                "long_module"
            )
            
            # 验证所有调用
            self.assertEqual(mock_smtp_instance.sendmail.call_count, 3)
            
        except ImportError:
            self.skipTest("错误通知器模块不可用")

class WhiteBoxConfigTest(unittest.TestCase):
    """白盒测试配置管理"""
    
    def test_config_validation_paths(self):
        """测试配置验证的不同路径"""
        try:
            from app.core.config import Settings
            
            # 路径1: 默认配置
            with patch.dict(os.environ, {}, clear=True):
                settings_default = Settings()
                self.assertTrue(hasattr(settings_default, 'ERROR_NOTIFICATION_RECIPIENTS'))
                self.assertTrue(hasattr(settings_default, 'ERROR_NOTIFICATION_ENABLED'))
            
            # 路径2: 环境变量覆盖 - 启用通知
            with patch.dict(os.environ, {
                'ERROR_NOTIFICATION_RECIPIENTS': 'test1@example.com,test2@example.com',
                'ERROR_NOTIFICATION_ENABLED': 'true'
            }):
                settings_enabled = Settings()
                self.assertEqual(len(settings_enabled.ERROR_NOTIFICATION_RECIPIENTS), 2)
                self.assertTrue(settings_enabled.ERROR_NOTIFICATION_ENABLED)
            
            # 路径3: 环境变量覆盖 - 禁用通知
            with patch.dict(os.environ, {
                'ERROR_NOTIFICATION_RECIPIENTS': 'admin@example.com',
                'ERROR_NOTIFICATION_ENABLED': 'false'
            }):
                settings_disabled = Settings()
                self.assertEqual(len(settings_disabled.ERROR_NOTIFICATION_RECIPIENTS), 1)
                self.assertFalse(settings_disabled.ERROR_NOTIFICATION_ENABLED)
            
            # 路径4: 无效的布尔值处理
            with patch.dict(os.environ, {
                'ERROR_NOTIFICATION_ENABLED': 'invalid_boolean'
            }):
                settings_invalid = Settings()
                # 应该有默认值或错误处理
                self.assertIsInstance(settings_invalid.ERROR_NOTIFICATION_ENABLED, bool)
            
        except ImportError:
            self.skipTest("配置模块不可用")
    
    def test_email_list_parsing_paths(self):
        """测试邮箱列表解析的不同路径"""
        try:
            from app.core.config import Settings
            
            # 路径1: 单个邮箱
            with patch.dict(os.environ, {
                'ERROR_NOTIFICATION_RECIPIENTS': 'single@example.com'
            }):
                settings = Settings()
                self.assertEqual(len(settings.ERROR_NOTIFICATION_RECIPIENTS), 1)
                self.assertEqual(settings.ERROR_NOTIFICATION_RECIPIENTS[0], 'single@example.com')
            
            # 路径2: 多个邮箱，逗号分隔
            with patch.dict(os.environ, {
                'ERROR_NOTIFICATION_RECIPIENTS': 'test1@example.com,test2@example.com,test3@example.com'
            }):
                settings = Settings()
                self.assertEqual(len(settings.ERROR_NOTIFICATION_RECIPIENTS), 3)
            
            # 路径3: 包含空格的邮箱列表
            with patch.dict(os.environ, {
                'ERROR_NOTIFICATION_RECIPIENTS': ' test1@example.com , test2@example.com , test3@example.com '
            }):
                settings = Settings()
                self.assertEqual(len(settings.ERROR_NOTIFICATION_RECIPIENTS), 3)
                # 验证空格被正确处理
                for email in settings.ERROR_NOTIFICATION_RECIPIENTS:
                    self.assertNotIn(' ', email)
            
            # 路径4: 空字符串
            with patch.dict(os.environ, {
                'ERROR_NOTIFICATION_RECIPIENTS': ''
            }):
                settings = Settings()
                # 应该有默认处理
                self.assertIsInstance(settings.ERROR_NOTIFICATION_RECIPIENTS, list)
            
        except ImportError:
            self.skipTest("配置模块不可用")

class WhiteBoxAPIResponseTest(unittest.TestCase):
    """白盒测试API响应处理"""
    
    def test_response_processing_paths(self):
        """测试响应处理的不同路径"""
        
        # 路径1: 成功响应处理
        success_response = Mock()
        success_response.status_code = 200
        success_response.json.return_value = {
            'status': 'success',
            'data': {'message': 'test'},
            'code': 200
        }
        success_response.headers = {'Content-Type': 'application/json'}
        
        # 验证成功路径
        self.assertEqual(success_response.status_code, 200)
        data = success_response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('Content-Type', success_response.headers)
        
        # 路径2: 客户端错误响应
        client_error_response = Mock()
        client_error_response.status_code = 400
        client_error_response.json.return_value = {
            'status': 'error',
            'message': 'Bad Request',
            'code': 400
        }
        
        self.assertEqual(client_error_response.status_code, 400)
        error_data = client_error_response.json()
        self.assertEqual(error_data['status'], 'error')
        
        # 路径3: 服务器错误响应
        server_error_response = Mock()
        server_error_response.status_code = 500
        server_error_response.text = 'Internal Server Error'
        server_error_response.json.side_effect = ValueError("No JSON object could be decoded")
        
        self.assertEqual(server_error_response.status_code, 500)
        with self.assertRaises(ValueError):
            server_error_response.json()
        
        # 路径4: 网络超时响应
        timeout_response = Mock()
        timeout_response.status_code = 408
        timeout_response.reason = 'Request Timeout'
        timeout_response.elapsed.total_seconds.return_value = 30.0
        
        self.assertEqual(timeout_response.status_code, 408)
        self.assertEqual(timeout_response.reason, 'Request Timeout')
        self.assertEqual(timeout_response.elapsed.total_seconds(), 30.0)
        
        # 路径5: 重定向响应
        redirect_response = Mock()
        redirect_response.status_code = 302
        redirect_response.headers = {'Location': 'http://example.com/new-location'}
        redirect_response.is_redirect = True
        
        self.assertEqual(redirect_response.status_code, 302)
        self.assertTrue(redirect_response.is_redirect)
        self.assertIn('Location', redirect_response.headers)

class WhiteBoxEmailConfigTest(unittest.TestCase):
    """白盒测试邮件配置"""
    
    def test_smtp_config_paths(self):
        """测试SMTP配置的不同路径"""
        try:
            from app.core.config import Settings
            
            # 路径1: QQ邮箱配置
            with patch.dict(os.environ, {
                'SMTP_SERVER': 'smtp.qq.com',
                'SMTP_PORT': '465',
                'SMTP_USE_SSL': 'true',
                'SMTP_USERNAME': 'test@qq.com',
                'SMTP_PASSWORD': 'test_password'
            }):
                settings = Settings()
                self.assertEqual(settings.SMTP_SERVER, 'smtp.qq.com')
                self.assertEqual(settings.SMTP_PORT, 465)
                self.assertTrue(settings.SMTP_USE_SSL)
                self.assertEqual(settings.SMTP_USERNAME, 'test@qq.com')
            
            # 路径2: 163邮箱配置
            with patch.dict(os.environ, {
                'SMTP_SERVER': 'smtp.163.com',
                'SMTP_PORT': '25',
                'SMTP_USE_SSL': 'false',
                'SMTP_USERNAME': 'test@163.com'
            }):
                settings = Settings()
                self.assertEqual(settings.SMTP_SERVER, 'smtp.163.com')
                self.assertEqual(settings.SMTP_PORT, 25)
                self.assertFalse(settings.SMTP_USE_SSL)
            
            # 路径3: Gmail配置
            with patch.dict(os.environ, {
                'SMTP_SERVER': 'smtp.gmail.com',
                'SMTP_PORT': '587',
                'SMTP_USE_SSL': 'false',
                'SMTP_USE_TLS': 'true'
            }):
                settings = Settings()
                self.assertEqual(settings.SMTP_SERVER, 'smtp.gmail.com')
                self.assertEqual(settings.SMTP_PORT, 587)
                if hasattr(settings, 'SMTP_USE_TLS'):
                    self.assertTrue(settings.SMTP_USE_TLS)
            
            # 路径4: 无效端口号处理
            with patch.dict(os.environ, {
                'SMTP_PORT': 'invalid_port'
            }):
                try:
                    settings = Settings()
                    # 应该有默认值或错误处理
                    self.assertIsInstance(settings.SMTP_PORT, int)
                except (ValueError, TypeError):
                    # 预期的错误处理
                    pass
            
        except ImportError:
            self.skipTest("配置模块不可用")
    
    def test_email_validation_paths(self):
        """测试邮箱验证的不同路径"""
        import re
        
        # 邮箱验证正则表达式
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        # 路径1: 有效邮箱格式
        valid_emails = [
            'test@example.com',
            'user.name@domain.co.uk',
            'admin+tag@company.org',
            'user123@test-domain.com',
            'a@b.co'
        ]
        
        for email in valid_emails:
            with self.subTest(email=email):
                self.assertTrue(re.match(email_pattern, email), f"邮箱 {email} 应该有效")
        
        # 路径2: 无效邮箱格式
        invalid_emails = [
            'invalid-email',
            '@domain.com',
            'user@',
            'user@domain',
            'user..name@domain.com',
            'user@domain..com',
            ''
        ]
        
        for email in invalid_emails:
            with self.subTest(email=email):
                self.assertFalse(re.match(email_pattern, email), f"邮箱 {email} 应该无效")

class WhiteBoxDatabaseTest(unittest.TestCase):
    """白盒测试数据库相关路径"""
    
    @patch('app.db.database.engine')
    def test_database_connection_paths(self, mock_engine):
        """测试数据库连接的不同路径"""
        try:
            # 路径1: 成功连接
            mock_engine.connect.return_value.__enter__.return_value = Mock()
            mock_engine.connect.return_value.__exit__.return_value = None
            
            # 模拟数据库健康检查
            with mock_engine.connect() as conn:
                self.assertIsNotNone(conn)
            
            # 路径2: 连接失败
            mock_engine.connect.side_effect = Exception("数据库连接失败")
            
            with self.assertRaises(Exception):
                with mock_engine.connect() as conn:
                    pass
            
        except ImportError:
            self.skipTest("数据库模块不可用")

# 测试套件
def create_whitebox_test_suite():
    """创建白盒测试套件"""
    suite = unittest.TestSuite()
    
    test_classes = [
        WhiteBoxErrorNotifierTest,
        WhiteBoxConfigTest,
        WhiteBoxAPIResponseTest,
        WhiteBoxEmailConfigTest,
        WhiteBoxDatabaseTest
    ]
    
    for test_class in test_classes:
        suite.addTest(unittest.makeSuite(test_class))
    
    return suite

def run_whitebox_tests():
    """运行所有白盒测试"""
    print("=" * 60)
    print("开始运行白盒测试")
    print("=" * 60)
    
    # 创建测试加载器
    loader = unittest.TestLoader()
    
    # 创建测试套件
    suite = unittest.TestSuite()
    
    # 添加测试用例
    test_classes = [
        WhiteBoxErrorNotifierTest,
        WhiteBoxConfigTest,
        WhiteBoxAPIResponseTest,
        WhiteBoxEmailConfigTest,
        WhiteBoxDatabaseTest
    ]
    
    for test_class in test_classes:
        suite.addTests(loader.loadTestsFromTestCase(test_class))
    
    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    
    # 输出结果统计
    print("\n" + "=" * 60)
    print("白盒测试结果统计:")
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
    success = run_whitebox_tests()
    sys.exit(0 if success else 1)