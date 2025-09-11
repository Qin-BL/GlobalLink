#!/bin/bash

# GlobalLink Docker一键部署脚本
# 使用Docker Compose进行容器化部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        log_info "安装Docker: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_success "Docker环境检查通过"
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用..."
    
    ports=(80 443 3000 5432 6379 8000 27017)
    occupied_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -tuln | grep ":$port " > /dev/null 2>&1; then
            occupied_ports+=($port)
        fi
    done
    
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        log_warning "以下端口被占用: ${occupied_ports[*]}"
        log_warning "请确保这些端口可用或修改docker-compose.yml中的端口配置"
        read -p "是否继续部署? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "端口检查完成"
}

# 创建环境配置文件
create_env_files() {
    log_info "创建环境配置文件..."
    
    # 后端环境配置
    cat > ../backend/.env << EOF
# 数据库配置
POSTGRES_SERVER=postgres
POSTGRES_USER=globallink_user
POSTGRES_PASSWORD=globallink_password
POSTGRES_DB=globallink
POSTGRES_PORT=5432

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# MongoDB配置
MONGODB_URL=mongodb://mongodb:27017/globallink_logs

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
BACKEND_CORS_ORIGINS=["http://localhost", "http://localhost:3000"]
EOF

    # 前端环境配置
    cat > ../frontend/.env << EOF
REACT_APP_API_URL=http://localhost/api
GENERATE_SOURCEMAP=false
EOF

    log_success "环境配置文件创建完成"
}

# 创建数据库初始化脚本
create_db_init_script() {
    log_info "创建数据库初始化脚本..."
    
    mkdir -p ../backend/scripts
    
    cat > ../backend/scripts/init.sql << EOF
-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建数据库（如果不存在）
SELECT 'CREATE DATABASE globallink'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'globallink');
EOF

    log_success "数据库初始化脚本创建完成"
}

# 构建和启动服务
build_and_start() {
    log_info "构建和启动服务..."
    
    cd ..
    
    # 停止现有服务
    docker-compose down -v 2>/dev/null || true
    
    # 构建镜像
    log_info "构建Docker镜像..."
    docker-compose build --no-cache
    
    # 启动服务
    log_info "启动服务..."
    docker-compose up -d
    
    log_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    log_info "等待服务就绪..."
    
    # 等待PostgreSQL
    log_info "等待PostgreSQL启动..."
    timeout=60
    while ! docker-compose exec -T postgres pg_isready -U globallink_user -d globallink > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            log_error "PostgreSQL启动超时"
            exit 1
        fi
    done
    log_success "PostgreSQL已就绪"
    
    # 等待Redis
    log_info "等待Redis启动..."
    timeout=30
    while ! docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            log_error "Redis启动超时"
            exit 1
        fi
    done
    log_success "Redis已就绪"
    
    # 等待后端服务
    log_info "等待后端服务启动..."
    timeout=60
    while ! curl -f http://localhost:8000/health > /dev/null 2>&1; do
        sleep 3
        timeout=$((timeout - 3))
        if [ $timeout -le 0 ]; then
            log_error "后端服务启动超时"
            exit 1
        fi
    done
    log_success "后端服务已就绪"
    
    log_success "所有服务已就绪"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    # 运行数据库迁移
    docker-compose exec backend python -c "
from app.db.session import engine
from app.models import *
from app.db.base import Base
Base.metadata.create_all(bind=engine)
print('数据库表创建完成')
"
    
    # 初始化基础数据
    docker-compose exec backend python -c "
from app.db.init_db import init_db
init_db()
print('基础数据初始化完成')
"
    
    log_success "数据库初始化完成"
}

# 显示服务状态
show_status() {
    log_info "服务状态:"
    docker-compose ps
    
    echo ""
    log_info "服务日志 (最近10行):"
    docker-compose logs --tail=10
}

# 显示部署信息
show_deployment_info() {
    log_success "Docker部署完成！"
    echo ""
    echo "访问信息:"
    echo "  前端地址: http://localhost"
    echo "  后端API: http://localhost/api"
    echo "  管理员账号: admin"
    echo "  管理员密码: admin123"
    echo ""
    echo "Docker管理命令:"
    echo "  查看状态: docker-compose ps"
    echo "  查看日志: docker-compose logs -f [service_name]"
    echo "  重启服务: docker-compose restart [service_name]"
    echo "  停止服务: docker-compose down"
    echo "  完全清理: docker-compose down -v --rmi all"
    echo ""
    echo "数据库连接信息:"
    echo "  PostgreSQL: localhost:5432"
    echo "  数据库名: globallink"
    echo "  用户名: globallink_user"
    echo "  密码: globallink_password"
    echo ""
    echo "Redis连接: localhost:6379"
    echo "MongoDB连接: localhost:27017"
}

# 清理函数
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "部署失败，正在清理..."
        cd .. 2>/dev/null || true
        docker-compose down -v 2>/dev/null || true
    fi
}

# 设置清理陷阱
trap cleanup EXIT

# 主函数
main() {
    log_info "开始GlobalLink Docker部署..."
    
    check_docker
    check_ports
    create_env_files
    create_db_init_script
    build_and_start
    wait_for_services
    init_database
    show_status
    show_deployment_info
    
    log_success "GlobalLink Docker部署完成！"
}

# 运行主函数
main "$@"