#!/bin/bash

# 数据库安装脚本（不使用Docker）
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
 # 检查数据库是否存在，不存在则创建
 sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = 'globallink'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE globallink;"
 # 检查用户是否存在，不存在则创建
 sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname = 'globallink'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER globallink WITH ENCRYPTED PASSWORD 'password';"
 sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE globallink TO globallink;"

# 安装MongoDB
echo "安装MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org

# 启动MongoDB服务
echo "启动MongoDB服务..."
sudo systemctl start mongod
sudo systemctl enable mongod

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

echo "===== GlobalLink数据库安装完成 ====="
echo "PostgreSQL、MongoDB和Redis已安装并配置完成"