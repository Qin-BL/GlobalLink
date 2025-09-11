#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
主测试运行器
运行所有类型的测试：单元测试、黑盒测试、白盒测试、集成测试、功能测试

支持的测试类型:
- 单元测试: 核心功能单元测试
- 白盒测试: 内部实现和代码路径测试
- 集成测试: 组件协作测试
- 黑盒测试: 外部行为测试（需要服务器）
- 功能测试: 完整API接口测试（需要服务器）
- 错误通知测试: 专项错误通知功能测试（需要服务器）
"""

import sys
import os
import time
import argparse
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

def run_all_tests(
    base_url: Optional[str] = None,
    email: Optional[str] = None,
    password: Optional[str] = None,
    test_types: Optional[List[str]] = None,
    verbose: bool = False
) -> Dict[str, Any]:
    """
    运行所有类型的测试
    
    Args:
        base_url: 服务器基础URL，用于需要服务器的测试
        email: 测试账号邮箱
        password: 测试账号密码
        test_types: 要运行的测试类型列表，None表示运行所有测试
        verbose: 是否显示详细输出
    
    Returns:
        测试结果字典
    """
    results = {}
    start_time = time.time()
    
    print("=" * 80)
    print("开始运行 GlobalLink 完整测试套件")
    print("=" * 80)
    print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if base_url:
        print(f"服务器地址: {base_url}")
    if email:
        print(f"测试账号: {email}")
    
    print("=" * 80)
    
    # 默认测试类型
    if test_types is None:
        test_types = ['unit', 'whitebox', 'integration', 'blackbox', 'functional']
    
    # 可用的测试类型
    available_tests = {
        'unit': ('单元测试', run_unit_tests, False),
        'whitebox': ('白盒测试', run_whitebox_tests, False),
        'integration': ('集成测试', run_integration_tests, False),
        'blackbox': ('黑盒测试', run_blackbox_tests, True),
        'functional': ('功能测试', run_functional_tests, True),
        'error_notification': ('错误通知测试', run_error_notification_tests, True)
    }
    
    # 运行测试
    for test_type in test_types:
        if test_type not in available_tests:
            print(f"\n❌ 未知的测试类型: {test_type}")
            results[test_type] = {'success': False, 'error': f'未知测试类型: {test_type}'}
            continue
        
        test_name, test_func, needs_server = available_tests[test_type]
        
        print(f"\n{'='*20} {test_name} {'='*20}")
        
        # 检查是否需要服务器
        if needs_server and not base_url:
            print(f"⏸️ 跳过 {test_name} (未指定服务器地址)")
            results[test_type] = {'success': None, 'skipped': True, 'reason': '未指定服务器地址'}
            continue
        
        try:
            # 运行测试
            if needs_server:
                if test_type == 'blackbox':
                    success = test_func(base_url)
                elif test_type in ['functional', 'error_notification']:
                    if not email or not password:
                        print(f"⏸️ 跳过 {test_name} (未指定测试账号)")
                        results[test_type] = {'success': None, 'skipped': True, 'reason': '未指定测试账号'}
                        continue
                    success = test_func(base_url, email, password)
                else:
                    success = test_func(base_url)
            else:
                success = test_func()
            
            results[test_type] = {
                'success': success,
                'name': test_name,
                'skipped': False
            }
            
            if success:
                print(f"✅ {test_name} 完成 - 通过")
            else:
                print(f"❌ {test_name} 完成 - 失败")
                
        except Exception as e:
            print(f"❌ {test_name} 执行异常: {e}")
            results[test_type] = {
                'success': False,
                'name': test_name,
                'error': str(e),
                'skipped': False
            }
            
            if verbose:
                import traceback
                print(f"异常详情:\n{traceback.format_exc()}")
    
    # 计算总耗时
    end_time = time.time()
    total_time = end_time - start_time
    
    # 输出汇总结果
    print_test_summary(results, total_time)
    
    return results

def run_unit_tests() -> bool:
    """运行单元测试"""
    try:
        from .test_units import run_unit_tests
        return run_unit_tests()
    except ImportError as e:
        print(f"❌ 无法导入单元测试模块: {e}")
        return False

def run_whitebox_tests() -> bool:
    """运行白盒测试"""
    try:
        from .test_whitebox import run_whitebox_tests
        return run_whitebox_tests()
    except ImportError as e:
        print(f"❌ 无法导入白盒测试模块: {e}")
        return False

def run_integration_tests() -> bool:
    """运行集成测试"""
    try:
        from .test_integration import run_integration_tests
        return run_integration_tests()
    except ImportError as e:
        print(f"❌ 无法导入集成测试模块: {e}")
        return False

def run_blackbox_tests(base_url: str) -> bool:
    """运行黑盒测试"""
    try:
        from .test_blackbox import run_blackbox_tests
        return run_blackbox_tests(base_url)
    except ImportError as e:
        print(f"❌ 无法导入黑盒测试模块: {e}")
        return False

def run_functional_tests(base_url: str, email: str, password: str) -> bool:
    """运行功能测试"""
    try:
        from .test_all_apis import GlobalLinkAPITester
        tester = GlobalLinkAPITester(base_url)
        return tester.run_all_tests(email, password)
    except ImportError as e:
        print(f"❌ 无法导入功能测试模块: {e}")
        return False

def run_error_notification_tests(base_url: str, email: str, password: str) -> bool:
    """运行错误通知测试"""
    try:
        from .test_error_notification import ErrorNotificationTester
        tester = ErrorNotificationTester(base_url)
        return tester.run_all_tests(email, password)
    except ImportError as e:
        print(f"❌ 无法导入错误通知测试模块: {e}")
        return False

def print_test_summary(results: Dict[str, Any], total_time: float):
    """打印测试结果汇总"""
    print("\n" + "=" * 80)
    print("测试结果汇总")
    print("=" * 80)
    
    # 统计结果
    total_tests = len(results)
    passed_tests = sum(1 for r in results.values() if r.get('success') is True)
    failed_tests = sum(1 for r in results.values() if r.get('success') is False)
    skipped_tests = sum(1 for r in results.values() if r.get('skipped', False))
    error_tests = sum(1 for r in results.values() if 'error' in r)
    
    # 显示每个测试的结果
    for test_type, result in results.items():
        test_name = result.get('name', test_type)
        
        if result.get('skipped', False):
            status = "⏸️ 跳过"
            reason = result.get('reason', '未知原因')
            print(f"{test_name:20} {status:10} ({reason})")
        elif result.get('success') is True:
            status = "✅ 通过"
            print(f"{test_name:20} {status}")
        elif result.get('success') is False:
            status = "❌ 失败"
            error_msg = result.get('error', '')
            if error_msg:
                print(f"{test_name:20} {status:10} ({error_msg})")
            else:
                print(f"{test_name:20} {status}")
        else:
            status = "❓ 未知"
            print(f"{test_name:20} {status}")
    
    # 显示统计信息
    print("\n" + "-" * 80)
    print(f"总测试数: {total_tests}")
    print(f"通过: {passed_tests}")
    print(f"失败: {failed_tests}")
    print(f"跳过: {skipped_tests}")
    print(f"错误: {error_tests}")
    print(f"总耗时: {total_time:.2f} 秒")
    
    # 计算成功率
    executed_tests = total_tests - skipped_tests
    if executed_tests > 0:
        success_rate = passed_tests / executed_tests * 100
        print(f"成功率: {success_rate:.1f}%")
    
    # 最终结果
    print("\n" + "=" * 80)
    if failed_tests == 0 and error_tests == 0 and executed_tests > 0:
        print("🎉 所有测试通过！")
        if skipped_tests > 0:
            print(f"📝 注意：有 {skipped_tests} 个测试被跳过")
    elif executed_tests == 0:
        print("⚠️ 没有执行任何测试")
    else:
        print("❌ 有测试失败或出错，请检查详细日志")
        
        # 显示失败的测试
        failed_list = [
            result.get('name', test_type) 
            for test_type, result in results.items() 
            if result.get('success') is False
        ]
        if failed_list:
            print(f"失败的测试: {', '.join(failed_list)}")
    
    print("=" * 80)

def create_test_report(results: Dict[str, Any], output_file: str = None):
    """创建测试报告"""
    if not output_file:
        output_file = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("GlobalLink 测试报告\n")
            f.write("=" * 50 + "\n")
            f.write(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            # 写入测试结果
            for test_type, result in results.items():
                test_name = result.get('name', test_type)
                f.write(f"{test_name}:\n")
                
                if result.get('skipped', False):
                    f.write(f"  状态: 跳过\n")
                    f.write(f"  原因: {result.get('reason', '未知')}\n")
                elif result.get('success') is True:
                    f.write(f"  状态: 通过\n")
                elif result.get('success') is False:
                    f.write(f"  状态: 失败\n")
                    if 'error' in result:
                        f.write(f"  错误: {result['error']}\n")
                
                f.write("\n")
        
        print(f"📄 测试报告已保存到: {output_file}")
        return True
        
    except Exception as e:
        print(f"❌ 保存测试报告失败: {e}")
        return False

def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='运行 GlobalLink 完整测试套件',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
测试类型说明:
  unit              单元测试 - 核心功能单元测试
  whitebox          白盒测试 - 内部实现测试
  integration       集成测试 - 组件协作测试
  blackbox          黑盒测试 - 外部行为测试 (需要服务器)
  functional        功能测试 - API接口测试 (需要服务器和账号)
  error_notification 错误通知测试 - 专项测试 (需要服务器和账号)

示例:
  python run_all_tests.py
  python run_all_tests.py --base-url http://localhost:8000
  python run_all_tests.py --base-url http://localhost:8000 --email test@example.com --password 123456
  python run_all_tests.py --tests unit whitebox integration
        """
    )
    
    parser.add_argument('--base-url', 
                       help='服务器基础URL，用于黑盒测试、功能测试和错误通知测试')
    parser.add_argument('--email', 
                       help='测试账号邮箱，用于功能测试和错误通知测试')
    parser.add_argument('--password', 
                       help='测试账号密码，用于功能测试和错误通知测试')
    parser.add_argument('--tests', nargs='+', 
                       choices=['unit', 'whitebox', 'integration', 'blackbox', 'functional', 'error_notification'],
                       help='指定要运行的测试类型 (默认: unit whitebox integration blackbox functional)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='显示详细输出')
    parser.add_argument('--report', 
                       help='生成测试报告文件路径')
    parser.add_argument('--no-report', action='store_true',
                       help='不生成测试报告')
    
    args = parser.parse_args()
    
    # 设置默认值
    if not args.tests:
        if args.base_url:
            args.tests = ['unit', 'whitebox', 'integration', 'blackbox', 'functional']
        else:
            args.tests = ['unit', 'whitebox', 'integration']
    
    # 运行测试
    results = run_all_tests(
        base_url=args.base_url,
        email=args.email,
        password=args.password,
        test_types=args.tests,
        verbose=args.verbose
    )
    
    # 生成测试报告
    if not args.no_report:
        create_test_report(results, args.report)
    
    # 确定退出码
    failed_tests = sum(1 for r in results.values() if r.get('success') is False)
    error_tests = sum(1 for r in results.values() if 'error' in r)
    
    if failed_tests > 0 or error_tests > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()