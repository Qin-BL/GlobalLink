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
      sudo systemctl restart docker
      sudo systemctl enable docker
      ;;
    "database")
      log "修复数据库..."
      cd "$PROJECT_ROOT"
      if [ -f "docker-compose.yml" ]; then
        docker-compose restart database redis
      else
        log "错误：docker-compose.yml文件不存在，尝试重新生成"
        bash "$PROJECT_ROOT/install/with_docker/install_database.sh"
      fi
      ;;
    "backend")
      log "修复后端..."
      cd "$PROJECT_ROOT"
      if [ -f "docker-compose.yml" ]; then
        docker-compose restart backend
      else
        log "错误：docker-compose.yml文件不存在，尝试重新生成"
        bash "$PROJECT_ROOT/install/with_docker/install_database.sh"
      fi
      ;;
    "frontend")
      log "修复前端..."
      cd "$PROJECT_ROOT"
      if [ -f "docker-compose.yml" ]; then
        docker-compose restart frontend
      else
        log "错误：docker-compose.yml文件不存在，尝试重新生成"
        bash "$PROJECT_ROOT/install/with_docker/install_database.sh"
      fi
      ;;
    "nginx")
      log "修复Nginx..."
      sudo systemctl restart nginx
      sudo systemctl enable nginx
      ;;
    "service")
      log "修复服务..."
      fix_docker_compose
      ;;
    *)
      log "无法确定当前步骤，尝试通用修复..."
      cd "$PROJECT_ROOT"
      if [ -f "docker-compose.yml" ]; then
        docker-compose down
        docker-compose up -d
      else
        log "错误：docker-compose.yml文件不存在，尝试重新生成"
        bash "$PROJECT_ROOT/install/with_docker/install_database.sh"
      fi
      ;;
  esac
  log "修复完成，尝试继续安装..."
}

# 清理函数
cleanup() {
  # 在这里添加任何清理逻辑
  log "安装过程中断，进行清理..."
}

# 修复docker-compose文件
fix_docker_compose() {
  log "修复docker-compose.yml文件..."
  if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    # 确保文件权限正确
    chown $CURRENT_USER:$CURRENT_USER "$PROJECT_ROOT/docker-compose.yml"
    log "docker-compose.yml文件修复完成"
  else
    log "警告：docker-compose.yml文件不存在，将触发重新生成"
  fi
}

# 设置错误处理和清理函数
trap 'error_handler "安装过程中出现错误"' ERR
trap 'cleanup' EXIT

# 欢迎信息
log "===== GlobalLink安装开始（Docker版本）====="

