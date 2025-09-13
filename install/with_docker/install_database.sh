#!/bin/bash

# GlobalLink 数据库安装脚本 (With Docker)
# 安装和配置PostgreSQL和Redis
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
CURRENT_STEP=""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 记录日志函数
log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
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

# 备份文件函数
backup_file() {
  local file_path=$1
  if [ -f "$file_path" ]; then
    local backup_path="$file_path.bak.$(date +'%Y%m%d%H%M%S')"
    cp "$file_path" "$backup_path"
    log_warning "已备份文件: $backup_path"
  fi
}

# 错误处理函数
database_error_handler() {
  local error_msg=$1
  log_error "数据库安装错误: $error_msg"
  log "开始自动修复数据库..."
  
  case $CURRENT_STEP in
    "pg_install")
      log "修复PostgreSQL安装..."
      sudo apt install -y --reinstall postgresql postgresql-contrib
      ;;
    "pg_config")
      log "修复PostgreSQL配置..."
      sudo systemctl restart postgresql
      ;;
    "redis_install")
      log "修复Redis安装..."
      sudo apt install -y --reinstall redis-server
      ;;
    "redis_config")
      log "修复Redis配置..."
      sudo systemctl restart redis-server
      ;;
    "docker_compose")
      log "修复docker-compose.yml文件..."
      if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        backup_file "$PROJECT_ROOT/docker-compose.yml"
      fi
      ;;
    "env_file")
      log "修复环境变量文件..."
      if [ -f "$ENV_FILE" ]; then
        backup_file "$ENV_FILE"
      fi
      ;;
    *)
      log "无法确定当前步骤，尝试通用修复..."
      sudo systemctl restart postgresql redis-server
      ;;
  esac
  
  log "数据库修复完成，尝试继续安装..."
}

# 清理函数
database_cleanup() {
  # 在这里添加任何清理逻辑
  log "数据库安装过程中断，进行清理..."
}

# 设置错误处理和清理函数
trap 'database_error_handler "安装过程中出现错误"' ERR
trap 'database_cleanup' EXIT

# 检查是否为root用户
if [[ $EUID -eq 0 ]]; then
   log_error "请不要使用root用户运行此脚本"
   exit 1
fi

