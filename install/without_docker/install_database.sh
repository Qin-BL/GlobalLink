#!/usr/bin/env bash

# GlobalLink 数据库安装脚本 (Without Docker)
# 安装和配置PostgreSQL和Redis

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 检查是否为root用户
if [[ $EUID -eq 0 ]]; then
   log_error "请不要使用root用户运行此脚本"
   exit 1
fi

log "===== GlobalLink 数据库安装开始 ====="

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

# 配置PostgreSQL
log "配置PostgreSQL数据库..."

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

# 创建环境变量文件
log "创建环境变量文件..."
cat > .env << EOF
# 数据库配置
POSTGRES_SERVER=localhost
POSTGRES_USER=globallink
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=globallink
# PostgreSQL超级用户配置
POSTGRES_SUPERUSER=postgres
POSTGRES_SUPERUSER_PASSWORD=$POSTGRES_PASSWORD

# Redis配置
REDIS_URL=redis://localhost:6379/0

# 日志配置 - 使用PostgreSQL存储所有日志数据
LOG_TABLE_NAME=system_logs
ENABLE_API_LOGGING=true
ENABLE_ACTIVITY_LOGGING=true
EOF

echo "环境变量文件已创建: .env"




# 安装Redis
echo "安装Redis..."
sudo apt install -y redis-server

# 配置Redis以允许远程连接
echo "配置Redis..."
sudo sed -i 's/bind 127.0.0.1/bind 0.0.0.0/g' /etc/redis/redis.conf

# 启动Redis服务
 echo "启动Redis服务..."
 sudo service redis-server restart
 sudo update-rc.d redis-server enable

echo "===== GlobalLink数据库安装完成 ====="
echo "PostgreSQL和Redis已安装并配置完成"
echo ""
echo "数据库连接信息:"
echo "  PostgreSQL: localhost:5432/globallink"
echo "  用户名: globallink"
echo "  密码: $DB_PASSWORD"
echo "  Redis: localhost:6379"
echo ""
echo "重要提示:"
echo "1. 数据库密码已保存在 .env 文件中"
echo "2. 所有日志数据现在存储在PostgreSQL中"
echo "3. 请妥善保管数据库密码和postgres超级用户密码"
echo ""
echo "下一步: 运行后端安装脚本"