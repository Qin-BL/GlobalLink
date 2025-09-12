#!/bin/bash

# GlobalLink安装主脚本（使用Docker）
# 此脚本整合了所有安装流程和修复功能，支持断点续装和自动修复
set -e

# 确保使用bash而不是sh
if [ -z "$BASH_VERSION" ]; then
  echo "错误：请使用bash而不是sh运行此脚本"
  exit 1
fi

# 全局变量
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"
LOG_FILE="$PROJECT_ROOT/install.log"
STATUS_FILE="$PROJECT_ROOT/install.status"
CURRENT_USER=$(whoami)
CURRENT_STEP=""

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 记录日志函数
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查状态函数
check_status() {
  local step=$1
  if [ -f "$STATUS_FILE" ] && grep -q "$step=completed" "$STATUS_FILE"; then
    return 0
  else
    return 1
  fi
}

# 设置状态函数
set_status() {
  local step=$1
  local status=$2
  if [ -f "$STATUS_FILE" ]; then
    sed -i "/$step=.*/d" "$STATUS_FILE"
  fi
  echo "$step=$status" >> "$STATUS_FILE"
}

# 错误处理函数
error_handler() {
  local error_msg=$1
  log "错误: $error_msg"
  log "开始自动修复..."
  # 尝试修复
  case $CURRENT_STEP in
    "system_deps")
      log "修复系统依赖..."
      sudo apt update --fix-missing
      ;;
    "docker")
      log "修复Docker..."
      sudo service docker restart
      ;;
    "database")
      log "修复数据库..."
      cd "$PROJECT_ROOT"
      docker-compose restart database redis
      ;;
    "backend")
      log "修复后端..."
      cd "$PROJECT_ROOT"
      docker-compose restart backend
      ;;
    "frontend")
      log "修复前端..."
      cd "$PROJECT_ROOT"
      docker-compose restart frontend
      ;;
    "nginx")
      log "修复Nginx..."
      sudo service nginx restart
      ;;
    *)
      log "无法确定当前步骤，尝试通用修复..."
      cd "$PROJECT_ROOT"
      docker-compose down
      docker-compose up -d
      ;;
  esac
  log "修复完成，尝试继续安装..."
}

# 清理函数
cleanup() {
  # 在这里添加任何清理逻辑
  log "安装过程中断，进行清理..."
}

# 设置错误处理和清理函数
trap 'error_handler "安装过程中出现错误"' ERR
trap 'cleanup' EXIT

# 欢迎信息
log "===== GlobalLink安装开始（Docker版本）====="

# 检查是否为Ubuntu 20.04
if [ "$(lsb_release -is)" != "Ubuntu" ] || [ "$(lsb_release -rs)" != "20.04" ]; then
  log "警告：此脚本针对Ubuntu 20.04优化，当前系统为$(lsb_release -ds)"
  read -p "是否继续？(y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 系统依赖安装
CURRENT_STEP="system_deps"
if ! check_status "system_deps"; then
  log "更新系统包..."
  sudo apt update -y
  sudo apt upgrade -y
  set_status "system_deps" "completed"
fi

# 安装Docker和Docker Compose
CURRENT_STEP="docker"
if ! check_status "docker"; then
  log "安装Docker和Docker Compose..."
  sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
  sudo apt update
  sudo apt install -y docker-ce docker-compose
  set_status "docker" "completed"
fi

# 将当前用户添加到docker组
sudo usermod -aG docker $USER
log "请注销并重新登录以应用docker组权限"
log "提示：如果不想注销，可以使用 'newgrp docker' 命令临时应用权限"

# 运行数据库安装脚本
CURRENT_STEP="database"
if ! check_status "database"; then
  log "安装数据库..."
  cd "$PROJECT_ROOT"
  bash ./install/with_docker/install_database.sh
  set_status "database" "completed"
fi

# 运行后端安装脚本
CURRENT_STEP="backend"
if ! check_status "backend"; then
  log "安装后端..."
  cd "$PROJECT_ROOT"
  bash ./install/with_docker/install_backend.sh
  set_status "backend" "completed"
fi

# 运行前端安装脚本
CURRENT_STEP="frontend"
if ! check_status "frontend"; then
  log "安装前端..."
  cd "$PROJECT_ROOT"
  bash ./install/with_docker/install_frontend.sh
  set_status "frontend" "completed"
fi

# 运行Nginx安装脚本
CURRENT_STEP="nginx"
if ! check_status "nginx"; then
  log "安装Nginx..."
  cd "$PROJECT_ROOT"
  bash ./install/with_docker/install_nginx.sh
  set_status "nginx" "completed"
fi

# 启动服务
CURRENT_STEP="service"
if ! check_status "service"; then
  log "启动GlobalLink服务..."
  cd "$PROJECT_ROOT"
  docker-compose up -d
  set_status "service" "completed"
fi

# 安装完成
log "===== GlobalLink安装完成 ====="
log "您可以通过以下地址访问服务："
log "- 前端：http://localhost:3080"
log "- API文档：http://localhost:8000/docs"
log "- Nginx代理：https://localhost (HTTPS)"
log "- Nginx代理（HTTP）：http://localhost (会自动重定向到HTTPS)"
log ""
log "重要提示："
log "1. 如果遇到权限问题，请确保已注销并重新登录以应用docker组权限"
log "2. 如果服务无法访问，请检查防火墙设置"
log "3. 查看日志可以帮助排查问题：docker-compose logs"
log "4. 如需卸载，请运行：docker-compose down && rm -rf $PROJECT_ROOT"