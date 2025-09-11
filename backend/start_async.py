#!/usr/bin/env python3
"""
异步版本应用启动脚本
"""
import uvicorn
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("🚀 启动GlobalLink异步版本...")
    print("📖 API文档: http://localhost:8001/docs")
    print("📚 ReDoc文档: http://localhost:8001/redoc")
    print("🔍 健康检查: http://localhost:8001/health")
    
    uvicorn.run(
        "async_main:app",
        host="0.0.0.0",
        port=8001,  # 使用不同端口避免与同步版本冲突
        reload=True,
        log_level="info",
        access_log=True
    )