#!/bin/bash

# GlobalLink 后端安装脚本 (With Docker)
# 使用Docker安装和配置GlobalLink后端服务
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

# 检测操作系统
check_system_component() {
  local component=$1
  if command -v $component >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# 错误处理函数
backend_error_handler() {
  local error_msg=$1
  log_error "后端安装错误: $error_msg"
  log "开始自动修复后端..."
  
  case $CURRENT_STEP in
    "system_deps")
      log "修复系统依赖安装..."
      sudo apt --fix-broken install -y
      sudo apt update
      ;;
    "docker_setup")
      log "修复Docker服务..."
      sudo systemctl restart docker
      sudo systemctl enable docker
      ;;
    "env_file")
      log "修复环境变量文件..."
      if [ -f "$ENV_FILE" ]; then
        backup_file "$ENV_FILE"
        if [ -f "backend/.env.example" ]; then
          cp backend/.env.example "$ENV_FILE"
        fi
      fi
      ;;
    "docker_images")
      log "修复Docker镜像..."
      docker rmi -f globallink-backend || true
      docker build --no-cache -t globallink-backend ./backend
      ;;
    "docker_compose")
      log "修复docker-compose文件..."
      if [ -f "docker-compose.yml.example" ]; then
        cp "docker-compose.yml.example" "docker-compose.yml"
      fi
      ;;
    *)
      log "无法确定当前步骤，尝试通用修复..."
      sudo systemctl restart docker
      ;;
  esac
  
  log "后端修复完成，尝试继续安装..."
}

# 清理函数
backend_cleanup() {
  # 在这里添加任何清理逻辑
  log "后端安装过程中断，进行清理..."
}

# 设置错误处理和清理函数
trap 'backend_error_handler "安装过程中出现错误"' ERR
trap 'backend_cleanup' EXIT

# 检查是否有sudo权限
check_sudo() {
  if ! sudo -n true 2>/dev/null; then
    log_error "此脚本需要sudo权限，请确保当前用户有sudo权限"
    exit 1
  fi
}

log "===== GlobalLink 后端安装开始 (Docker版本) ====="

# 输出调试信息
log "脚本所在目录: $SCRIPT_DIR"
log "项目根目录: $PROJECT_ROOT"

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 确保工作目录正确
if [ ! -d "backend" ]; then
  log_error "无法找到backend目录，请确认项目结构是否正确"
  exit 1
fi

# 安装基本系统依赖包（Docker环境需要的工具）
install_system_deps() {
  CURRENT_STEP="system_deps"
  if check_status "$CURRENT_STEP"; then
    log "系统依赖已安装，跳过"
    return
  fi
  
  log "===== 安装基础系统依赖包 ====="
  
  # 尝试更新软件包列表，如果失败则进行修复
  sudo apt update || {
    log_warning "apt update失败，尝试修复..."
    sudo apt --fix-broken install -y
    sudo apt update
  }
  
  sudo apt install -y docker.io docker-compose python3 python3-pip curl wget git || {
    log_error "无法安装基础系统依赖包"
    log_error "请检查网络连接和包管理器状态"
    exit 1
  }
  
  set_status "$CURRENT_STEP" "completed"
}

# 设置Docker服务
setup_docker() {
  CURRENT_STEP="docker_setup"
  if check_status "$CURRENT_STEP"; then
    log "Docker服务已配置，检查状态..."
    if sudo systemctl is-active --quiet docker; then
      log "Docker服务正在运行"
      return
    else
      log "Docker服务未运行，将重新启动"
      sudo systemctl start docker
      sudo systemctl enable docker
    fi
  fi
  
  log "===== 设置Docker服务 ====="
  
  # 确保Docker服务已启动
  sudo systemctl start docker || {
    log_error "无法启动Docker服务"
    exit 1
  }
  
  sudo systemctl enable docker || {
    log_warning "无法设置Docker服务开机自启"
  }
  
  set_status "$CURRENT_STEP" "completed"
}

