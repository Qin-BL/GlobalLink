#!/bin/bash

# GlobalLink 前端安装脚本 (With Docker)
# 使用Docker安装和配置GlobalLink前端服务
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
frontend_error_handler() {
  local error_msg=$1
  log_error "前端安装错误: $error_msg"
  log "开始自动修复前端..."
  
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
    "config_update")
      log "修复前端配置..."
      # 尝试恢复配置文件
      if [ -f "$PROJECT_ROOT/frontend/package.json.bak*" ]; then
        latest_backup=$(ls -t "$PROJECT_ROOT/frontend/package.json.bak*" | head -n 1)
        cp "$latest_backup" "$PROJECT_ROOT/frontend/package.json"
        log "已恢复package.json文件"
      fi
      ;;
    "docker_images")
      log "修复Docker镜像..."
      docker rmi -f globallink-frontend || true
      docker build --no-cache -t globallink-frontend ./frontend
      ;;
    "docker_compose")
      log "修复docker-compose文件..."
      if [ -f "$PROJECT_ROOT/docker-compose.yml.bak*" ]; then
        latest_backup=$(ls -t "$PROJECT_ROOT/docker-compose.yml.bak*" | head -n 1)
        cp "$latest_backup" "$PROJECT_ROOT/docker-compose.yml"
        log "已恢复docker-compose.yml文件"
      fi
      ;;
    *)
      log "无法确定当前步骤，尝试通用修复..."
      sudo systemctl restart docker
      ;;
  esac
  
  log "前端修复完成，尝试继续安装..."
}

# 清理函数
frontend_cleanup() {
  # 在这里添加任何清理逻辑
  log "前端安装过程中断，进行清理..."
}

# 设置错误处理和清理函数
trap 'frontend_error_handler "安装过程中出现错误"' ERR
trap 'frontend_cleanup' EXIT

# 检查是否有sudo权限
check_sudo() {
  if ! sudo -n true 2>/dev/null; then
    log_error "此脚本需要sudo权限，请确保当前用户有sudo权限"
    exit 1
  fi
}

# 检查系统依赖
check_system_deps() {
  CURRENT_STEP="system_deps"
  if check_status "$CURRENT_STEP"; then
    log "系统依赖检查已完成，跳过"
    return
  fi
  
  log "===== 检查系统依赖 ====="
  
  # 确保Docker服务正在运行
  if ! sudo systemctl is-active --quiet docker; then
    log_warning "Docker服务未运行，尝试启动..."
    sudo systemctl start docker || {
      log_error "无法启动Docker服务"
      exit 1
    }
  fi
  
  set_status "$CURRENT_STEP" "completed"
}

# 更新前端配置
update_frontend_config() {
  CURRENT_STEP="config_update"
  if check_status "$CURRENT_STEP"; then
    log "前端配置已更新，跳过"
    return
  fi
  
  log "===== 更新前端配置 ====="
  
  # 备份package.json文件
  backup_file "$PROJECT_ROOT/frontend/package.json"
  
  # 修改前端端口配置
  log "修改前端端口为3080..."
  sed -i 's/"start": "react-scripts start"/"start": "PORT=3080 react-scripts start"/g' "$PROJECT_ROOT/frontend/package.json" || {
    log_error "无法修改前端端口配置"
    # 尝试修复sed命令
    if command -v gsed >/dev/null 2>&1; then
      log_warning "尝试使用gsed命令..."
      gsed -i 's/"start": "react-scripts start"/"start": "PORT=3080 react-scripts start"/g' "$PROJECT_ROOT/frontend/package.json" || {
        log_error "使用gsed也无法修改前端端口配置"
        exit 1
      }
    else
      log_warning "未找到gsed，尝试其他方法..."
      # 检查文件是否存在并手动更新
      if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
        temp_file=$(mktemp)
        awk '/"start": "react-scripts start"/ {sub("react-scripts start", "PORT=3080 react-scripts start")} 1' "$PROJECT_ROOT/frontend/package.json" > "$temp_file"
        mv "$temp_file" "$PROJECT_ROOT/frontend/package.json"
        log "已成功更新前端端口配置"
      fi
    fi
  }
  
  set_status "$CURRENT_STEP" "completed"
}

