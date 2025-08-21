#!/bin/bash

# GlobalLink Docker安装主脚本
set -e

echo "===== 开始安装GlobalLink（Docker版本）====="

# 检查是否为Ubuntu 20.04
if [ "$(lsb_release -is)" != "Ubuntu" ] || [ "$(lsb_release -rs)" != "20.04" ]; then
  echo "警告：此脚本针对Ubuntu 20.04优化，当前系统为$(lsb_release -ds)"
  read -p "是否继续？(y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 安装Docker和Docker Compose
echo "安装Docker和Docker Compose..."
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install -y docker-ce docker-compose

# 将当前用户添加到docker组
sudo usermod -aG docker $USER
echo "请注销并重新登录以应用docker组权限"

# 运行数据库安装脚本
echo "安装数据库..."
bash ./install/with_docker/install_database.sh

# 运行后端安装脚本
echo "安装后端..."
bash ./install/with_docker/install_backend.sh

# 运行前端安装脚本
echo "安装前端..."
bash ./install/with_docker/install_frontend.sh

# 运行Nginx安装脚本
echo "安装Nginx..."
bash ./install/with_docker/install_nginx.sh

# 启动服务
echo "启动GlobalLink服务..."
docker-compose up -d

echo "===== GlobalLink安装完成 ====="
echo "您可以通过以下地址访问服务："
echo "- 前端：http://localhost:3080"
echo "- API文档：http://localhost:8000/docs"
echo "- Nginx代理：http://localhost"