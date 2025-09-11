#!/usr/bin/env python3
"""
批量修复Python 3.9+类型注解的脚本
自动将过时的typing导入替换为内置类型
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Tuple

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

def fix_typing_imports(content: str) -> str:
    """修复typing导入"""
    # 替换from typing import语句
    patterns = [
        # 移除不需要的typing导入
        (r'from typing import ([^,\n]*,\s*)*Optional([,\s][^,\n]*)*', 
         lambda m: m.group(0).replace('Optional', '').replace(', ,', ',').strip(', ')),
        (r'from typing import ([^,\n]*,\s*)*Union([,\s][^,\n]*)*', 
         lambda m: m.group(0).replace('Union', '').replace(', ,', ',').strip(', ')),
        (r'from typing import ([^,\n]*,\s*)*List([,\s][^,\n]*)*', 
         lambda m: m.group(0).replace('List', '').replace(', ,', ',').strip(', ')),
        (r'from typing import ([^,\n]*,\s*)*Dict([,\s][^,\n]*)*', 
         lambda m: m.group(0).replace('Dict', '').replace(', ,', ',').strip(', ')),
        (r'from typing import ([^,\n]*,\s*)*Tuple([,\s][^,\n]*)*', 
         lambda m: m.group(0).replace('Tuple', '').replace(', ,', ',').strip(', ')),
        (r'from typing import ([^,\n]*,\s*)*Set([,\s][^,\n]*)*', 
         lambda m: m.group(0).replace('Set', '').replace(', ,', ',').strip(', ')),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    # 清理空的from typing import语句
    content = re.sub(r'from typing import\s*\n', '', content)
    content = re.sub(r'from typing import\s*$', '', content, flags=re.MULTILINE)
    
    return content

def fix_type_annotations(content: str) -> str:
    """修复类型注解"""
    replacements = [
        # Optional[Type] -> Type | None
        (r'Optional\[([^\[\]]+)\]', r'\1 | None'),
        # Union[Type1, Type2] -> Type1 | Type2
        (r'Union\[([^,\[\]]+),\s*([^,\[\]]+)\]', r'\1 | \2'),
        # List[Type] -> list[Type]
        (r'List\[([^\[\]]+)\]', r'list[\1]'),
        # Dict[Key, Value] -> dict[Key, Value]
        (r'Dict\[([^,\[\]]+),\s*([^\[\]]+)\]', r'dict[\1, \2]'),
        # Tuple[Types...] -> tuple[Types...]
        (r'Tuple\[([^\[\]]+)\]', r'tuple[\1]'),
        # Set[Type] -> set[Type]
        (r'Set\[([^\[\]]+)\]', r'set[\1]'),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    return content

def fix_file(file_path: Path) -> bool:
    """修复单个文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # 应用修复
        fixed_content = fix_typing_imports(original_content)
        fixed_content = fix_type_annotations(fixed_content)
        
        # 如果内容有变化，写回文件
        if fixed_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            print(f"✅ 修复: {file_path}")
            return True
        else:
            print(f"⏭️  跳过: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ 错误: {file_path} - {e}")
        return False

def main():
    """主函数"""
    print("🚀 开始批量修复类型注解...\n")
    
    # 查找Python文件
    backend_files = find_python_files('backend')
    print(f"找到 {len(backend_files)} 个Python文件\n")
    
    # 修复文件
    fixed_count = 0
    for file_path in backend_files:
        if fix_file(file_path):
            fixed_count += 1
    
    print(f"\n📊 修复完成:")
    print(f"  - 总文件数: {len(backend_files)}")
    print(f"  - 修复文件数: {fixed_count}")
    print(f"  - 跳过文件数: {len(backend_files) - fixed_count}")

if __name__ == "__main__":
    main()