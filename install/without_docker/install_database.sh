#!/usr/bin/env bash

# 数据库安装脚本（不使用Docker）
set -e

# 确保使用bash而不是sh
if [ -z "$BASH_VERSION" ]; then
  echo "错误：请使用bash而不是sh运行此脚本"
  exit 1
fi

# 检查是否有权限运行sudo
if ! sudo -v >/dev/null 2>&1; then
  echo "错误：需要sudo权限运行此脚本"
  exit 1
fi

echo "===== 开始安装GlobalLink数据库 ====="

# 安装PostgreSQL
echo "安装PostgreSQL..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 启动PostgreSQL服务
 echo "启动PostgreSQL服务..."
 sudo service postgresql start
 sudo update-rc.d postgresql enable

# 创建数据库和用户
 echo "创建数据库和用户..."

 # 检查数据库是否已存在
 DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='globallink'")
 if [ "$DB_EXISTS" = '1' ]; then
   echo "数据库 'globallink' 已存在，跳过创建"
   # 获取现有用户密码
   DB_PASSWORD=$(grep 'POSTGRES_PASSWORD=' .env 2>/dev/null | cut -d '=' -f 2)
   if [ -z "$DB_PASSWORD" ]; then
     # 如果.env文件中没有密码，生成新密码
     DB_PASSWORD=$(openssl rand -base64 12)
     echo "数据库密码: $DB_PASSWORD"
     echo "请保存此密码，稍后配置需要使用"
   else
     echo "使用现有数据库密码"
   fi
 else
   # 生成随机密码
   DB_PASSWORD=$(openssl rand -base64 12)
   echo "数据库密码: $DB_PASSWORD"
   echo "请保存此密码，稍后配置需要使用"

   sudo -u postgres psql -c "CREATE DATABASE globallink;"
 fi

 # 检查用户是否已存在
 USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='globallink'")
 if [ "$USER_EXISTS" = '1' ]; then
   echo "用户 'globallink' 已存在，更新密码"
   sudo -u postgres psql -c "ALTER USER globallink WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
 else
   echo "创建用户 'globallink'"
   sudo -u postgres psql -c "CREATE USER globallink WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
 fi

 # 确保用户有数据库权限
 sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE globallink TO globallink;"

 # 创建环境变量文件
 echo "创建环境变量文件..."
 cat > .env << EOF
# 数据库配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=globallink
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=globallink

MONGODB_URI=mongodb://localhost:27017/
REDIS_URL=redis://localhost:6379/0
EOF

echo "环境变量文件已创建: .env"

# 安装MongoDB
echo "安装MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org

# 启动MongoDB服务
 echo "启动MongoDB服务..."

 # 尝试启动MongoDB服务
 if sudo service mongod start; then
   echo "MongoDB服务启动成功"
 else
   echo "尝试使用systemctl启动MongoDB服务..."
   sudo systemctl start mongod
 fi

 # 尝试配置MongoDB服务开机自启
 if sudo update-rc.d mongod enable 2>/dev/null; then
   echo "MongoDB服务已设置为开机自启"
 else
   echo "尝试使用systemctl配置MongoDB服务开机自启..."
   sudo systemctl enable mongod
 fi

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
echo "PostgreSQL、MongoDB和Redis已安装并配置完成"