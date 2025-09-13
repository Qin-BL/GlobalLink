#!/bin/bash

# GlobalLink 一键部署脚本
# 支持PostgreSQL数据库的完整部署
# 支持幂等性安装 - 已安装的组件不会重复安装

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 状态文件路径
STATUS_FILE="$HOME/.globallink_install_status"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 组件状态管理函数
mark_component_installed() {
    local component=$1
    local version=${2:-"1.0.0"}
    echo "${component}:${version}:$(date '+%Y-%m-%d %H:%M:%S')" >> "$STATUS_FILE"
    log_success "标记组件 $component 为已安装"
}

is_component_installed() {
    local component=$1
    if [[ -f "$STATUS_FILE" ]]; then
        grep -q "^${component}:" "$STATUS_FILE"
        return $?
    fi
    return 1
}

get_component_version() {
    local component=$1
    if [[ -f "$STATUS_FILE" ]]; then
        grep "^${component}:" "$STATUS_FILE" | tail -1 | cut -d':' -f2
    fi
}

# 检查系统组件是否已安装
check_system_component() {
    local component=$1
    case $component in
        "docker")
            command -v docker >/dev/null 2>&1 && docker --version >/dev/null 2>&1
            ;;
        "docker-compose")
            command -v docker-compose >/dev/null 2>&1 && docker-compose --version >/dev/null 2>&1
            ;;
        "node")
            command -v node >/dev/null 2>&1 && node --version >/dev/null 2>&1
            ;;
        "npm")
            command -v npm >/dev/null 2>&1 && npm --version >/dev/null 2>&1
            ;;
        "python3")
            command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1
            ;;
        "pip3")
            command -v pip3 >/dev/null 2>&1 && pip3 --version >/dev/null 2>&1
            ;;
        "nginx")
            command -v nginx >/dev/null 2>&1 && nginx -v >/dev/null 2>&1
            ;;
        "postgresql")
            command -v psql >/dev/null 2>&1 && systemctl is-active --quiet postgresql 2>/dev/null
            ;;
        *)
            return 1
            ;;
    esac
}

# 检查服务是否运行
check_service_running() {
    local service=$1
    case $service in
        "globallink-backend")
            curl -s http://localhost:8000/health >/dev/null 2>&1
            ;;
        "globallink-frontend")
            curl -s http://localhost:3000 >/dev/null 2>&1
            ;;
        "nginx")
            systemctl is-active --quiet nginx 2>/dev/null || service nginx status >/dev/null 2>&1
            ;;
        "postgresql")
            systemctl is-active --quiet postgresql 2>/dev/null || service postgresql status >/dev/null 2>&1
            ;;
        *)
            return 1
            ;;
    esac
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要使用root用户运行此脚本"
        exit 1
    fi
}

# 检查操作系统
check_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
            log_info "检测到Debian/Ubuntu系统"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
            log_info "检测到RedHat/CentOS系统"
        else
            log_error "不支持的Linux发行版"
            exit 1
        fi
    else
        log_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
}