# 创建环境变量文件
create_env_file() {
  CURRENT_STEP="env_file"
  ENV_FILE="$PROJECT_ROOT/.env"
  
  if check_status "$CURRENT_STEP"; then
    log "环境变量文件已创建，跳过"
    return
  fi
  
  log "===== 创建环境变量文件 ====="
  
  # 检查是否存在.env.example文件
  if [ -f "$PROJECT_ROOT/backend/.env.example" ]; then
    log "发现.env.example文件，基于该文件创建.env文件"
    backup_file "$ENV_FILE"
    cp "$PROJECT_ROOT/backend/.env.example" "$ENV_FILE"
  else
    log_warning "未找到.env.example文件，将创建默认.env文件"
    backup_file "$ENV_FILE"
    cat > "$ENV_FILE" << EOF
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=globallink
DB_PASSWORD=$(openssl rand -base64 12)
DB_NAME=globallink

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$(openssl rand -base64 12)

# 后端服务配置
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
SECRET_KEY=$(openssl rand -base64 32)

# 调试模式
DEBUG=False

# Docker相关配置
DOCKER_NETWORK=globallink_network
EOF
  fi
  
  log "环境变量文件已创建: $ENV_FILE"
  set_status "$CURRENT_STEP" "completed"
}

# 创建启动脚本
create_manage_scripts() {
  CURRENT_STEP="manage_scripts"
  if check_status "$CURRENT_STEP"; then
    log "管理脚本已创建，跳过"
    return
  fi
  
  log "===== 创建后端管理脚本 ====="
  
  # 创建启动脚本
  cat > "$PROJECT_ROOT/start_backend.sh" << EOF
#!/bin/bash
cd "$PROJECT_ROOT"
docker-compose up -d backend
EOF
  
  # 创建停止脚本
  cat > "$PROJECT_ROOT/stop_backend.sh" << EOF
#!/bin/bash
cd "$PROJECT_ROOT"
docker-compose down backend
EOF
  
  # 创建查看日志脚本
  cat > "$PROJECT_ROOT/logs_backend.sh" << EOF
#!/bin/bash
cd "$PROJECT_ROOT"
docker-compose logs -f backend
EOF
  
  # 添加执行权限
  chmod +x "$PROJECT_ROOT/start_backend.sh" "$PROJECT_ROOT/stop_backend.sh" "$PROJECT_ROOT/logs_backend.sh"
  
  log "后端管理脚本已创建"
  set_status "$CURRENT_STEP" "completed"
}

# 构建Docker镜像
build_docker_images() {
  CURRENT_STEP="docker_images"
  if check_status "$CURRENT_STEP"; then
    log "Docker镜像已构建，跳过"
    return
  fi
  
  log "===== 构建后端Docker镜像 ====="
  
  # 检查backend目录下是否有Dockerfile
  if [ ! -f "$PROJECT_ROOT/backend/Dockerfile" ]; then
    log_error "无法找到backend/Dockerfile，请确认项目结构是否正确"
    exit 1
  fi
  
  # 构建Docker镜像
  docker build -t globallink-backend "$PROJECT_ROOT/backend" || {
    log_error "Docker镜像构建失败，尝试重新构建..."
    # 尝试删除现有镜像并重新构建
    docker rmi -f globallink-backend || true
    # 清理Docker缓存
    docker system prune -f
    # 再次尝试构建
    docker build -t globallink-backend "$PROJECT_ROOT/backend" || {
      log_error "Docker镜像构建再次失败"
      exit 1
    }
  }
  
  # 验证镜像是否构建成功
  docker images | grep -q "globallink-backend" || {
    log_error "Docker镜像构建成功但无法在镜像列表中找到"
    exit 1
  }
  
  log "Docker镜像构建成功"
  set_status "$CURRENT_STEP" "completed"
}

