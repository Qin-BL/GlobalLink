#!/bin/bash

# 修复服务安装脚本
set -e

# 获取当前用户和路径
CURRENT_USER=$(whoami)
PROJECT_ROOT=$(pwd)

echo "===== 修复GlobalLink服务 ====="
echo "当前用户: $CURRENT_USER"
echo "项目路径: $PROJECT_ROOT"

# 检查服务文件是否存在
if [ ! -f "backend.service" ]; then
    echo "创建backend.service..."
    cat > backend.service << EOF
[Unit]
Description=GlobalLink Backend Service
After=network.target postgresql.service mongodb.service redis-server.service

[Service]
Type=simple
User=$CURRENT_USER
Group=$CURRENT_USER
WorkingDirectory=$PROJECT_ROOT/backend
ExecStart=$PROJECT_ROOT/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=on-failure
Environment="PATH=$PROJECT_ROOT/backend/venv/bin"
EnvironmentFile=$PROJECT_ROOT/.env

[Install]
WantedBy=multi-user.target
EOF
fi

if [ ! -f "frontend.service" ]; then
    echo "创建frontend.service..."
    cat > frontend.service << EOF
[Unit]
Description=GlobalLink Frontend Service
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
Group=$CURRENT_USER
WorkingDirectory=$PROJECT_ROOT/frontend
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=PORT=3080
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
fi

# 安装服务
echo "安装服务..."
sudo cp backend.service /etc/systemd/system/globallink-backend.service
sudo cp frontend.service /etc/systemd/system/globallink-frontend.service

sudo systemctl daemon-reload
sudo systemctl enable globallink-backend
sudo systemctl enable globallink-frontend

echo "启动服务..."
sudo systemctl start globallink-backend
sudo systemctl start globallink-frontend

echo "等待服务启动..."
sleep 3

echo "===== 服务修复完成 ====="
echo ""
echo "服务状态："
sudo systemctl status globallink-backend --no-pager -l
sudo systemctl status globallink-frontend --no-pager -l

echo ""
echo "如果服务启动失败，请检查："
echo "1. 数据库是否已启动：sudo systemctl status postgresql"
echo "2. 检查日志：sudo journalctl -u globallink-backend -f"
echo "3. 手动启动测试：cd backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000"