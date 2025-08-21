#!/bin/bash

# 前端Docker安装脚本
set -e

echo "===== 开始安装GlobalLink前端 ====="

# 确保工作目录正确
if [ ! -d "frontend" ]; then
  echo "错误：请在项目根目录下运行此脚本"
  exit 1
fi

# 修改前端端口配置
echo "修改前端端口为3080..."
sed -i 's/"start": "react-scripts start"/"start": "PORT=3080 react-scripts start"/g' frontend/package.json

# 修改docker-compose.yml中的端口映射
echo "更新docker-compose.yml中的端口配置..."
sed -i 's/"3000:80"/"3080:80"/g' docker-compose.yml

# 修改后端CORS配置
echo "更新后端CORS配置..."
sed -i 's/"http:\/\/localhost:3000"/"http:\/\/localhost:3080"/g' backend/app/core/config.py

# 构建前端Docker镜像
echo "构建前端Docker镜像..."
docker build -t globallink-frontend ./frontend

echo "===== GlobalLink前端安装完成 ====="
echo "前端将在运行docker-compose up时启动"
echo "访问地址: http://localhost:3080"