# 安装系统依赖
install_system_dependencies() {
    if is_component_installed "system_dependencies"; then
        log_info "系统依赖已安装，检查并更新配置..."
        # 检查关键组件是否可用
        local missing_components=()
        
        if ! check_system_component "python3"; then
            missing_components+=("python3")
        fi
        if ! check_system_component "node"; then
            missing_components+=("nodejs")
        fi
        if ! check_system_component "postgresql"; then
            missing_components+=("postgresql")
        fi
        if ! check_system_component "nginx"; then
            missing_components+=("nginx")
        fi
        
        if [ ${#missing_components[@]} -eq 0 ]; then
            log_success "所有系统依赖都已正确安装"
            return
        else
            log_warning "发现缺失组件: ${missing_components[*]}，将重新安装"
        fi
    fi
    
    log_info "安装系统依赖..."
    
    if [ "$OS" = "debian" ]; then
        sudo apt update
        sudo apt install -y \
            python3 \
            python3-pip \
            python3-venv \
            nodejs \
            npm \
            postgresql \
            postgresql-contrib \
            redis-server \

            nginx \
            git \
            curl \
            wget \
            unzip
    elif [ "$OS" = "redhat" ]; then
        sudo yum update -y
        sudo yum install -y \
            python3 \
            python3-pip \
            nodejs \
            npm \
            postgresql \
            postgresql-server \
            postgresql-contrib \
            redis \

            nginx \
            git \
            curl \
            wget \
            unzip
    fi
    
    mark_component_installed "system_dependencies"
    log_success "系统依赖安装完成"
}

# 配置PostgreSQL
setup_postgresql() {
    if is_component_installed "postgresql_setup"; then
        log_info "PostgreSQL已配置，检查服务状态..."
        if check_service_running "postgresql"; then
            # 检查数据库是否存在
            if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw globallink; then
                log_success "PostgreSQL数据库已存在且服务正常"
                return
            else
                log_warning "PostgreSQL服务正常但数据库不存在，将重新创建数据库"
            fi
        else
            log_warning "PostgreSQL服务未运行，将重新启动"
        fi
    fi
    
    log_info "配置PostgreSQL数据库..."
    
    # 启动PostgreSQL服务
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # 生成postgres用户的随机密码
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    
    # 设置postgres用户密码
    sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$POSTGRES_PASSWORD';"
    
    # 检查数据库是否已存在
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw globallink; then
        log_info "数据库 globallink 已存在，跳过创建"
    else
        log_info "创建数据库和用户..."
        sudo -u postgres psql -c "CREATE DATABASE globallink;"
        sudo -u postgres psql -c "CREATE USER globallink WITH PASSWORD 'globallink_password';"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE globallink TO globallink;"
        sudo -u postgres psql -c "ALTER USER globallink CREATEDB;"
    fi
    
    # 保存postgres密码到临时文件，供create_env_file使用
    echo "POSTGRES_SUPERUSER_PASSWORD=$POSTGRES_PASSWORD" > "$HOME/.globallink_postgres_password"
    
    mark_component_installed "postgresql_setup"
    log_success "PostgreSQL配置完成"
    log_info "postgres超级用户密码已生成并将保存到.env文件中"

# 配置Redis
setup_redis() {
    log_info "配置Redis..."
    
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    log_success "Redis配置完成"
}



# 设置项目目录
setup_project_directory() {
    log_info "设置项目目录..."
    
    PROJECT_DIR="/opt/globallink"
    sudo mkdir -p $PROJECT_DIR
    sudo chown $USER:$USER $PROJECT_DIR
    
    # 复制项目文件
    cp -r ../backend $PROJECT_DIR/
    cp -r ../frontend $PROJECT_DIR/
    cp -r ../courses $PROJECT_DIR/
    
    log_success "项目目录设置完成"
}

# 安装后端依赖
install_backend_dependencies() {
    log_info "安装后端依赖..."
    
    cd $PROJECT_DIR/backend
    
    # 创建虚拟环境
    python3 -m venv venv
    source venv/bin/activate
    
    # 升级pip
    pip install --upgrade pip
    
    # 安装依赖
    pip install -r requirements.txt
    
    log_success "后端依赖安装完成"
}

# 安装前端依赖
install_frontend_dependencies() {
    log_info "安装前端依赖..."
    
    cd $PROJECT_DIR/frontend
    
    # 安装依赖
    npm install
    
    # 构建前端
    npm run build
    
    log_success "前端依赖安装完成"
}

# 创建环境配置文件
create_env_file() {
    log_info "创建环境配置文件..."
    
    # 读取postgres密码
    POSTGRES_SUPERUSER_PASSWORD=""
    if [ -f "$HOME/.globallink_postgres_password" ]; then
        source "$HOME/.globallink_postgres_password"
        rm -f "$HOME/.globallink_postgres_password"
    fi
    
    # 对密码进行URL编码以处理特殊字符
    ENCODED_POSTGRES_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('globallink_password'))")
    ENCODED_POSTGRES_SUPERUSER_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$POSTGRES_SUPERUSER_PASSWORD'))")
    
    cat > $PROJECT_DIR/backend/.env << EOF
# 数据库配置
POSTGRES_SERVER=localhost
POSTGRES_USER=globallink
POSTGRES_PASSWORD=globallink_password
POSTGRES_DB=globallink
POSTGRES_PORT=5432
# PostgreSQL超级用户配置
POSTGRES_SUPERUSER=postgres
POSTGRES_SUPERUSER_PASSWORD=$POSTGRES_SUPERUSER_PASSWORD

# 数据库URL编码密码（用于处理特殊字符）
ENCODED_POSTGRES_PASSWORD=$ENCODED_POSTGRES_PASSWORD
ENCODED_POSTGRES_SUPERUSER_PASSWORD=$ENCODED_POSTGRES_SUPERUSER_PASSWORD

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 日志配置 - 使用PostgreSQL存储所有日志数据
LOG_TABLE_NAME=system_logs
ENABLE_API_LOGGING=true
ENABLE_ACTIVITY_LOGGING=true

# JWT配置
SECRET_KEY=$(openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 管理员配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# 邮件配置
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_password
MAIL_FROM=your_email@example.com
MAIL_PORT=587
MAIL_SERVER=smtp.example.com
MAIL_FROM_NAME=GlobalLink

# 微信配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret

# 支付配置
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_alipay_private_key
ALIPAY_PUBLIC_KEY=your_alipay_public_key

# 其他配置
PROJECT_NAME=GlobalLink
BACKEND_CORS_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]
EOF
    
    log_success "环境配置文件创建完成"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    cd $PROJECT_DIR/backend
    source venv/bin/activate
    
    # 运行数据库迁移
    python -c "
from app.db.session import engine
from app.models import *
from app.db.base import Base
Base.metadata.create_all(bind=engine)
print('数据库表创建完成')
"
    
    # 初始化基础数据
    python -c "
from app.db.init_db import init_db
init_db()
print('基础数据初始化完成')
"
    
    log_success "数据库初始化完成"
}

# 创建systemd服务文件
create_systemd_services() {
    log_info "创建systemd服务文件..."
    
    # 后端服务
    sudo tee /etc/systemd/system/globallink-backend.service > /dev/null << EOF
[Unit]
Description=GlobalLink Backend Service
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR/backend
Environment=PATH=$PROJECT_DIR/backend/venv/bin
ExecStart=$PROJECT_DIR/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
    
    # 重新加载systemd
    sudo systemctl daemon-reload
    sudo systemctl enable globallink-backend.service
    
    log_success "systemd服务文件创建完成"
}

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."
    
    sudo tee /etc/nginx/sites-available/globallink > /dev/null << EOF
server {
    listen 80;
    server_name localhost;
    
    # 前端静态文件
    location / {
        root $PROJECT_DIR/frontend/build;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
    
    # 后端API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # 静态资源
    location /static/ {
        alias $PROJECT_DIR/backend/static/;
    }
}
EOF
    
    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/globallink /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    sudo nginx -t
    
    # 重启Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    log_success "Nginx配置完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 启动后端服务
    sudo systemctl start globallink-backend.service
    
    log_success "服务启动完成"
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    echo "PostgreSQL状态:"
    sudo systemctl status postgresql --no-pager -l
    
    echo "Redis状态:"
    sudo systemctl status redis-server --no-pager -l
    

    
    echo "后端服务状态:"
    sudo systemctl status globallink-backend.service --no-pager -l
    
    echo "Nginx状态:"
    sudo systemctl status nginx --no-pager -l
    
    log_success "服务状态检查完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "访问信息:"
    echo "  前端地址: http://localhost"
    echo "  后端API: http://localhost/api"
    echo "  管理员账号: admin"
    echo "  管理员密码: admin123"
    echo ""
    echo "服务管理命令:"
    echo "  启动后端: sudo systemctl start globallink-backend.service"
    echo "  停止后端: sudo systemctl stop globallink-backend.service"
    echo "  重启后端: sudo systemctl restart globallink-backend.service"
    echo "  查看日志: sudo journalctl -u globallink-backend.service -f"
    echo ""
    echo "数据库信息:"
    echo "  PostgreSQL数据库: globallink"
    echo "  数据库用户: globallink"
    echo "  数据库密码: globallink_password"
    echo "  postgres超级用户密码: 查看 $PROJECT_DIR/backend/.env 文件"
    echo ""
    echo "配置文件位置:"
    echo "  后端配置: $PROJECT_DIR/backend/.env"
    echo "  Nginx配置: /etc/nginx/sites-available/globallink"
}

# 主函数
main() {
    log_info "开始GlobalLink一键部署..."
    
    check_root
    check_os
    install_system_dependencies
    setup_postgresql
    setup_redis
    setup_project_directory
    install_backend_dependencies
    install_frontend_dependencies
    create_env_file
    init_database
    create_systemd_services
    configure_nginx
    start_services
    check_services
    show_deployment_info
    
    log_success "GlobalLink部署完成！"
}

# 运行主函数
main "$@"