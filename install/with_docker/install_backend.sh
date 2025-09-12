#!/bin/bash

# GlobalLink 后端安装脚本 (With Docker)
# 使用Docker安装和配置GlobalLink后端服务

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

# 检查是否有sudo权限
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        log_error "此脚本需要sudo权限，请确保当前用户有sudo权限"
        exit 1
    fi
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
check_sudo

log "===== GlobalLink 后端安装开始 ====="

# 确保工作目录正确
if [ ! -d "backend" ]; then
  log_error "请在项目根目录下运行此脚本"
  exit 1
fi

# 创建环境变量文件
log "创建环境变量文件..."
# 检查backend目录是否存在
if [ ! -d "backend" ]; then
    log_warning "backend目录不存在，在当前目录创建.env文件"
    ENV_FILE=".env"
else
    log "在backend目录创建.env文件"
    ENV_FILE="backend/.env"
fi

# 如果环境变量文件不存在，则创建
if [ ! -f "$ENV_FILE" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example "$ENV_FILE"
        log "已从.env.example创建.env文件，请根据需要修改配置"
    else
        log_warning "未找到.env.example文件，创建默认.env文件"
        cat > "$ENV_FILE" << EOF
# 数据库配置
POSTGRES_SERVER=db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=globallink
POSTGRES_PORT=5432
# PostgreSQL超级用户配置
POSTGRES_SUPERUSER=postgres
POSTGRES_SUPERUSER_PASSWORD=password

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# 日志配置
TABLE_NAME_LOGS=system_logs
ENABLE_ACTIVITY_LOGGING=true
EOF
    fi
fi

# 构建后端Docker镜像
log "构建后端Docker镜像..."
docker build -t globallink-backend ./backend

log "===== GlobalLink 后端安装完成 ====="
log "后端将在运行docker-compose up时启动"
log "API文档地址: http://localhost:8000/docs"
log "提示：请确保已完成数据库安装，然后运行docker-compose up -d启动所有服务"