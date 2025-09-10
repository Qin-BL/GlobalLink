#!/usr/bin/env python3
"""
集成测试模块
测试系统各个组件之间的协作
"""

import unittest
import sys
import os
from unittest.mock import Mock, patch, MagicMock

# 添加项目路径到系统路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

class IntegrationErrorNotificationTest(unittest.TestCase):
    """集成测试错误通知功能"""
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    @patch('app.core.config.Settings')
    def test_config_to_notifier_integration(self, mock_settings, mock_smtp):
        """测试配置到通知器的集成"""
        from app.utils.error_notifier import ErrorNotifier
        
        # 模拟配置
        mock_settings_instance = Mock()
        mock_settings_instance.ERROR_NOTIFICATION_RECIPIENTS = ['test@example.com']
        mock_settings_instance.ERROR_NOTIFICATION_ENABLED = True
        mock_settings.return_value = mock_settings_instance
        
        # 模拟SMTP连接
        mock_smtp_instance = Mock()
        mock_smtp.return_value = mock_smtp_instance
        
        # 测试集成
        notifier = ErrorNotifier()
        
        # 验证配置被正确使用
        self.assertEqual(len(notifier.recipients), 1)
        self.assertEqual(notifier.recipients[0], 'test@example.com')
        
        # 测试邮件发送集成
        mock_smtp_instance.login.return_value = None
        mock_smtp_instance.sendmail.return_value = None
        
        success = notifier.send_error_notification(
            "集成测试错误", 
            "这是一个集成测试错误消息",
            "integration_test"
        )
        
        self.assertTrue(success)
        mock_smtp_instance.login.assert_called_once()
        mock_smtp_instance.sendmail.assert_called_once()
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    @patch('app.core.config.Settings')
    def test_disabled_notification_integration(self, mock_settings, mock_smtp):
        """测试禁用通知功能的集成"""
        from app.utils.error_notifier import ErrorNotifier
        
        # 模拟禁用配置
        mock_settings_instance = Mock()
        mock_settings_instance.ERROR_NOTIFICATION_RECIPIENTS = ['test@example.com']
        mock_settings_instance.ERROR_NOTIFICATION_ENABLED = False
        mock_settings.return_value = mock_settings_instance
        
        # 即使配置了接收邮箱，但功能禁用
        notifier = ErrorNotifier()
        
        # 验证配置被正确使用
        self.assertEqual(len(notifier.recipients), 1)
        
        # 但由于功能禁用，不应该发送邮件
        # 这里主要测试配置读取的集成，实际发送逻辑在单元测试中测试

class IntegrationAPITest(unittest.TestCase):
    """集成测试API功能"""
    
    @patch('requests.Session')
    @patch('app.core.config.Settings')
    def test_api_client_integration(self, mock_settings, mock_session):
        """测试API客户端集成"""
        from test_all_apis import GlobalLinkAPITester
        
        # 模拟配置
        mock_settings_instance = Mock()
        mock_settings.return_value = mock_settings_instance
        
        # 模拟会话
        mock_session_instance = Mock()
        mock_session.return_value = mock_session_instance
        
        # 模拟登录响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'access_token': 'test_token',
            'refresh_token': 'refresh_token'
        }
        mock_session_instance.post.return_value = mock_response
        
        # 创建测试器
        tester = GlobalLinkAPITester("http://localhost:8000")
        
        # 测试登录集成
        success = tester.login("test@example.com", "password")
        self.assertTrue(success)
        self.assertEqual(tester.access_token, 'test_token')
        
        # 验证认证头设置
        self.assertIn('Authorization', tester.session.headers)
        self.assertEqual(tester.session.headers['Authorization'], 'Bearer test_token')

class IntegrationConfigEnvironmentTest(unittest.TestCase):
    """集成测试配置环境"""
    
    def test_environment_config_integration(self):
        """测试环境变量到配置的集成"""
        import os
        from unittest.mock import patch
        
        # 测试环境变量到配置对象的集成
        with patch.dict(os.environ, {
            'ERROR_NOTIFICATION_RECIPIENTS': 'test1@example.com,test2@example.com',
            'ERROR_NOTIFICATION_ENABLED': 'true',
            'SMTP_SERVER': 'smtp.qq.com',
            'SMTP_PORT': '465',
            'SMTP_USE_SSL': 'true'
        }):
            from app.core.config import Settings
            settings = Settings()
            
            # 验证环境变量被正确集成到配置
            self.assertEqual(len(settings.ERROR_NOTIFICATION_RECIPIENTS), 2)
            self.assertTrue(settings.ERROR_NOTIFICATION_ENABLED)
            self.assertEqual(settings.SMTP_SERVER, 'smtp.qq.com')
            self.assertEqual(settings.SMTP_PORT, 465)
            self.assertTrue(settings.SMTP_USE_SSL)

class IntegrationErrorHandlingTest(unittest.TestCase):
    """集成测试错误处理"""
    
    @patch('app.utils.error_notifier.ErrorNotifier')
    @patch('app.main.settings')
    def test_global_error_handler_integration(self, mock_settings, mock_notifier):
        """测试全局错误处理器的集成"""
        from app.main import global_exception_handler
        
        # 模拟配置
        mock_settings.ERROR_NOTIFICATION_ENABLED = True
        mock_settings.ERROR_NOTIFICATION_RECIPIENTS = ['test@example.com']
        
        # 模拟通知器
        mock_notifier_instance = Mock()
        mock_notifier_instance.send_error_notification.return_value = True
        mock_notifier.return_value = mock_notifier_instance
        
        # 测试异常处理集成
        try:
            raise ValueError("测试集成错误")
        except Exception as e:
            # 调用全局错误处理器
            global_exception_handler(e)
            
            # 验证通知器被调用
            mock_notifier_instance.send_error_notification.assert_called_once()
            
            # 验证错误信息包含正确的内容
            args = mock_notifier_instance.send_error_notification.call_args
            self.assertIn("测试集成错误", args[0][1])  # 错误消息
            self.assertEqual(args[0][2], "global_exception_handler")  # 模块名

# 测试套件
def create_integration_test_suite():
    """创建集成测试套件"""
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(IntegrationErrorNotificationTest))
    suite.addTest(unittest.makeSuite(IntegrationAPITest))
    suite.addTest(unittest.makeSuite(IntegrationConfigEnvironmentTest))
    suite.addTest(unittest.makeSuite(IntegrationErrorHandlingTest))
    return suite

def run_integration_tests():
    """运行所有集成测试"""
    print("运行集成测试...")
    
    # 创建测试加载器
    loader = unittest.TestLoader()
    
    # 添加测试用例
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromTestCase(IntegrationErrorNotificationTest))
    suite.addTests(loader.loadTestsFromTestCase(IntegrationAPITest))
    suite.addTests(loader.loadTestsFromTestCase(IntegrationConfigEnvironmentTest))
    suite.addTests(loader.loadTestsFromTestCase(IntegrationErrorHandlingTest))
    
    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # 输出结果
    print(f"\n集成测试完成: {result.testsRun} 个测试, {len(result.failures)} 失败, {len(result.errors)} 错误")
    
    return result.wasSuccessful()

if __name__ == '__main__':
    run_integration_tests()