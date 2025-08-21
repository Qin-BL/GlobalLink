#!/bin/bash

# Ubuntu 20.04 服务安装脚本
set -e

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR" && pwd)"

echo "===== 安装GlobalLink服务 (Ubuntu 20.04) ====="

# 检查服务文件是否存在
if [ ! -f "$PROJECT_ROOT/backend.service" ]; then
    echo "错误：backend.service文件不存在，请先运行install_backend.sh"
    exit 1
fi

if [ ! -f "$PROJECT_ROOT/frontend.service" ]; then
    echo "错误：frontend.service文件不存在，请先运行install_frontend.sh"
    exit 1
fi

# 检查系统是否使用systemd
if ! command -v systemctl &> /dev/null; then
    echo "错误：systemctl命令未找到，请确认系统支持systemd"
    exit 1
fi

# 复制服务文件到系统目录
echo "安装后端服务..."
sudo cp "$PROJECT_ROOT/backend.service" /etc/systemd/system/globallink-backend.service
sudo systemctl daemon-reload
sudo systemctl enable globallink-backend

echo "安装前端服务..."
sudo cp "$PROJECT_ROOT/frontend.service" /etc/systemd/system/globallink-frontend.service
sudo systemctl daemon-reload
sudo systemctl enable globallink-frontend

echo "启动服务..."
sudo systemctl start globallink-backend
sudo systemctl start globallink-frontend

echo "等待服务启动..."
sleep 5

echo "===== 服务安装完成 ====="
echo ""
echo "服务状态："
sudo systemctl status globallink-backend --no-pager -l
sudo systemctl status globallink-frontend --no-pager -l

echo ""
echo "访问地址："
echo "前端：http://localhost:3080"
echo "后端API：http://localhost:8000"
echo "API文档：http://localhost:8000/docs"
echo ""
echo "常用管理命令："
echo "重启后端：sudo systemctl restart globallink-backend"
echo "重启前端：sudo systemctl restart globallink-frontend"
echo "查看日志：sudo journalctl -u globallink-backend -f"
echo "查看日志：sudo journalctl -u globallink-frontend -f"