#!/usr/bin/env python3
"""
修复批量处理后的语法错误
"""

import os
import re
from pathlib import Path

def fix_trailing_commas(content: str) -> str:
    """修复悬挂的逗号"""
    # 修复 from typing import 后的悬挂逗号
    content = re.sub(r'from typing import ([^,\n]*), \n', r'from typing import \1\n', content)
    content = re.sub(r'from typing import , ', r'', content)
    content = re.sub(r'from typing import ,\n', r'', content)
    
    # 修复其他悬挂逗号
    content = re.sub(r', \n(?=from|import|class|def|@)', r'\n', content)
    
    return content

def fix_empty_imports(content: str) -> str:
    """修复空的导入语句"""
    # 移除空的 from typing import 语句
    content = re.sub(r'from typing import\s*\n', '', content)
    content = re.sub(r'from typing import\s*$', '', content, flags=re.MULTILINE)
    
    return content

def fix_file(file_path: Path) -> bool:
    """修复单个文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # 应用修复
        fixed_content = fix_trailing_commas(original_content)
        fixed_content = fix_empty_imports(fixed_content)
        
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
    print("🔧 修复语法错误...\n")
    
    # 有语法错误的文件列表
    error_files = [
        'backend/app/api/endpoints/admin.py',
        'backend/app/api/endpoints/courses.py',
        'backend/app/api/endpoints/membership.py',
        'backend/app/api/endpoints/progress.py',
        'backend/app/middleware/api_logger.py',
        'backend/app/middleware/rate_limiter.py',
        'backend/app/schemas/course.py',
        'backend/app/utils/activity_logger.py',
        'backend/app/utils/email.py',
        'backend/app/utils/error_notifier.py',
        'backend/app/utils/password_decrypt.py',
        'backend/app/utils/redis_cache.py',
        'backend/app/utils/token_cache.py',
        'backend/scripts/import_courses.py',
    ]
    
    fixed_count = 0
    for file_path_str in error_files:
        file_path = Path(file_path_str)
        if file_path.exists():
            if fix_file(file_path):
                fixed_count += 1
        else:
            print(f"⚠️  文件不存在: {file_path}")
    
    print(f"\n📊 修复完成:")
    print(f"  - 处理文件数: {len(error_files)}")
    print(f"  - 修复文件数: {fixed_count}")

if __name__ == "__main__":
    main()