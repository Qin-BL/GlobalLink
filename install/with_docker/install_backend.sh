#!/bin/bash

# 后端Docker安装脚本
set -e

echo "===== 开始安装GlobalLink后端 ====="

# 确保工作目录正确
if [ ! -d "backend" ]; then
  echo "错误：请在项目根目录下运行此脚本"
  exit 1
fi

# 创建环境变量文件
echo "创建环境变量文件..."
if [ ! -f "backend/.env" ]; then
  if [ -f "backend/.env.example" ]; then
    cp backend/.env.example backend/.env
    echo "已从.env.example创建.env文件，请根据需要修改配置"
  else
    echo "警告：未找到.env.example文件，创建默认.env文件"
    cat > backend/.env << EOF
POSTGRES_SERVER=db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=globallink
MONGODB_URI=mongodb://mongodb:27017
MONGODB_DB=globallink
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
EOF
  fi
fi

# 构建后端Docker镜像
echo "构建后端Docker镜像..."
docker build -t globallink-backend ./backend

echo "===== GlobalLink后端安装完成 ====="
echo "后端将在运行docker-compose up时启动"
echo "API文档地址: http://localhost:8000/docs"