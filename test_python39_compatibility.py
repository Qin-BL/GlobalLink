#!/usr/bin/env python3
"""
Python 3.9+ 兼容性测试脚本
测试项目中的类型注解和导入是否与Python 3.9+兼容
"""

import sys
import ast
import os
from pathlib import Path
from typing import List, Dict, Any

def check_python_version():
    """检查Python版本"""
    if sys.version_info < (3, 9):
        print(f"❌ Python版本过低: {sys.version}")
        print("需要Python 3.9或更高版本")
        return False
    else:
        print(f"✅ Python版本检查通过: {sys.version}")
        return True

def find_python_files(directory: str) -> List[Path]:
    """查找所有Python文件"""
    python_files = []
    for root, dirs, files in os.walk(directory):
        # 跳过__pycache__目录
        dirs[:] = [d for d in dirs if d != '__pycache__']
        
        for file in files:
            if file.endswith('.py'):
                python_files.append(Path(root) / file)
    
    return python_files

def check_type_annotations(file_path: Path) -> Dict[str, Any]:
    """检查文件中的类型注解兼容性"""
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 解析AST
        tree = ast.parse(content, filename=str(file_path))
        
        # 检查过时的类型注解
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom):
                if node.module == 'typing':
                    for alias in node.names:
                        # 检查是否使用了应该被内置类型替代的typing类型
                        if alias.name in ['List', 'Dict', 'Tuple', 'Set', 'Optional', 'Union']:
                            issues.append({
                                'type': 'deprecated_typing_import',
                                'line': node.lineno,
                                'message': f"导入了过时的typing.{alias.name}，建议使用内置类型"
                            })
            
            # 检查函数定义中的类型注解
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                # 检查返回类型注解
                if node.returns:
                    if isinstance(node.returns, ast.Subscript):
                        if isinstance(node.returns.value, ast.Name):
                            if node.returns.value.id in ['List', 'Dict', 'Optional']:
                                issues.append({
                                    'type': 'deprecated_return_annotation',
                                    'line': node.lineno,
                                    'message': f"函数 {node.name} 使用了过时的返回类型注解 {node.returns.value.id}"
                                })
                
                # 检查参数类型注解
                for arg in node.args.args:
                    if arg.annotation:
                        if isinstance(arg.annotation, ast.Subscript):
                            if isinstance(arg.annotation.value, ast.Name):
                                if arg.annotation.value.id in ['List', 'Dict', 'Optional']:
                                    issues.append({
                                        'type': 'deprecated_param_annotation',
                                        'line': node.lineno,
                                        'message': f"参数 {arg.arg} 使用了过时的类型注解 {arg.annotation.value.id}"
                                    })
        
        return {
            'file': file_path,
            'issues': issues,
            'status': 'success' if not issues else 'warning'
        }
        
    except SyntaxError as e:
        return {
            'file': file_path,
            'issues': [{'type': 'syntax_error', 'line': e.lineno, 'message': str(e)}],
            'status': 'error'
        }
    except Exception as e:
        return {
            'file': file_path,
            'issues': [{'type': 'parse_error', 'line': 0, 'message': str(e)}],
            'status': 'error'
        }

def test_imports():
    """测试关键模块的导入"""
    print("\n🔍 测试关键模块导入...")
    
    test_modules = [
        'backend.app.main',
        'backend.app.core.config',
        'backend.app.core.security',
        'backend.app.api.api',
        'backend.app.models.user',
        'backend.app.schemas.user',
    ]
    
    success_count = 0
    
    for module in test_modules:
        try:
            # 尝试导入模块
            __import__(module)
            print(f"  ✅ {module}")
            success_count += 1
        except ImportError as e:
            print(f"  ❌ {module}: {e}")
        except Exception as e:
            print(f"  ⚠️  {module}: {e}")
    
    print(f"\n导入测试结果: {success_count}/{len(test_modules)} 成功")
    return success_count == len(test_modules)

def main():
    """主函数"""
    print("🚀 开始Python 3.9+兼容性测试...\n")
    
    # 检查Python版本
    if not check_python_version():
        sys.exit(1)
    
    # 查找Python文件
    print("\n📁 扫描Python文件...")
    backend_files = find_python_files('backend')
    print(f"找到 {len(backend_files)} 个Python文件")
    
    # 检查类型注解
    print("\n🔍 检查类型注解兼容性...")
    total_issues = 0
    error_files = 0
    
    for file_path in backend_files:
        result = check_type_annotations(file_path)
        
        if result['status'] == 'error':
            error_files += 1
            print(f"  ❌ {file_path}")
            for issue in result['issues']:
                print(f"     行 {issue['line']}: {issue['message']}")
        elif result['status'] == 'warning':
            total_issues += len(result['issues'])
            print(f"  ⚠️  {file_path}")
            for issue in result['issues']:
                print(f"     行 {issue['line']}: {issue['message']}")
        else:
            print(f"  ✅ {file_path}")
    
    # 测试导入
    import_success = test_imports()
    
    # 总结
    print(f"\n📊 测试总结:")
    print(f"  - 扫描文件: {len(backend_files)}")
    print(f"  - 语法错误: {error_files}")
    print(f"  - 类型注解问题: {total_issues}")
    print(f"  - 导入测试: {'通过' if import_success else '失败'}")
    
    if error_files == 0 and total_issues == 0 and import_success:
        print(f"\n🎉 所有测试通过！项目与Python 3.9+完全兼容")
        return True
    else:
        print(f"\n⚠️  发现兼容性问题，请检查上述错误")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)