# 更新docker-compose文件
update_docker_compose() {
  CURRENT_STEP="docker_compose"
  if check_status "$CURRENT_STEP"; then
    log "docker-compose文件已更新，跳过"
    return
  fi
  
  log "===== 更新docker-compose文件 ====="
  
  # 备份docker-compose.yml文件
  backup_file "$PROJECT_ROOT/docker-compose.yml"
  
  # 检查docker-compose.yml是否存在
  if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    log_warning "未找到docker-compose.yml文件，将创建一个新的"
    # 创建基本的docker-compose.yml文件
    cat > "$PROJECT_ROOT/docker-compose.yml" << EOF
version: '3'

services:
  frontend:
    build: ./frontend
    image: globallink-frontend
    container_name: globallink-frontend
    ports:
      - "3080:80"
    networks:
      - globallink_network
    depends_on:
      - backend
    restart: always

networks:
  globallink_network:
    external: true
EOF
  else
    # 修改docker-compose.yml中的端口映射
    log "更新docker-compose.yml中的端口配置..."
    sed -i 's/"3000:80"/"3080:80"/g' "$PROJECT_ROOT/docker-compose.yml" || {
      log_error "无法更新docker-compose.yml中的端口配置"
      # 尝试修复sed命令
      if command -v gsed >/dev/null 2>&1; then
        log_warning "尝试使用gsed命令..."
        gsed -i 's/"3000:80"/"3080:80"/g' "$PROJECT_ROOT/docker-compose.yml" || {
          log_error "使用gsed也无法更新docker-compose.yml中的端口配置"
          exit 1
        }
      else
        log_warning "未找到gsed，将手动更新docker-compose.yml"
        # 手动更新docker-compose.yml文件
        temp_file=$(mktemp)
        awk '/3000:80/ {sub("3000:80", "3080:80")} 1' "$PROJECT_ROOT/docker-compose.yml" > "$temp_file"
        mv "$temp_file" "$PROJECT_ROOT/docker-compose.yml"
        log "已成功更新docker-compose.yml中的端口配置"
      fi
    }
    
    # 检查并添加前端服务配置（如果不存在）
    if ! grep -q "globallink-frontend" "$PROJECT_ROOT/docker-compose.yml"; then
      log_warning "docker-compose.yml中未找到前端服务配置，将添加"
      # 备份当前文件
      backup_file "$PROJECT_ROOT/docker-compose.yml"
      
      # 在services部分添加frontend服务
      temp_file=$(mktemp)
      awk '/services:/ {print; print "  frontend:\n    build: ./frontend\n    image: globallink-frontend\n    container_name: globallink-frontend\n    ports:\n      - \"3080:80\"\n    networks:\n      - globallink_network\n    depends_on:\n      - backend\n    restart: always"; next} 1' "$PROJECT_ROOT/docker-compose.yml" > "$temp_file"
      mv "$temp_file" "$PROJECT_ROOT/docker-compose.yml"
      log "已成功添加前端服务配置到docker-compose.yml"
    fi
  fi
  
  set_status "$CURRENT_STEP" "completed"
}

