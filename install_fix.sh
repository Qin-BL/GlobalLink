#!/bin/bash

# GlobalLink安装修复脚本
set -e

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

 echo "===== GlobalLink安装修复工具 ====="
 echo "此脚本将帮助您修复服务安装问题并重新安装GlobalLink"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]
  then echo "请以root用户运行此脚本"
  exit 1
fi

# 确保服务文件存在
 echo "检查服务文件..."
if [ ! -f "$SCRIPT_DIR/backend.service" ] || [ ! -f "$SCRIPT_DIR/frontend.service" ]; then
    echo "服务文件缺失，正在从安装脚本重新生成..."
    # 运行后端安装脚本来生成服务文件
    bash "$SCRIPT_DIR/install/without_docker/install_backend.sh"
    # 运行前端安装脚本来生成服务文件
    bash "$SCRIPT_DIR/install/without_docker/install_frontend.sh"
fi

# 运行路径修复脚本
 echo "修复服务文件路径..."
if [ -f "$SCRIPT_DIR/fix_service_paths.sh" ]; then
    chmod +x "$SCRIPT_DIR/fix_service_paths.sh"
    bash "$SCRIPT_DIR/fix_service_paths.sh"
else
    echo "错误：fix_service_paths.sh文件不存在"
    exit 1
fi

# 安装服务
 echo "安装服务..."
if [ -f "$SCRIPT_DIR/install_service_ubuntu20.sh" ]; then
    chmod +x "$SCRIPT_DIR/install_service_ubuntu20.sh"
    bash "$SCRIPT_DIR/install_service_ubuntu20.sh"
else
    echo "错误：install_service_ubuntu20.sh文件不存在"
    exit 1
fi

# 启动服务
 echo "启动服务..."
sudo systemctl start globallink-backend
sudo systemctl start globallink-frontend

# 检查服务状态
 echo "检查服务状态..."
sleep 5
sudo systemctl status globallink-backend --no-pager -l
sudo systemctl status globallink-frontend --no-pager -l

 echo "===== 安装修复完成 ====="
 echo "您可以通过以下地址访问服务："
 echo "- 前端：http://localhost:3080"
 echo "- 后端API：http://localhost:8000"
 echo "- API文档：http://localhost:8000/docs"
 echo "- Nginx代理：http://localhost"

 echo "服务管理命令："
 echo "- 启动服务：sudo systemctl start globallink-backend globallink-frontend"
 echo "- 停止服务：sudo systemctl stop globallink-backend globallink-frontend"
 echo "- 重启服务：sudo systemctl restart globallink-backend globallink-frontend"
 echo "- 查看状态：sudo systemctl status globallink-backend globallink-frontend"