# 检查系统组件函数
check_system_component() {
  local component=$1
  if command -v $component >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

log "===== GlobalLink 数据库安装开始 (Docker版本) ====="

# 安装PostgreSQL
install_postgresql() {
  CURRENT_STEP="pg_install"
  if check_status "$CURRENT_STEP"; then
    log "PostgreSQL已安装，检查服务状态..."
    if sudo systemctl is-active --quiet postgresql; then
      log "PostgreSQL服务正在运行"
      return
    else
      log "PostgreSQL服务未运行，将重新启动"
      sudo systemctl start postgresql
      sudo systemctl enable postgresql
    fi
  fi
  
  log "===== 安装PostgreSQL ====="
  
  # 更新系统包
  log "更新系统包..."
  sudo apt update
  
  # 安装PostgreSQL
  log "安装PostgreSQL..."
  sudo apt install -y postgresql postgresql-contrib
  
  # 启动PostgreSQL服务
  log "启动PostgreSQL服务..."
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
  
  set_status "$CURRENT_STEP" "completed"
}

# 配置PostgreSQL
configure_postgresql() {
  CURRENT_STEP="pg_config"
  if check_status "$CURRENT_STEP"; then
    log "PostgreSQL已配置，跳过"
    return
  fi
  
  log "===== 配置PostgreSQL数据库 ====="
  
  # 生成随机密码
  DB_PASSWORD=$(openssl rand -base64 32)
  # 生成postgres用户的随机密码
  POSTGRES_PASSWORD=$(openssl rand -base64 32)
  
  # 创建数据库用户和数据库
  sudo -u postgres psql << EOF
ALTER USER postgres WITH PASSWORD '$POSTGRES_PASSWORD';
CREATE USER globallink WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE globallink OWNER globallink;
GRANT ALL PRIVILEGES ON DATABASE globallink TO globallink;
ALTER USER globallink CREATEDB;
\q
EOF
  
  log "PostgreSQL配置完成"
  log "数据库用户: globallink"
  log "数据库名称: globallink"
  log "数据库密码: $DB_PASSWORD"
  log "postgres用户密码: $POSTGRES_PASSWORD"
  
  # 保存密码到状态文件，以便其他脚本使用
  echo "DB_PASSWORD=$DB_PASSWORD" >> "$STATUS_FILE"
  echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> "$STATUS_FILE"
  
  set_status "$CURRENT_STEP" "completed"
}

# 安装Redis
install_redis() {
  CURRENT_STEP="redis_install"
  if check_status "$CURRENT_STEP"; then
    log "Redis已安装，检查服务状态..."
    if sudo systemctl is-active --quiet redis-server; then
      log "Redis服务正在运行"
      return
    else
      log "Redis服务未运行，将重新启动"
      sudo systemctl start redis-server
      sudo systemctl enable redis-server
    fi
  fi
  
  log "===== 安装Redis ====="
  log "安装Redis..."
  sudo apt install -y redis-server
  
  set_status "$CURRENT_STEP" "completed"
}

# 配置Redis
configure_redis() {
  CURRENT_STEP="redis_config"
  if check_status "$CURRENT_STEP"; then
    log "Redis已配置，跳过"
    return
  fi
  
  log "===== 配置Redis ====="
  
  # 配置Redis以允许远程连接
  log "配置Redis..."
  sudo sed -i 's/bind 127.0.0.1/bind 0.0.0.0/g' /etc/redis/redis.conf
  
  # 启动Redis服务
  log "启动Redis服务..."
  sudo systemctl restart redis-server
  sudo systemctl enable redis-server
  
  set_status "$CURRENT_STEP" "completed"
}

# 更新docker-compose.yml
update_docker_compose() {
  CURRENT_STEP="docker_compose"
  if check_status "$CURRENT_STEP"; then
    log "docker-compose.yml已更新，跳过"
    return
  fi
  
  log "===== 更新docker-compose.yml ====="
  
  cd "$PROJECT_ROOT"
  
  # 备份现有文件
  backup_file "$PROJECT_ROOT/docker-compose.yml"
  
  # 更新docker-compose.yml中的数据库配置
  log "更新docker-compose.yml中的数据库配置..."
  cat > docker-compose.yml << EOF
version: '3.8'

services:
  backend:
    build: ./backend
    volumes:
      - ./backend:/app
      - ./courses:/app/courses
    env_file:
      - ./backend/.env
    ports:
      - "8000:8000"
    command: >
      bash -c "cd /app && \
      apt-get update && \
      apt-get install -y --no-install-recommends build-essential libpq-dev && \
      pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir -r requirements.txt && \
      uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3080:80"
    depends_on:
      - backend
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:8000/api/v1
EOF
  
  set_status "$CURRENT_STEP" "completed"
}

# 创建环境变量文件
create_env_file() {
  CURRENT_STEP="env_file"
  if check_status "$CURRENT_STEP"; then
    log "环境变量文件已创建，跳过"
    return
  fi
  
  log "===== 创建环境变量文件 ====="
  cd "$PROJECT_ROOT"
  
  # 检查backend目录是否存在
  if [ ! -d "backend" ]; then
    log_warning "backend目录不存在，在当前目录创建.env文件"
    ENV_FILE=".env"
  else
    log "在backend目录创建.env文件"
    ENV_FILE="backend/.env"
  fi
  
  # 生成随机密码（如果之前没有生成）
  if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 32)
  fi
  if [ -z "$POSTGRES_PASSWORD" ]; then
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
  fi
  
  # 备份现有.env文件（如果存在）
  if [ -f "$ENV_FILE" ]; then
    log_warning "$ENV_FILE文件已存在，将创建备份并更新数据库配置"
    backup_file "$ENV_FILE"
    
    # 创建临时文件用于更新环境变量
    TEMP_FILE="$(mktemp)"
    
    # 读取现有.env文件，更新数据库相关配置
    while IFS= read -r line || [[ -n "$line" ]]; do
      # 检查是否是需要替换的数据库配置行
      if [[ $line == POSTGRES_SERVER=* ]] || \
         [[ $line == POSTGRES_USER=* ]] || \
         [[ $line == POSTGRES_PASSWORD=* ]] || \
         [[ $line == POSTGRES_DB=* ]] || \
         [[ $line == POSTGRES_PORT=* ]] || \
         [[ $line == POSTGRES_SUPERUSER=* ]] || \
         [[ $line == POSTGRES_SUPERUSER_PASSWORD=* ]] || \
         [[ $line == REDIS_HOST=* ]] || \
         [[ $line == REDIS_PORT=* ]] || \
         [[ $line == REDIS_DB=* ]] || \
         [[ $line == REDIS_PASSWORD=* ]] || \
         [[ $line == TABLE_NAME_LOGS=* ]] || \
         [[ $line == ENABLE_ACTIVITY_LOGGING=* ]]; then
        continue
      fi
      echo "$line" >> "$TEMP_FILE"
    done < "$ENV_FILE"
    
    # 添加或更新数据库配置
    echo -e "\n# 数据库配置" >> "$TEMP_FILE"
    echo "POSTGRES_SERVER=localhost" >> "$TEMP_FILE"
    echo "POSTGRES_USER=globallink" >> "$TEMP_FILE"
    echo "POSTGRES_PASSWORD=$DB_PASSWORD" >> "$TEMP_FILE"
    echo "POSTGRES_DB=globallink" >> "$TEMP_FILE"
    echo "POSTGRES_PORT=5432" >> "$TEMP_FILE"
    echo "# PostgreSQL超级用户配置" >> "$TEMP_FILE"
    echo "POSTGRES_SUPERUSER=postgres" >> "$TEMP_FILE"
    echo "POSTGRES_SUPERUSER_PASSWORD=$POSTGRES_PASSWORD" >> "$TEMP_FILE"
    
    # 添加或更新Redis配置
    echo -e "\n# Redis配置" >> "$TEMP_FILE"
    echo "REDIS_HOST=localhost" >> "$TEMP_FILE"
    echo "REDIS_PORT=6379" >> "$TEMP_FILE"
    echo "REDIS_DB=0" >> "$TEMP_FILE"
    
    # 添加日志配置
    echo -e "\n# 日志配置 - 使用PostgreSQL存储所有日志数据" >> "$TEMP_FILE"
    echo "TABLE_NAME_LOGS=system_logs" >> "$TEMP_FILE"
    echo "ENABLE_ACTIVITY_LOGGING=true" >> "$TEMP_FILE"
    
    # 移动临时文件到目标位置
    mv "$TEMP_FILE" "$ENV_FILE"
  else
    # 创建新的.env文件
    log "创建新的.env文件"
    cat > "$ENV_FILE" << EOF
# 数据库配置
POSTGRES_SERVER=localhost
POSTGRES_USER=globallink
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=globallink
POSTGRES_PORT=5432
# PostgreSQL超级用户配置
POSTGRES_SUPERUSER=postgres
POSTGRES_SUPERUSER_PASSWORD=$POSTGRES_PASSWORD

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# 日志配置 - 使用PostgreSQL存储所有日志数据
TABLE_NAME_LOGS=system_logs
ENABLE_ACTIVITY_LOGGING=true
EOF
  fi
  
  echo "环境变量文件已创建: $ENV_FILE"
  set_status "$CURRENT_STEP" "completed"
}

# 执行安装步骤
install_postgresql
configure_postgresql
install_redis
configure_redis
update_docker_compose
create_env_file

# 安装完成
log "===== GlobalLink数据库安装完成 ====="
log "PostgreSQL和Redis已安装并配置完成"
log ""
log "数据库连接信息:" 
log "  PostgreSQL: localhost:5432/globallink"
log "  用户名: globallink"
log "  密码: $DB_PASSWORD"
log "  postgres超级用户密码: $POSTGRES_PASSWORD"
log "  Redis: localhost:6379"
log ""
log "重要提示:" 
log "1. 数据库密码已保存在 $ENV_FILE 文件中"
log "2. 所有日志数据现在存储在PostgreSQL中"
log "3. 请妥善保管数据库密码和postgres超级用户密码"
log ""
log "下一步: 运行后端安装脚本"

# 保存数据库连接信息到状态文件，以便其他脚本使用
set_status "db_install_completed" "true"

# 清理trap
trap - ERR EXIT