# 更新后端CORS配置
update_backend_cors() {
  CURRENT_STEP="backend_cors"
  if check_status "$CURRENT_STEP"; then
    log "后端CORS配置已更新，跳过"
    return
  fi
  
  log "===== 更新后端CORS配置 ====="
  
  # 检查后端配置文件是否存在
  if [ ! -f "$PROJECT_ROOT/backend/app/core/config.py" ]; then
    log_warning "未找到后端配置文件，跳过CORS配置更新"
    set_status "$CURRENT_STEP" "completed"
    return
  fi
  
  # 备份配置文件
  backup_file "$PROJECT_ROOT/backend/app/core/config.py"
  
  # 更新后端CORS配置
  log "更新后端CORS配置以允许前端访问..."
  sed -i 's/"http:\/\/localhost:3000"/"http:\/\/localhost:3080"/g' "$PROJECT_ROOT/backend/app/core/config.py" || {
    log_error "无法更新后端CORS配置"
    # 尝试修复sed命令
    if command -v gsed >/dev/null 2>&1; then
      log_warning "尝试使用gsed命令..."
      gsed -i 's/"http:\/\/localhost:3000"/"http:\/\/localhost:3080"/g' "$PROJECT_ROOT/backend/app/core/config.py" || {
        log_error "使用gsed也无法更新后端CORS配置"
        # 检查是否是文件格式问题
        if ! file "$PROJECT_ROOT/backend/app/core/config.py" | grep -q "ASCII"; then
          log_warning "文件可能不是ASCII格式，尝试其他方法..."
          # 使用Python来处理文件
          if command -v python3 >/dev/null 2>&1; then
            python3 -c "\nwith open('$PROJECT_ROOT/backend/app/core/config.py', 'r', encoding='utf-8') as f:\n    content = f.read()\ncontent = content.replace('http://localhost:3000', 'http://localhost:3080')\nwith open('$PROJECT_ROOT/backend/app/core/config.py', 'w', encoding='utf-8') as f:\n    f.write(content)\n" || {
              log_error "使用Python也无法更新后端CORS配置"
              exit 1
            }
            log "已成功使用Python更新后端CORS配置"
          else
            log_error "未找到Python，无法更新后端CORS配置"
            exit 1
          fi
        fi
      }
    else
      log_warning "未找到gsed，跳过CORS配置更新"
    fi
  }
  
  set_status "$CURRENT_STEP" "completed"
}

# 构建前端Docker镜像
build_frontend_image() {
  CURRENT_STEP="docker_images"
  if check_status "$CURRENT_STEP"; then
    log "前端Docker镜像已构建，跳过"
    return
  fi
  
  log "===== 构建前端Docker镜像 ====="
  
  # 确保前端目录存在
  if [ ! -d "$PROJECT_ROOT/frontend" ]; then
    log_error "无法找到frontend目录，请确认项目结构是否正确"
    exit 1
  fi
  
  # 检查前端目录下是否有Dockerfile
  if [ ! -f "$PROJECT_ROOT/frontend/Dockerfile" ]; then
    log_warning "未找到frontend/Dockerfile，将创建一个默认的"
    cat > "$PROJECT_ROOT/frontend/Dockerfile" << EOF
# 使用Node.js作为构建环境
FROM node:16-alpine as build

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建前端应用
RUN npm run build

# 使用Nginx作为Web服务器
FROM nginx:alpine

# 复制构建好的前端文件到Nginx的html目录
COPY --from=build /app/build /usr/share/nginx/html

# 复制Nginx配置文件（如果存在）
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || true

# 暴露端口
EXPOSE 80

# 启动Nginx服务
CMD ["nginx", "-g", "daemon off;"]
EOF
  fi
  
  # 构建前端Docker镜像
  log "开始构建前端Docker镜像..."
  docker build -t globallink-frontend "$PROJECT_ROOT/frontend" || {
    log_error "Docker镜像构建失败，尝试重新构建..."
    # 尝试删除现有镜像并重新构建
    docker rmi -f globallink-frontend || true
    # 清理Docker缓存
    docker system prune -f
    # 再次尝试构建
    docker build -t globallink-frontend "$PROJECT_ROOT/frontend" || {
      log_error "Docker镜像构建再次失败"
      # 提供调试信息
      log_warning "请检查以下可能的问题："
      log_warning "1. 网络连接是否正常"
      log_warning "2. Docker服务是否正常运行"
      log_warning "3. frontend目录结构是否正确"
      log_warning "4. package.json文件是否有效"
      exit 1
    }
  }
  
  # 验证镜像是否构建成功
  docker images | grep -q "globallink-frontend" || {
    log_error "Docker镜像构建成功但无法在镜像列表中找到"
    exit 1
  }
  
  log "前端Docker镜像构建成功"
  set_status "$CURRENT_STEP" "completed"
}

