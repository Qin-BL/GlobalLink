#!/bin/bash

# 构建前端应用的脚本

# 检查是否在正确的项目根目录
if [ ! -d "frontend" ]; then
  echo "错误: 请在 GlobalLink 项目根目录下运行此脚本"
  echo "当前目录: $(pwd)"
  exit 1
fi

# 进入 frontend 目录
echo "正在进入 frontend 目录..."
cd frontend

# 检查 package.json 是否存在
if [ ! -f "package.json" ]; then
  echo "错误: frontend 目录中未找到 package.json 文件"
  exit 1
fi

# 检查是否安装了 npm
echo "检查 npm 是否安装..."
if ! command -v npm &> /dev/null; then
  echo "错误: npm 未安装，请先安装 Node.js 和 npm"
  exit 1
fi

# 安装依赖
echo "正在安装依赖..."
npm install
if [ $? -ne 0 ]; then
  echo "错误: 依赖安装失败"
  exit 1
fi

# 构建前端应用
echo "正在构建前端应用..."
npm run build
if [ $? -ne 0 ]; then
  echo "错误: 前端应用构建失败"
  exit 1
fi

echo "前端应用构建成功!"
echo "构建文件位于 frontend/build 目录中"