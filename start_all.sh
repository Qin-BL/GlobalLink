#!/bin/bash

# 快速启动脚本（不使用systemd服务）
set -e

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "===== 启动GlobalLink应用 ====="

echo "检查环境..."

# 检查PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "警告：PostgreSQL可能未安装"
fi

# 检查MongoDB
if ! command -v mongo &> /dev/null; then
    echo "警告：MongoDB可能未安装"
fi

# 检查Redis
if ! command -v redis-cli &> /dev/null; then
    echo "警告：Redis可能未安装"
fi

# 启动后端
echo "启动后端服务..."
cd "$SCRIPT_DIR/backend"
if [ -d "venv" ]; then
    source venv/bin/activate
    nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
    echo "后端已启动 (PID: $!)"
else
    echo "错误：后端虚拟环境不存在，请先运行安装脚本"
    exit 1
fi

# 启动前端
echo "启动前端服务..."
cd "$SCRIPT_DIR/frontend"
if [ -f "package.json" ]; then
    nohup npm start > frontend.log 2>&1 &
    echo "前端已启动 (PID: $!)"
else
    echo "错误：前端项目不存在，请先运行安装脚本"
    exit 1
fi

echo ""
echo "===== 应用启动完成 ====="
echo ""
echo "访问地址："
echo "前端：http://localhost:3080"
echo "后端API：http://localhost:8000"
echo "API文档：http://localhost:8000/docs"
echo ""
echo "日志文件："
echo "后端日志：$SCRIPT_DIR/backend/backend.log"
echo "前端日志：$SCRIPT_DIR/frontend/frontend.log"
echo ""
echo "停止应用："
echo "pkill -f uvicorn"
echo "pkill -f npm"