# 创建管理脚本
create_manage_scripts() {
  CURRENT_STEP="manage_scripts"
  if check_status "$CURRENT_STEP"; then
    log "管理脚本已创建，跳过"
    return
  fi
  
  log "===== 创建前端管理脚本 ====="
  
  # 创建启动脚本
  cat > "$PROJECT_ROOT/start_frontend.sh" << EOF
#!/bin/bash
cd "$PROJECT_ROOT"
docker-compose up -d frontend
EOF
  
  # 创建停止脚本
  cat > "$PROJECT_ROOT/stop_frontend.sh" << EOF
#!/bin/bash
cd "$PROJECT_ROOT"
docker-compose down frontend
EOF
  
  # 创建查看日志脚本
  cat > "$PROJECT_ROOT/logs_frontend.sh" << EOF
#!/bin/bash
cd "$PROJECT_ROOT"
docker-compose logs -f frontend
EOF
  
  # 添加执行权限
  chmod +x "$PROJECT_ROOT/start_frontend.sh" "$PROJECT_ROOT/stop_frontend.sh" "$PROJECT_ROOT/logs_frontend.sh"
  
  log "前端管理脚本已创建"
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
  
  # 检查前端目录
  if [ ! -d "$PROJECT_ROOT/frontend" ]; then
    missing_files+=('frontend目录')
  fi
  
  # 检查前端Dockerfile
  if [ ! -f "$PROJECT_ROOT/frontend/Dockerfile" ]; then
    missing_files+=('frontend/Dockerfile')
  fi
  
  # 检查package.json
  if [ ! -f "$PROJECT_ROOT/frontend/package.json" ]; then
    missing_files+=('frontend/package.json')
  fi
  
  # 检查docker-compose.yml
  if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    missing_files+=('docker-compose.yml')
  fi
  
  # 如果有缺失文件，输出错误并退出
  if [ ${#missing_files[@]} -gt 0 ]; then
    log_error "以下关键文件或目录缺失:"
    for item in "${missing_files[@]}"; do
      log_error "- $item"
    done
    log_error "请确保这些文件或目录存在后再继续安装"
    exit 1
  fi
  
  log "所有关键文件验证通过"
  set_status "$CURRENT_STEP" "completed"
}

# 执行完整安装流程
main() {
  detect_os
  check_sudo
  
  # 切换到项目根目录
  cd "$PROJECT_ROOT"
  
  log "===== GlobalLink 前端安装开始 (Docker版本) ====="
  
  # 输出调试信息
  log "脚本所在目录: $SCRIPT_DIR"
  log "项目根目录: $PROJECT_ROOT"
  
  # 确保工作目录正确
  if [ ! -d "frontend" ]; then
    log_error "无法找到frontend目录，请确认项目结构是否正确"
    exit 1
  fi
  
  check_system_deps
  update_frontend_config
  update_docker_compose
  update_backend_cors
  build_frontend_image
  create_manage_scripts
  validate_files
  
  log ""
  log "${GREEN}===== GlobalLink 前端安装完成 =====${NC}"
  log ""
  log "项目根目录: $PROJECT_ROOT"
  log "前端Docker镜像: globallink-frontend"
  log ""
  log "管理前端服务的命令:"
  log "- 启动前端: $PROJECT_ROOT/start_frontend.sh"
  log "- 停止前端: $PROJECT_ROOT/stop_frontend.sh"
  log "- 查看日志: $PROJECT_ROOT/logs_frontend.sh"
  log ""
  log "前端访问地址: http://localhost:3080"
  log ""
  log "后续步骤:"
  log "1. 确保数据库和后端服务已正确安装和配置"
  log "2. 运行以下命令启动所有服务:"
  log "   docker-compose up -d"
  log ""
  log "安装成功! 请检查所有服务是否正常运行。"
}

# 执行主函数
main