# 检查系统组件函数
check_system_component() {
  local component=$1
  if command -v $component >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# 安装系统依赖
install_system_deps() {
  CURRENT_STEP="system_deps"
  if check_status "$CURRENT_STEP"; then
    log "系统依赖已安装，跳过"
    return
  fi

  log "===== 安装系统依赖 ====="
  # 检查是否为Ubuntu 20.04
  if [ "$(lsb_release -is)" != "Ubuntu" ] || [ "$(lsb_release -rs)" != "20.04" ]; then
    log "警告：此脚本针对Ubuntu 20.04优化，当前系统为$(lsb_release -ds)"
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi

  # 更新系统包
  log "更新系统包..."
  sudo apt update -y
  sudo apt upgrade -y

  # 安装基本依赖
  log "安装基本依赖..."
  sudo apt install -y git curl wget

  set_status "$CURRENT_STEP" "completed"
}

# 安装Docker和Docker Compose
install_docker() {
  CURRENT_STEP="docker"
  if check_status "$CURRENT_STEP"; then
    log "Docker已安装，检查Docker状态..."
    if check_system_component "docker" && docker --version >/dev/null 2>&1; then
      log "Docker运行正常"
      return
    else
      log "Docker未正常运行，将重新安装"
    fi
  fi

  log "===== 安装Docker和Docker Compose ====="
  # 安装Docker依赖
  log "安装Docker依赖..."
  sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
  
  # 添加Docker GPG密钥
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  
  # 添加Docker仓库
  sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
  
  # 更新并安装Docker
  sudo apt update
  sudo apt install -y docker-ce docker-compose
  
  # 启动并启用Docker服务
  sudo systemctl start docker
  sudo systemctl enable docker
  
  set_status "$CURRENT_STEP" "completed"
}

# 配置Docker用户组
configure_docker_user() {
  # 将当前用户添加到docker组
  if ! groups $USER | grep -q docker; then
    log "将当前用户添加到docker组..."
    sudo usermod -aG docker $USER
    log "请注销并重新登录以应用docker组权限"
    log "提示：如果不想注销，可以使用 'newgrp docker' 命令临时应用权限"
  fi
}

# 安装数据库
execute_database_install() {
  CURRENT_STEP="database"
  if check_status "$CURRENT_STEP"; then
    log "数据库已安装，检查数据库服务..."
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
      cd "$PROJECT_ROOT"
      if docker-compose ps | grep -q database; then
        log "数据库容器正在运行"
      else
        log "数据库容器未运行，将重新启动"
        docker-compose up -d database redis
      fi
    else
      log "docker-compose.yml文件不存在，将重新运行数据库安装"
      cd "$PROJECT_ROOT"
      bash ./install/with_docker/install_database.sh
    fi
    return
  fi

  log "===== 安装数据库 ====="
  cd "$PROJECT_ROOT"
  bash ./install/with_docker/install_database.sh
  set_status "$CURRENT_STEP" "completed"
}

# 安装后端
execute_backend_install() {
  CURRENT_STEP="backend"
  if check_status "$CURRENT_STEP"; then
    log "后端已安装，检查后端服务..."
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
      cd "$PROJECT_ROOT"
      if docker-compose ps | grep -q backend; then
        log "后端容器正在运行"
      else
        log "后端容器未运行，将重新启动"
        docker-compose up -d backend
      fi
    else
      log "docker-compose.yml文件不存在，将重新运行数据库安装"
      cd "$PROJECT_ROOT"
      bash ./install/with_docker/install_database.sh
    fi
    return
  fi

  log "===== 安装后端 ====="
  cd "$PROJECT_ROOT"
  bash ./install/with_docker/install_backend.sh
  set_status "$CURRENT_STEP" "completed"
}

# 安装前端
execute_frontend_install() {
  CURRENT_STEP="frontend"
  if check_status "$CURRENT_STEP"; then
    log "前端已安装，检查前端服务..."
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
      cd "$PROJECT_ROOT"
      if docker-compose ps | grep -q frontend; then
        log "前端容器正在运行"
      else
        log "前端容器未运行，将重新启动"
        docker-compose up -d frontend
      fi
    else
      log "docker-compose.yml文件不存在，将重新运行数据库安装"
      cd "$PROJECT_ROOT"
      bash ./install/with_docker/install_database.sh
    fi
    return
  fi

  log "===== 安装前端 ====="
  cd "$PROJECT_ROOT"
  bash ./install/with_docker/install_frontend.sh
  set_status "$CURRENT_STEP" "completed"
}

# 安装Nginx
execute_nginx_install() {
  CURRENT_STEP="nginx"
  if check_status "$CURRENT_STEP"; then
    log "Nginx已安装，检查Nginx服务..."
    if sudo systemctl is-active --quiet nginx; then
      log "Nginx服务正在运行"
    else
      log "Nginx服务未运行，将重新启动"
      sudo systemctl start nginx
      sudo systemctl enable nginx
    fi
    return
  fi

  log "===== 安装Nginx ====="
  cd "$PROJECT_ROOT"
  bash ./install/with_docker/install_nginx.sh
  set_status "$CURRENT_STEP" "completed"
}

# 启动服务
start_services() {
  CURRENT_STEP="service"
  if check_status "$CURRENT_STEP"; then
    log "服务已启动，检查服务状态..."
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
      cd "$PROJECT_ROOT"
      docker-compose ps
      return
    else
      log "docker-compose.yml文件不存在，将重新运行数据库安装"
      cd "$PROJECT_ROOT"
      bash ./install/with_docker/install_database.sh
    fi
  fi

  log "===== 启动GlobalLink服务 ====="
  cd "$PROJECT_ROOT"
  docker-compose up -d
  set_status "$CURRENT_STEP" "completed"
}

# 执行安装步骤
install_system_deps
install_docker
configure_docker_user
execute_database_install
execute_backend_install
execute_frontend_install
execute_nginx_install
start_services

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
log "4. 如需卸载，请运行：docker-compose down"