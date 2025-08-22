#!/bin/bash

# 修复服务文件路径脚本
set -e

# 获取当前用户
CURRENT_USER=$(whoami)
# 获取项目根目录
PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)

echo "===== 修复GlobalLink服务文件路径 ====="
 echo "当前用户: $CURRENT_USER"
 echo "项目根目录: $PROJECT_ROOT"

# 修复backend.service
if [ -f "$PROJECT_ROOT/backend.service" ]; then
    echo "修复backend.service..."
    sed -i "s/User=.*/User=$CURRENT_USER/" "$PROJECT_ROOT/backend.service"
    sed -i "s/Group=.*/Group=$CURRENT_USER/" "$PROJECT_ROOT/backend.service"
    sed -i "s|WorkingDirectory=.*|WorkingDirectory=$PROJECT_ROOT/backend|" "$PROJECT_ROOT/backend.service"
    sed -i "s|ExecStart=.*|ExecStart=$PROJECT_ROOT/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000|" "$PROJECT_ROOT/backend.service"
    sed -i "s|Environment=PATH=.*|Environment=\"PATH=$PROJECT_ROOT/backend/venv/bin\"|" "$PROJECT_ROOT/backend.service"
    sed -i "s|EnvironmentFile=.*|EnvironmentFile=$PROJECT_ROOT/.env|" "$PROJECT_ROOT/backend.service"
    echo "backend.service修复完成"
else
    echo "错误：backend.service文件不存在"
    exit 1
fi

# 修复frontend.service
if [ -f "$PROJECT_ROOT/frontend.service" ]; then
    echo "修复frontend.service..."
    sed -i "s/User=.*/User=$CURRENT_USER/" "$PROJECT_ROOT/frontend.service"
    sed -i "s/Group=.*/Group=$CURRENT_USER/" "$PROJECT_ROOT/frontend.service"
    sed -i "s|WorkingDirectory=.*|WorkingDirectory=$PROJECT_ROOT/frontend|" "$PROJECT_ROOT/frontend.service"
    echo "frontend.service修复完成"
else
    echo "错误：frontend.service文件不存在"
    exit 1
fi

echo "===== 服务文件路径修复完成 ====="
echo "请重新运行install_service_ubuntu20.sh脚本来安装服务"