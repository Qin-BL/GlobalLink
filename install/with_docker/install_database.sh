#!/bin/bash

# GlobalLink 数据库安装脚本 (With Docker)
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
    echo -e "${GREEN}[\$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
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








# 安装Redis
log "安装Redis..."
sudo apt install -y redis-server

# 配置Redis以允许远程连接
log "配置Redis..."
sudo sed -i 's/bind 127.0.0.1/bind 0.0.0.0/g' /etc/redis/redis.conf

# 启动Redis服务
log "启动Redis服务..."
sudo service redis-server restart
sudo update-rc.d redis-server enable

# 更新docker-compose.yml中的数据库配置
echo "更新docker-compose.yml中的数据库配置..."
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
    command: >\n      bash -c "cd /app && \n      apt-get update && \n      apt-get install -y --no-install-recommends build-essential libpq-dev && \n      pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir -r requirements.txt && \n      uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

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

# 备份现有.env文件（如果存在）
if [ -f "$ENV_FILE" ]; then
    log_warning "$ENV_FILE文件已存在，将创建备份并更新数据库配置"
    cp "$ENV_FILE" "$ENV_FILE.bak.$(date +'%Y%m%d%H%M%S')"
    
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

echo "环境变量文件已创建: $ENV_FILE"
fi

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
echo "数据库连接信息:"
echo "  PostgreSQL: localhost:5432/globallink"
echo "  用户名: globallink"
echo "  密码: $DB_PASSWORD"
echo "  postgres超级用户密码: $POSTGRES_PASSWORD"
echo "  Redis: localhost:6379"
echo ""
echo "重要提示:"
echo "1. 数据库密码已保存在 backend/.env 文件中"
echo "2. 请妥善保管数据库密码和postgres超级用户密码"