#!/usr/bin/env python3
"""
全局测试运行器
运行所有类型的测试：单元测试、黑盒测试、白盒测试、集成测试
"""

import sys
import os
from typing import Dict, List, Any

def run_all_tests(base_url: str = None) -> Dict[str, bool]:
    """运行所有类型的测试"""
    results = {}
    
    print("=" * 70)
    print("开始运行 GlobalLink 完整测试套件")
    print("=" * 70)
    
    # 运行单元测试
    print("\n1. 运行单元测试...")
    try:
        from .test_units import run_unit_tests
        results['unit_tests'] = run_unit_tests()
    except Exception as e:
        print(f"单元测试执行失败: {e}")
        results['unit_tests'] = False
    
    # 运行白盒测试
    print("\n2. 运行白盒测试...")
    try:
        from .test_whitebox import run_whitebox_tests
        results['whitebox_tests'] = run_whitebox_tests()
    except Exception as e:
        print(f"白盒测试执行失败: {e}")
        results['whitebox_tests'] = False
    
    # 运行集成测试
    print("\n3. 运行集成测试...")
    try:
        from .test_integration import run_integration_tests
        results['integration_tests'] = run_integration_tests()
    except Exception as e:
        print(f"集成测试执行失败: {e}")
        results['integration_tests'] = False
    
    # 运行黑盒测试（需要服务器运行）
    if base_url:
        print(f"\n4. 运行黑盒测试 (服务器: {base_url})...")
        try:
            from .test_blackbox import run_blackbox_tests
            results['blackbox_tests'] = run_blackbox_tests(base_url)
        except Exception as e:
            print(f"黑盒测试执行失败: {e}")
            results['blackbox_tests'] = False
    else:
        print("\n4. 跳过黑盒测试 (未指定服务器地址)")
        results['blackbox_tests'] = None
    
    # 运行功能测试（需要服务器运行）
    if base_url:
        print(f"\n5. 运行功能测试 (服务器: {base_url})...")
        try:
            from .test_all_apis import GlobalLinkAPITester
            tester = GlobalLinkAPITester(base_url)
            
            # 使用默认测试账号
            email = "15010993510@163.com"
            password = "12345678"
            
            results['functional_tests'] = tester.run_all_tests(email, password)
        except Exception as e:
            print(f"功能测试执行失败: {e}")
            results['functional_tests'] = False
    else:
        print("\n5. 跳过功能测试 (未指定服务器地址)")
        results['functional_tests'] = None
    
    # 输出汇总结果
    print("\n" + "=" * 70)
    print("测试结果汇总:")
    print("=" * 70)
    
    total_tests = 0
    passed_tests = 0
    
    for test_type, result in results.items():
        status = "✓ 通过" if result else "✗ 失败" if result is False else "⏸️ 跳过"
        print(f"{test_type:20} {status}")
        
        if result is not None:
            total_tests += 1
            if result:
                passed_tests += 1
    
    print("-" * 70)
    print(f"总计: {passed_tests}/{total_tests} 通过")
    
    if passed_tests == total_tests:
        print("🎉 所有测试通过!")
    else:
        print("❌ 有测试失败，请检查详细日志")
    
    print("=" * 70)
    
    return results

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='运行 GlobalLink 完整测试套件')
    parser.add_argument('--base-url', help='服务器基础URL，用于黑盒和功能测试')
    parser.add_argument('--email', help='测试账号邮箱')
    parser.add_argument('--password', help='测试账号密码')
    
    args = parser.parse_args()
    
    # 运行所有测试
    run_all_tests(args.base_url)

if __name__ == '__main__':
    main()