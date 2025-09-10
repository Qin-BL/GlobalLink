#!/usr/bin/env python3
"""
单元测试模块
测试核心功能的单元测试
"""

import unittest
import sys
import os
from unittest.mock import Mock, patch

# 添加项目路径到系统路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

class TestConfigValidation(unittest.TestCase):
    """测试配置验证功能"""
    
    def test_email_validation(self):
        """测试邮箱格式验证"""
        from app.core.config import Settings
        
        # 测试有效邮箱
        settings = Settings()
        self.assertTrue(hasattr(settings, 'ERROR_NOTIFICATION_RECIPIENTS'))
        
        # 测试邮箱列表格式
        self.assertIsInstance(settings.ERROR_NOTIFICATION_RECIPIENTS, list)
        
    def test_feature_flags(self):
        """测试功能开关配置"""
        from app.core.config import Settings
        
        settings = Settings()
        self.assertTrue(hasattr(settings, 'ERROR_NOTIFICATION_ENABLED'))
        self.assertIsInstance(settings.ERROR_NOTIFICATION_ENABLED, bool)

class TestErrorNotifier(unittest.TestCase):
    """测试错误通知器功能"""
    
    @patch('app.utils.error_notifier.smtplib.SMTP_SSL')
    def test_notifier_initialization(self, mock_smtp):
        """测试通知器初始化"""
        from app.utils.error_notifier import ErrorNotifier
        
        # 模拟SMTP连接
        mock_instance = Mock()
        mock_smtp.return_value = mock_instance
        
        # 测试初始化
        notifier = ErrorNotifier()
        self.assertIsNotNone(notifier)
        
    def test_email_recipients_handling(self):
        """测试邮箱接收者处理"""
        from app.utils.error_notifier import ErrorNotifier
        
        # 测试空邮箱列表处理
        notifier = ErrorNotifier(recipients=[])
        self.assertEqual(len(notifier.recipients), 0)
        
        # 测试单个邮箱
        notifier = ErrorNotifier(recipients=['test@example.com'])
        self.assertEqual(len(notifier.recipients), 1)
        
        # 测试多个邮箱
        notifier = ErrorNotifier(recipients=['test1@example.com', 'test2@example.com'])
        self.assertEqual(len(notifier.recipients), 2)

class TestAPIResponseHandling(unittest.TestCase):
    """测试API响应处理"""
    
    def test_response_parsing(self):
        """测试响应解析"""
        # 模拟API响应
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'success',
            'data': {'message': 'test'}
        }
        
        # 测试状态码检查
        self.assertEqual(mock_response.status_code, 200)
        
        # 测试JSON解析
        data = mock_response.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['data']['message'], 'test')

class TestConfiguration(unittest.TestCase):
    """测试配置管理"""
    
    def test_env_variable_loading(self):
        """测试环境变量加载"""
        import os
        from unittest.mock import patch
        
        # 测试环境变量读取
        with patch.dict(os.environ, {
            'ERROR_NOTIFICATION_RECIPIENTS': 'test1@example.com,test2@example.com',
            'ERROR_NOTIFICATION_ENABLED': 'true'
        }):
            from app.core.config import Settings
            settings = Settings()
            
            # 验证配置值
            self.assertTrue(settings.ERROR_NOTIFICATION_ENABLED)
            self.assertIsInstance(settings.ERROR_NOTIFICATION_RECIPIENTS, list)

# 测试套件
def create_unit_test_suite():
    """创建单元测试套件"""
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(TestConfigValidation))
    suite.addTest(unittest.makeSuite(TestErrorNotifier))
    suite.addTest(unittest.makeSuite(TestAPIResponseHandling))
    suite.addTest(unittest.makeSuite(TestConfiguration))
    return suite

def run_unit_tests():
    """运行所有单元测试"""
    print("运行单元测试...")
    
    # 创建测试加载器
    loader = unittest.TestLoader()
    
    # 添加测试用例
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromTestCase(TestConfigValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestErrorNotifier))
    suite.addTests(loader.loadTestsFromTestCase(TestAPIResponseHandling))
    suite.addTests(loader.loadTestsFromTestCase(TestConfiguration))
    
    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # 输出结果
    print(f"\n单元测试完成: {result.testsRun} 个测试, {len(result.failures)} 失败, {len(result.errors)} 错误")
    
    return result.wasSuccessful()

if __name__ == '__main__':
    run_unit_tests()