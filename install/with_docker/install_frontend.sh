#!/bin/bash

# GlobalLink 前端安装脚本 (With Docker)
# 使用Docker安装和配置GlobalLink前端服务

set -e

# 确保使用bash而不是sh
if [ -z "$BASH_VERSION" ]; then
  echo "错误：请使用bash而不是sh运行此脚本"
  exit 1
fi

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[\$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    elif type lsb_release >/dev/null 2>&1; then
        OS=$(lsb_release -si)
        VER=$(lsb_release -sr)
    elif [ -f /etc/redhat-release ]; then
        OS="Red Hat Enterprise Linux"
        VER=$(cat /etc/redhat-release | sed 's/.*release \([0-9.]*\).*/\1/')
    else
        OS=$(uname -s)
        VER=$(uname -r)
    fi
    log "检测到操作系统: $OS $VER"
}

# 错误处理函数
handle_error() {
    log_error "安装过程中出现问题，请检查上面的错误信息"
    log_error "如果是网络问题，请稍后重试"
    log_error "如果是权限问题，请确保有sudo权限"
    exit 1
}

# 设置错误处理
trap 'handle_error' ERR

detect_os

log "===== GlobalLink 前端安装开始 ====="

# 输出调试信息
log "脚本所在目录: $SCRIPT_DIR"
log "项目根目录: $PROJECT_ROOT"

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 确保工作目录正确
if [ ! -d "frontend" ]; then
  log_error "无法找到frontend目录，请确认项目结构是否正确"
  exit 1
fi

# 修改前端端口配置
log "修改前端端口为3080..."
sed -i 's/"start": "react-scripts start"/"start": "PORT=3080 react-scripts start"/g' frontend/package.json

# 修改docker-compose.yml中的端口映射
log "更新docker-compose.yml中的端口配置..."
sed -i 's/"3000:80"/"3080:80"/g' docker-compose.yml

# 修改后端CORS配置
log "更新后端CORS配置..."
sed -i 's/"http:\/\/localhost:3000"/"http:\/\/localhost:3080"/g' backend/app/core/config.py

# 构建前端Docker镜像
log "构建前端Docker镜像..."
docker build -t globallink-frontend ./frontend

log "===== GlobalLink 前端安装完成 ====="
log "前端将在运行docker-compose up时启动"
log "访问地址: http://localhost:3080"
log "提示：请确保已完成数据库和后端安装，然后运行docker-compose up -d启动所有服务"