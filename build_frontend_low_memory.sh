#!/bin/bash

# GlobalLink前端低内存机器构建脚本
# 适用于1核2G等资源受限的Linux测试环境

# 确保脚本在遇到错误时立即退出
set -e

# 显示欢迎信息
cat << 'EOF'
==========================================================
 GlobalLink前端低内存优化构建脚本
 适用于1核2G等资源受限的Linux测试环境
==========================================================
EOF

# 检查当前目录是否正确
if [ ! -d "frontend" ]; then
  echo "❌ 错误：找不到frontend目录，请在项目根目录运行此脚本"
  exit 1
fi

# 进入frontend目录
cd frontend

# 显示当前系统资源信息
if command -v free &> /dev/null && command -v grep &> /dev/null; then
  echo "
📊 当前系统内存状态："
  free -h
  echo "📊 当前系统CPU信息："
  cat /proc/cpuinfo | grep 'model name' | head -n 1 || echo "无法获取CPU信息"
fi

# 配置低内存优化参数
NODE_OPTIONS="--max-old-space-size=1024 --optimize-for-size --max-semi-space-size=256"
export NODE_OPTIONS

echo "
⚙️ 正在应用内存优化配置："
echo "- Node.js内存限制：1024MB"
echo "- 启用大小优化模式"
echo "- 调整半空间大小：256MB"

# 清理npm缓存，减少内存占用
echo "
🧹 清理npm缓存..."
npm cache clean --force

# 安装依赖 - 使用--prefer-offline和--no-audit参数减少内存使用
echo "
📦 正在安装依赖..."
npm install --prefer-offline --no-audit --no-fund

# 构建项目 - 添加--max-old-space-size参数
echo "
🚀 开始构建项目（低内存模式）..."
# 使用--minify选项进行更激进的压缩，减少打包体积
npm run build

# 检查构建是否成功
if [ -d "build" ]; then
  echo "
✅ 构建成功！输出目录：build/"
  echo "
📁 构建结果大小："
  du -sh build/
  echo "
🎯 低内存优化构建完成！"
  echo "
💡 后续建议："
  echo "1. 考虑使用swap空间增加虚拟内存"
  echo "2. 如有可能，在更高配置的机器上构建后部署"
  echo "3. 对于持续集成，考虑使用CI/CD工具"
else
  echo "
❌ 构建失败！请检查错误信息。"
  echo "
💡 可能的解决方案："
  echo "1. 增加swap空间：sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
  echo "2. 使用更激进的内存限制：NODE_OPTIONS=\"--max-old-space-size=768\" npm run build"
  exit 1
fi