#!/bin/bash

# 数据库Docker安装脚本
set -e

echo "===== 开始安装GlobalLink数据库 ====="

# 安装PostgreSQL
echo "安装PostgreSQL..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 启动PostgreSQL服务
echo "启动PostgreSQL服务..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
echo "创建数据库和用户..."
# 生成随机密码
DB_PASSWORD=$(openssl rand -base64 32)
# 生成postgres用户的随机密码
POSTGRES_PASSWORD=$(openssl rand -base64 32)

sudo -u postgres psql -c "ALTER USER postgres WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE globallink;"
sudo -u postgres psql -c "CREATE USER globallink WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE globallink TO globallink;"








# 安装Redis
echo "安装Redis..."
sudo apt install -y redis-server

# 配置Redis以允许远程连接
echo "配置Redis..."
sudo sed -i 's/bind 127.0.0.1/bind 0.0.0.0/g' /etc/redis/redis.conf

# 启动Redis服务
echo "启动Redis服务..."
sudo systemctl restart redis-server
sudo systemctl enable redis-server

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

# 更新后端环境变量文件
echo "更新后端环境变量文件..."
cat > backend/.env << EOF
POSTGRES_SERVER=localhost
POSTGRES_USER=globallink
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=globallink
# PostgreSQL超级用户配置
POSTGRES_SUPERUSER=postgres
POSTGRES_SUPERUSER_PASSWORD=$POSTGRES_PASSWORD

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
EOF

echo "===== GlobalLink数据库安装完成 ====="
echo "PostgreSQL和Redis已安装并配置完成"
echo ""
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