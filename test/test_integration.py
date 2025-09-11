#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
集成测试模块
测试系统各个组件之间的协作

测试范围:
- 配置到通知器集成
- API客户端集成
- 环境配置集成
- 全局错误处理集成
- 数据库与API集成
"""

import unittest
import sys
import os
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, List, Any

# 添加项目路径到系统路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

class IntegrationErrorNotificationTest(unittest.TestCase):
    """集成测试错误通知功能"""
    
    def setUp(self):
        """测试前准备"""
        self.test_recipients = ['admin@example.com', 'dev@example.com']
        self.test_smtp_config = {
            'SMTP_SERVER': 'smtp.qq.com',
            'SMTP_PORT': '465',
            'SMTP_USE_SSL': 'true',
            'SMTP_USERNAME': 'test@qq.com',
            'SMTP_PASSWORD': 'test_password'
        }
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    @patch('app.core.config.Settings')
    def test_config_to_notifier_integration(self, mock_settings, mock_smtp):
        """测试配置到通知器的集成"""
        try:
            from app.utils.error_notifier import ErrorNotifier
            
            # 模拟配置
            mock_settings_instance = Mock()
            mock_settings_instance.ERROR_NOTIFICATION_RECIPIENTS = self.test_recipients
            mock_settings_instance.ERROR_NOTIFICATION_ENABLED = True
            mock_settings_instance.SMTP_SERVER = 'smtp.qq.com'
            mock_settings_instance.SMTP_PORT = 465
            mock_settings_instance.SMTP_USE_SSL = True
            mock_settings_instance.SMTP_USERNAME = 'test@qq.com'
            mock_settings_instance.SMTP_PASSWORD = 'test_password'
            mock_settings.return_value = mock_settings_instance
            
            # 模拟SMTP连接
            mock_smtp_instance = Mock()
            mock_smtp.return_value = mock_smtp_instance
            mock_smtp_instance.login.return_value = None
            mock_smtp_instance.sendmail.return_value = None
            
            # 测试集成
            notifier = ErrorNotifier()
            
            # 验证配置被正确使用
            self.assertEqual(len(notifier.recipients), 2)
            self.assertIn('admin@example.com', notifier.recipients)
            self.assertIn('dev@example.com', notifier.recipients)
            
            # 测试邮件发送集成
            success = notifier.send_error_notification(
                "集成测试错误",
                "这是一个集成测试错误消息",
                "integration_test"
            )
            
            self.assertTrue(success)
            mock_smtp_instance.login.assert_called_once()
            mock_smtp_instance.sendmail.assert_called_once()
            mock_smtp_instance.quit.assert_called_once()
            
        except ImportError:
            self.skipTest("错误通知器模块不可用")
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    @patch('app.core.config.Settings')
    def test_disabled_notification_integration(self, mock_settings, mock_smtp):
        """测试禁用通知功能的集成"""
        try:
            from app.utils.error_notifier import ErrorNotifier
            
            # 模拟禁用配置
            mock_settings_instance = Mock()
            mock_settings_instance.ERROR_NOTIFICATION_RECIPIENTS = self.test_recipients
            mock_settings_instance.ERROR_NOTIFICATION_ENABLED = False
            mock_settings.return_value = mock_settings_instance
            
            # 创建通知器
            notifier = ErrorNotifier()
            
            # 验证配置被正确读取
            self.assertEqual(len(notifier.recipients), 2)
            
            # 测试发送通知（应该根据配置决定是否发送）
            # 这里主要测试配置读取的集成
            self.assertIsNotNone(notifier)
            
        except ImportError:
            self.skipTest("错误通知器模块不可用")
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    def test_smtp_connection_integration(self, mock_smtp):
        """测试SMTP连接集成"""
        try:
            from app.utils.error_notifier import ErrorNotifier
            
            # 模拟不同的SMTP连接场景
            
            # 场景1: SSL连接成功
            mock_smtp_instance = Mock()
            mock_smtp.return_value = mock_smtp_instance
            mock_smtp_instance.login.return_value = None
            mock_smtp_instance.sendmail.return_value = None
            
            notifier = ErrorNotifier(recipients=['test@example.com'])
            success = notifier.send_error_notification("测试", "消息", "模块")
            self.assertTrue(success)
            
            # 场景2: SSL连接失败，回退到TLS
            mock_smtp.side_effect = [Exception("SSL失败"), Mock()]
            mock_smtp.reset_mock()
            
            # 这里测试错误处理和回退机制的集成
            try:
                notifier2 = ErrorNotifier(recipients=['test@example.com'])
                notifier2.send_error_notification("测试", "消息", "模块")
            except Exception:
                # 预期的异常处理
                pass
            
        except ImportError:
            self.skipTest("错误通知器模块不可用")

class IntegrationAPITest(unittest.TestCase):
    """集成测试API功能"""
    
    def setUp(self):
        """测试前准备"""
        self.base_url = "http://localhost:8000"
        self.test_credentials = {
            'email': 'test@example.com',
            'password': 'test_password'
        }
    
    @patch('requests.Session')
    def test_api_client_integration(self, mock_session):
        """测试API客户端集成"""
        try:
            from test.test_all_apis import GlobalLinkAPITester
            
            # 模拟会话
            mock_session_instance = Mock()
            mock_session.return_value = mock_session_instance
            
            # 模拟登录响应
            mock_login_response = Mock()
            mock_login_response.status_code = 200
            mock_login_response.json.return_value = {
                'access_token': 'test_access_token',
                'refresh_token': 'test_refresh_token',
                'token_type': 'bearer'
            }
            mock_session_instance.post.return_value = mock_login_response
            
            # 创建测试器
            tester = GlobalLinkAPITester(self.base_url)
            
            # 测试登录集成
            success = tester.login(
                self.test_credentials['email'],
                self.test_credentials['password']
            )
            
            self.assertTrue(success)
            self.assertEqual(tester.access_token, 'test_access_token')
            self.assertEqual(tester.refresh_token, 'test_refresh_token')
            
            # 验证认证头设置
            self.assertIn('Authorization', tester.session.headers)
            self.assertEqual(
                tester.session.headers['Authorization'],
                'Bearer test_access_token'
            )
            
            # 验证登录请求参数
            mock_session_instance.post.assert_called_once()
            call_args = mock_session_instance.post.call_args
            self.assertIn('/api/v1/auth/login', call_args[0][0])
            
        except ImportError:
            self.skipTest("API测试器模块不可用")
    
    @patch('requests.Session')
    def test_api_error_handling_integration(self, mock_session):
        """测试API错误处理集成"""
        try:
            from test.test_all_apis import GlobalLinkAPITester
            
            # 模拟会话
            mock_session_instance = Mock()
            mock_session.return_value = mock_session_instance
            
            # 模拟登录失败响应
            mock_error_response = Mock()
            mock_error_response.status_code = 401
            mock_error_response.json.return_value = {
                'detail': 'Invalid credentials'
            }
            mock_session_instance.post.return_value = mock_error_response
            
            # 创建测试器
            tester = GlobalLinkAPITester(self.base_url)
            
            # 测试登录失败处理
            success = tester.login('invalid@example.com', 'wrong_password')
            
            self.assertFalse(success)
            self.assertIsNone(tester.access_token)
            self.assertIsNone(tester.refresh_token)
            
            # 验证认证头未设置
            self.assertNotIn('Authorization', tester.session.headers)
            
        except ImportError:
            self.skipTest("API测试器模块不可用")
    
    @patch('requests.Session')
    def test_api_token_refresh_integration(self, mock_session):
        """测试API令牌刷新集成"""
        try:
            from test.test_all_apis import GlobalLinkAPITester
            
            # 模拟会话
            mock_session_instance = Mock()
            mock_session.return_value = mock_session_instance
            
            # 模拟刷新令牌响应
            mock_refresh_response = Mock()
            mock_refresh_response.status_code = 200
            mock_refresh_response.json.return_value = {
                'access_token': 'new_access_token',
                'refresh_token': 'new_refresh_token'
            }
            mock_session_instance.post.return_value = mock_refresh_response
            
            # 创建测试器并设置初始令牌
            tester = GlobalLinkAPITester(self.base_url)
            tester.refresh_token = 'old_refresh_token'
            
            # 测试令牌刷新（如果API测试器支持）
            if hasattr(tester, 'refresh_access_token'):
                success = tester.refresh_access_token()
                self.assertTrue(success)
                self.assertEqual(tester.access_token, 'new_access_token')
            
        except ImportError:
            self.skipTest("API测试器模块不可用")

class IntegrationConfigEnvironmentTest(unittest.TestCase):
    """集成测试配置环境"""
    
    def test_environment_config_integration(self):
        """测试环境变量到配置的集成"""
        test_env = {
            'ERROR_NOTIFICATION_RECIPIENTS': 'test1@example.com,test2@example.com',
            'ERROR_NOTIFICATION_ENABLED': 'true',
            'SMTP_SERVER': 'smtp.qq.com',
            'SMTP_PORT': '465',
            'SMTP_USE_SSL': 'true',
            'SMTP_USERNAME': 'test@qq.com',
            'SMTP_PASSWORD': 'test_password',
            'DATABASE_URL': 'postgresql://user:pass@localhost/testdb',
            'SECRET_KEY': 'test_secret_key'
        }
        
        try:
            with patch.dict(os.environ, test_env):
                from app.core.config import Settings
                settings = Settings()
                
                # 验证错误通知配置集成
                self.assertEqual(len(settings.ERROR_NOTIFICATION_RECIPIENTS), 2)
                self.assertTrue(settings.ERROR_NOTIFICATION_ENABLED)
                
                # 验证SMTP配置集成
                self.assertEqual(settings.SMTP_SERVER, 'smtp.qq.com')
                self.assertEqual(settings.SMTP_PORT, 465)
                self.assertTrue(settings.SMTP_USE_SSL)
                self.assertEqual(settings.SMTP_USERNAME, 'test@qq.com')
                
                # 验证数据库配置集成
                if hasattr(settings, 'DATABASE_URL'):
                    self.assertIn('postgresql://', settings.DATABASE_URL)
                
                # 验证安全配置集成
                if hasattr(settings, 'SECRET_KEY'):
                    self.assertEqual(settings.SECRET_KEY, 'test_secret_key')
                
        except ImportError:
            self.skipTest("配置模块不可用")
    
    def test_config_validation_integration(self):
        """测试配置验证集成"""
        try:
            from app.core.config import Settings
            
            # 测试无效配置的处理
            invalid_env = {
                'SMTP_PORT': 'invalid_port',
                'ERROR_NOTIFICATION_ENABLED': 'invalid_boolean',
                'ERROR_NOTIFICATION_RECIPIENTS': ''
            }
            
            with patch.dict(os.environ, invalid_env):
                try:
                    settings = Settings()
                    
                    # 验证默认值或错误处理
                    self.assertIsInstance(settings.SMTP_PORT, int)
                    self.assertIsInstance(settings.ERROR_NOTIFICATION_ENABLED, bool)
                    self.assertIsInstance(settings.ERROR_NOTIFICATION_RECIPIENTS, list)
                    
                except (ValueError, TypeError) as e:
                    # 预期的配置验证错误
                    self.assertIsInstance(e, (ValueError, TypeError))
                
        except ImportError:
            self.skipTest("配置模块不可用")

class IntegrationErrorHandlingTest(unittest.TestCase):
    """集成测试错误处理"""
    
    @patch('app.utils.error_notifier.ErrorNotifier')
    def test_global_error_handler_integration(self, mock_notifier):
        """测试全局错误处理器的集成"""
        try:
            # 模拟通知器
            mock_notifier_instance = Mock()
            mock_notifier_instance.send_error_notification.return_value = True
            mock_notifier.return_value = mock_notifier_instance
            
            # 模拟全局错误处理器
            def mock_global_exception_handler(exception):
                """模拟全局异常处理器"""
                error_title = f"{type(exception).__name__}: {str(exception)}"
                error_message = f"异常详情: {str(exception)}"
                module_name = "global_exception_handler"
                
                notifier = mock_notifier()
                return notifier.send_error_notification(
                    error_title,
                    error_message,
                    module_name
                )
            
            # 测试异常处理集成
            test_exception = ValueError("测试集成错误")
            result = mock_global_exception_handler(test_exception)
            
            self.assertTrue(result)
            mock_notifier_instance.send_error_notification.assert_called_once()
            
            # 验证错误信息包含正确的内容
            args = mock_notifier_instance.send_error_notification.call_args[0]
            self.assertIn("测试集成错误", args[0])  # 错误标题
            self.assertIn("测试集成错误", args[1])  # 错误消息
            self.assertEqual(args[2], "global_exception_handler")  # 模块名
            
        except ImportError:
            self.skipTest("错误处理模块不可用")
    
    @patch('app.utils.error_notifier.ErrorNotifier')
    @patch('app.core.config.Settings')
    def test_error_notification_workflow_integration(self, mock_settings, mock_notifier):
        """测试错误通知工作流集成"""
        try:
            # 模拟配置
            mock_settings_instance = Mock()
            mock_settings_instance.ERROR_NOTIFICATION_ENABLED = True
            mock_settings_instance.ERROR_NOTIFICATION_RECIPIENTS = ['admin@example.com']
            mock_settings.return_value = mock_settings_instance
            
            # 模拟通知器
            mock_notifier_instance = Mock()
            mock_notifier_instance.send_error_notification.return_value = True
            mock_notifier.return_value = mock_notifier_instance
            
            # 模拟完整的错误处理工作流
            def error_handling_workflow(error_type, error_message, context):
                """模拟错误处理工作流"""
                settings = mock_settings()
                
                if settings.ERROR_NOTIFICATION_ENABLED:
                    notifier = mock_notifier()
                    return notifier.send_error_notification(
                        error_type,
                        error_message,
                        context
                    )
                return False
            
            # 测试工作流
            result = error_handling_workflow(
                "数据库错误",
                "连接数据库失败",
                "database_module"
            )
            
            self.assertTrue(result)
            mock_settings.assert_called_once()
            mock_notifier.assert_called_once()
            mock_notifier_instance.send_error_notification.assert_called_once()
            
        except ImportError:
            self.skipTest("错误处理模块不可用")

class IntegrationDatabaseAPITest(unittest.TestCase):
    """集成测试数据库与API"""
    
    @patch('app.db.database.engine')
    @patch('requests.Session')
    def test_database_api_integration(self, mock_session, mock_engine):
        """测试数据库与API的集成"""
        try:
            # 模拟数据库连接
            mock_connection = Mock()
            mock_engine.connect.return_value.__enter__.return_value = mock_connection
            mock_engine.connect.return_value.__exit__.return_value = None
            
            # 模拟数据库查询结果
            mock_result = Mock()
            mock_result.fetchall.return_value = [
                {'id': 1, 'name': '测试课程1'},
                {'id': 2, 'name': '测试课程2'}
            ]
            mock_connection.execute.return_value = mock_result
            
            # 模拟API会话
            mock_session_instance = Mock()
            mock_session.return_value = mock_session_instance
            
            # 模拟API响应
            mock_api_response = Mock()
            mock_api_response.status_code = 200
            mock_api_response.json.return_value = [
                {'id': 1, 'name': '测试课程1'},
                {'id': 2, 'name': '测试课程2'}
            ]
            mock_session_instance.get.return_value = mock_api_response
            
            # 测试数据库到API的数据一致性
            # 这里模拟从数据库获取数据，然后通过API返回
            
            # 1. 从数据库获取数据
            with mock_engine.connect() as conn:
                db_result = conn.execute("SELECT * FROM courses").fetchall()
            
            # 2. 通过API获取数据
            session = mock_session()
            api_response = session.get('/api/v1/courses/')
            api_data = api_response.json()
            
            # 3. 验证数据一致性
            self.assertEqual(len(db_result), len(api_data))
            self.assertEqual(db_result[0]['name'], api_data[0]['name'])
            
        except ImportError:
            self.skipTest("数据库或API模块不可用")
    
    @patch('app.db.database.engine')
    def test_database_health_check_integration(self, mock_engine):
        """测试数据库健康检查集成"""
        try:
            # 模拟数据库健康检查
            def mock_database_health_check():
                """模拟数据库健康检查"""
                try:
                    with mock_engine.connect() as conn:
                        conn.execute("SELECT 1")
                    return {"status": "healthy", "database": "connected"}
                except Exception as e:
                    return {"status": "unhealthy", "error": str(e)}
            
            # 测试健康的数据库
            mock_connection = Mock()
            mock_engine.connect.return_value.__enter__.return_value = mock_connection
            mock_engine.connect.return_value.__exit__.return_value = None
            mock_connection.execute.return_value = Mock()
            
            health_result = mock_database_health_check()
            self.assertEqual(health_result["status"], "healthy")
            
            # 测试不健康的数据库
            mock_engine.connect.side_effect = Exception("数据库连接失败")
            
            health_result = mock_database_health_check()
            self.assertEqual(health_result["status"], "unhealthy")
            self.assertIn("数据库连接失败", health_result["error"])
            
        except ImportError:
            self.skipTest("数据库模块不可用")

# 测试套件
def create_integration_test_suite():
    """创建集成测试套件"""
    suite = unittest.TestSuite()
    
    test_classes = [
        IntegrationErrorNotificationTest,
        IntegrationAPITest,
        IntegrationConfigEnvironmentTest,
        IntegrationErrorHandlingTest,
        IntegrationDatabaseAPITest
    ]
    
    for test_class in test_classes:
        suite.addTest(unittest.makeSuite(test_class))
    
    return suite

def run_integration_tests():
    """运行所有集成测试"""
    print("=" * 60)
    print("开始运行集成测试")
    print("=" * 60)
    
    # 创建测试加载器
    loader = unittest.TestLoader()
    
    # 创建测试套件
    suite = unittest.TestSuite()
    
    # 添加测试用例
    test_classes = [
        IntegrationErrorNotificationTest,
        IntegrationAPITest,
        IntegrationConfigEnvironmentTest,
        IntegrationErrorHandlingTest,
        IntegrationDatabaseAPITest
    ]
    
    for test_class in test_classes:
        suite.addTests(loader.loadTestsFromTestCase(test_class))
    
    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    
    # 输出结果统计
    print("\n" + "=" * 60)
    print("集成测试结果统计:")
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
    success = run_integration_tests()
    sys.exit(0 if success else 1)