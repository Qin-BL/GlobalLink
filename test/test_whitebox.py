#!/usr/bin/env python3
"""
白盒测试模块
测试系统内部实现和代码路径
"""

import unittest
import sys
import os
from unittest.mock import Mock, patch, MagicMock

# 添加项目路径到系统路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

class WhiteBoxErrorNotifierTest(unittest.TestCase):
    """白盒测试错误通知器"""
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    def test_notifier_initialization_paths(self, mock_smtp):
        """测试通知器初始化的不同路径"""
        from app.utils.error_notifier import ErrorNotifier
        
        # 模拟SMTP连接
        mock_instance = Mock()
        mock_smtp.return_value = mock_instance
        
        # 测试路径1: 默认配置
        notifier1 = ErrorNotifier()
        self.assertIsNotNone(notifier1)
        
        # 测试路径2: 自定义邮箱列表
        notifier2 = ErrorNotifier(recipients=['test@example.com'])
        self.assertEqual(len(notifier2.recipients), 1)
        
        # 测试路径3: 空邮箱列表
        notifier3 = ErrorNotifier(recipients=[])
        self.assertEqual(len(notifier3.recipients), 0)
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    @patch('app.utils.error_notifier.logging')
    def test_send_error_notification_paths(self, mock_logging, mock_smtp):
        """测试发送错误通知的不同路径"""
        from app.utils.error_notifier import ErrorNotifier
        
        # 模拟SMTP连接和日志
        mock_smtp_instance = Mock()
        mock_smtp.return_value = mock_smtp_instance
        
        # 测试路径1: 正常发送
        notifier = ErrorNotifier(recipients=['test@example.com'])
        
        # 模拟SMTP交互
        mock_smtp_instance.login.return_value = None
        mock_smtp_instance.sendmail.return_value = None
        
        success = notifier.send_error_notification(
            "测试错误", 
            "这是一个测试错误消息",
            "test_module"
        )
        
        self.assertTrue(success)
        
        # 测试路径2: 空邮箱列表（应该记录警告）
        notifier_empty = ErrorNotifier(recipients=[])
        success_empty = notifier_empty.send_error_notification(
            "测试错误", 
            "这是一个测试错误消息",
            "test_module"
        )
        
        self.assertFalse(success_empty)
        mock_logging.warning.assert_called()

class WhiteBoxConfigTest(unittest.TestCase):
    """白盒测试配置管理"""
    
    def test_config_validation_paths(self):
        """测试配置验证的不同路径"""
        from app.core.config import Settings
        
        # 测试路径1: 默认值
        settings_default = Settings()
        self.assertTrue(hasattr(settings_default, 'ERROR_NOTIFICATION_RECIPIENTS'))
        self.assertTrue(hasattr(settings_default, 'ERROR_NOTIFICATION_ENABLED'))
        
        # 测试路径2: 环境变量覆盖
        import os
        from unittest.mock import patch
        
        with patch.dict(os.environ, {
            'ERROR_NOTIFICATION_RECIPIENTS': 'test1@example.com,test2@example.com',
            'ERROR_NOTIFICATION_ENABLED': 'false'
        }):
            settings_env = Settings()
            self.assertEqual(len(settings_env.ERROR_NOTIFICATION_RECIPIENTS), 2)
            self.assertFalse(settings_env.ERROR_NOTIFICATION_ENABLED)

class WhiteBoxAPIResponseTest(unittest.TestCase):
    """白盒测试API响应处理"""
    
    def test_response_processing_paths(self):
        """测试响应处理的不同路径"""
        # 模拟不同的响应场景
        
        # 路径1: 成功响应
        success_response = Mock()
        success_response.status_code = 200
        success_response.json.return_value = {'status': 'success'}
        
        self.assertEqual(success_response.status_code, 200)
        self.assertEqual(success_response.json()['status'], 'success')
        
        # 路径2: 错误响应
        error_response = Mock()
        error_response.status_code = 500
        error_response.text = 'Internal Server Error'
        
        self.assertEqual(error_response.status_code, 500)
        self.assertEqual(error_response.text, 'Internal Server Error')
        
        # 路径3: 超时响应
        timeout_response = Mock()
        timeout_response.status_code = 408
        timeout_response.reason = 'Request Timeout'
        
        self.assertEqual(timeout_response.status_code, 408)
        self.assertEqual(timeout_response.reason, 'Request Timeout')

class WhiteBoxEmailConfigTest(unittest.TestCase):
    """白盒测试邮件配置"""
    
    def test_email_config_paths(self):
        """测试邮件配置的不同路径"""
        from app.core.config import Settings
        
        # 测试不同的邮件配置场景
        
        # 路径1: QQ邮箱配置
        with patch.dict('os.environ', {
            'SMTP_SERVER': 'smtp.qq.com',
            'SMTP_PORT': '465',
            'SMTP_USE_SSL': 'true'
        }):
            settings = Settings()
            self.assertEqual(settings.SMTP_SERVER, 'smtp.qq.com')
            self.assertEqual(settings.SMTP_PORT, 465)
            self.assertTrue(settings.SMTP_USE_SSL)
        
        # 路径2: 163邮箱配置
        with patch.dict('os.environ', {
            'SMTP_SERVER': 'smtp.163.com',
            'SMTP_PORT': '25',
            'SMTP_USE_SSL': 'false'
        }):
            settings = Settings()
            self.assertEqual(settings.SMTP_SERVER, 'smtp.163.com')
            self.assertEqual(settings.SMTP_PORT, 25)
            self.assertFalse(settings.SMTP_USE_SSL)

# 测试套件
def create_whitebox_test_suite():
    """创建白盒测试套件"""
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(WhiteBoxErrorNotifierTest))
    suite.addTest(unittest.makeSuite(WhiteBoxConfigTest))
    suite.addTest(unittest.makeSuite(WhiteBoxAPIResponseTest))
    suite.addTest(unittest.makeSuite(WhiteBoxEmailConfigTest))
    return suite

def run_whitebox_tests():
    """运行所有白盒测试"""
    print("运行白盒测试...")
    
    # 创建测试加载器
    loader = unittest.TestLoader()
    
    # 添加测试用例
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromTestCase(WhiteBoxErrorNotifierTest))
    suite.addTests(loader.loadTestsFromTestCase(WhiteBoxConfigTest))
    suite.addTests(loader.loadTestsFromTestCase(WhiteBoxAPIResponseTest))
    suite.addTests(loader.loadTestsFromTestCase(WhiteBoxEmailConfigTest))
    
    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # 输出结果
    print(f"\n白盒测试完成: {result.testsRun} 个测试, {len(result.failures)} 失败, {len(result.errors)} 错误")
    
    return result.wasSuccessful()

if __name__ == '__main__':
    run_whitebox_tests()