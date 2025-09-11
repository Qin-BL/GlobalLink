#!/usr/bin/env python3
"""
GlobalLink 服务器启动脚本
用于在Linux服务器上启动应用
"""

import sys
import os
import uvicorn
from pathlib import Path

# 添加当前目录到Python路径
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# 设置环境变量
os.environ.setdefault("PYTHONPATH", str(current_dir))

def main():
    """启动服务器"""
    try:
        # 导入应用
        from main import app
        
        print("🚀 正在启动 GlobalLink 服务器...")
        print("📍 服务器地址: http://0.0.0.0:8000")
        print("📖 API文档: http://0.0.0.0:8000/docs")
        print("🔧 管理后台: http://0.0.0.0:8000/admin/login")
        
        # 启动服务器
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            reload=False,  # 生产环境不使用reload
            workers=1,     # 可以根据服务器配置调整
            log_level="info"
        )
        
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        print("请确保所有依赖都已正确安装")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()