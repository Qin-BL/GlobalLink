#!/bin/bash

# 检查是否以root用户运行
if [ "$EUID" -ne 0 ]
  then echo "请以root用户运行此脚本"
  exit
fi

# 获取项目根目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"

# 安装依赖
echo "正在安装缺失的依赖..."
cd "$BACKEND_DIR"
pip install -r requirements.txt

# 检查服务状态并尝试重启
echo "正在重启后端服务..."
# 首先停止服务（如果正在运行）
systemctl stop globallink-backend.service
# 等待几秒钟确保服务完全停止
sleep 3
# 重新加载systemd配置
systemctl daemon-reload
# 启动服务
systemctl start globallink-backend.service

# 检查服务状态
echo "检查后端服务状态..."
systemctl status globallink-backend.service

# 提供额外的故障排查信息
echo "\n如果服务仍然无法启动，可以尝试以下命令查看详细日志："
echo "journalctl -u globallink-backend.service -e"

echo "\n修复脚本执行完成。"