# 准备docker-compose文件
prepare_docker_compose() {
  CURRENT_STEP="docker_compose"
  if check_status "$CURRENT_STEP"; then
    log "docker-compose文件已准备，跳过"
    return
  fi
  
  log "===== 准备docker-compose文件 ====="
  
  # 检查是否已存在docker-compose.yml文件
  if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    log_warning "docker-compose.yml文件已存在，将进行备份"
    backup_file "$PROJECT_ROOT/docker-compose.yml"
  fi
  
  # 确保网络存在
  if ! docker network ls | grep -q "globallink_network"; then
    docker network create globallink_network
  fi
  
  # 创建docker-compose.yml文件
  cat > "$PROJECT_ROOT/docker-compose.yml" << EOF
version: '3'

services:
  backend:
    build: ./backend
    image: globallink-backend
    container_name: globallink-backend
    ports:
      - "8000:8000"
    networks:
      - globallink_network
    depends_on:
      - db
      - redis
    env_file:
      - .env
    restart: always
  
  db:
    image: postgres:13
    container_name: globallink-db
    ports:
      - "5432:5432"
    networks:
      - globallink_network
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=globallink
      - POSTGRES_PASSWORD=${DB_PASSWORD:-default_password}
      - POSTGRES_DB=globallink
    restart: always
  
  redis:
    image: redis:6
    container_name: globallink-redis
    ports:
      - "6379:6379"
    networks:
      - globallink_network
    volumes:
      - redis_data:/data
    restart: always
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD:-default_password}"]

networks:
  globallink_network:
    external: true

volumes:
  postgres_data:
  redis_data:
EOF
  
  log "docker-compose.yml文件已创建"
  set_status "$CURRENT_STEP" "completed"
}

# 验证关键文件
validate_files() {
  CURRENT_STEP="validate_files"
  if check_status "$CURRENT_STEP"; then
    log "文件验证已完成，跳过"
    return
  fi
  
  log "===== 验证关键文件 ====="
  
  local missing_files=()
  
  # 检查Dockerfile
  if [ ! -f "$PROJECT_ROOT/backend/Dockerfile" ]; then
    missing_files+=('backend/Dockerfile')
  fi
  
  # 检查requirements.txt
  if [ ! -f "$PROJECT_ROOT/backend/requirements.txt" ]; then
    missing_files+=('backend/requirements.txt')
  fi
  
  # 检查.env文件
  if [ ! -f "$PROJECT_ROOT/.env" ]; then
    missing_files+=('.env')
  fi
  
  # 检查docker-compose.yml文件
  if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    missing_files+=('docker-compose.yml')
  fi
  
  # 如果有缺失文件，输出错误并退出
  if [ ${#missing_files[@]} -gt 0 ]; then
    log_error "以下关键文件缺失:"
    for file in "${missing_files[@]}"; do
      log_error "- $file"
    done
    log_error "请确保这些文件存在后再继续安装"
    exit 1
  fi
  
  log "所有关键文件验证通过"
  set_status "$CURRENT_STEP" "completed"
}

# 执行完整安装流程
main() {
  check_sudo
  
  install_system_deps
  setup_docker
  create_env_file
  create_manage_scripts
  build_docker_images
  prepare_docker_compose
  validate_files
  
  log ""
  log "${GREEN}===== GlobalLink 后端安装完成 =====${NC}"
  log ""
  log "项目根目录: $PROJECT_ROOT"
  log "后端Docker镜像: globallink-backend"
  log "环境变量文件: $PROJECT_ROOT/.env"
  log ""
  log "管理后端服务的命令:"
  log "- 启动后端: $PROJECT_ROOT/start_backend.sh"
  log "- 停止后端: $PROJECT_ROOT/stop_backend.sh"
  log "- 查看日志: $PROJECT_ROOT/logs_backend.sh"
  log ""
  log "后续步骤:"
  log "1. 确保数据库和Redis服务已正确安装和配置"
  log "2. 如需进行数据库初始化，请运行: docker-compose exec backend python -m app.utils.db_init"
  log ""
  log "安装成功! 请检查所有服务是否正常运行。"
}

# 执行主函数
main