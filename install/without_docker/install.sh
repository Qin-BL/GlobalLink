#!/bin/bash

# GlobalLink安装主脚本（不使用Docker）
set -e

echo "===== 开始安装GlobalLink ====="

# 检查是否为Ubuntu 20.04
if [ "$(lsb_release -is)" != "Ubuntu" ] || [ "$(lsb_release -rs)" != "20.04" ]; then
  echo "警告：此脚本针对Ubuntu 20.04优化，当前系统为$(lsb_release -ds)"
  read -p "是否继续？(y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 安装基本依赖
echo "安装基本依赖..."
sudo apt update
sudo apt install -y git curl wget

# 运行数据库安装脚本
echo "安装数据库..."
bash ./install/without_docker/install_database.sh

# 运行后端安装脚本
echo "安装后端..."
bash ./install/without_docker/install_backend.sh

# 运行前端安装脚本
echo "安装前端..."
bash ./install/without_docker/install_frontend.sh

# 运行Nginx安装脚本
echo "安装Nginx..."
bash ./install/without_docker/install_nginx.sh

# 启动所有服务
echo "启动所有服务..."
sudo systemctl start globallink-backend
sudo systemctl start globallink-frontend

echo "===== GlobalLink安装完成 ====="
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