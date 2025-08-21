#!/usr/bin/env bash

# 前端安装脚本（不使用Docker）
set -e

# 确保使用bash而不是sh
if [ -z "$BASH_VERSION" ]; then
  echo "错误：请使用bash而不是sh运行此脚本"
  exit 1
fi

echo "===== 开始安装GlobalLink前端 ====="

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"

# 输出调试信息
echo "脚本所在目录: $SCRIPT_DIR"
echo "项目根目录: $PROJECT_ROOT"

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 确保工作目录正确
if [ ! -d "frontend" ]; then
  echo "错误：无法找到frontend目录，请确认项目结构是否正确"
  exit 1
fi

# 安装Node.js和npm
echo "安装Node.js和npm..."
sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version

# 安装前端依赖
echo "安装前端依赖..."
cd frontend
npm install

# 修改前端端口配置
echo "修改前端端口为3080..."
sed -i 's/"start": "react-scripts start"/"start": "PORT=3080 react-scripts start"/g' package.json

# 添加启动脚本
echo "创建启动脚本..."
cat > ../start_frontend.sh << EOF
#!/bin/bash
cd "\$(dirname "\$0")/frontend"
npm start
EOF

chmod +x ../start_frontend.sh

# 构建生产版本
echo "构建生产版本..."
npm run build

# 创建前端服务管理脚本
 echo "创建服务管理脚本..."
 # 获取当前用户
 CURRENT_USER=$(whoami)
 cat > ../frontend.service << EOF
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

echo "将服务文件复制到系统目录需要root权限"
echo "请手动执行以下命令安装服务："
echo "sudo cp $PROJECT_ROOT/frontend.service /etc/systemd/system/globallink-frontend.service"
echo "sudo update-rc.d globallink-frontend defaults"
echo "sudo service globallink-frontend start"

cd ..

echo "===== GlobalLink前端安装完成 ====="
echo "您可以通过以下方式启动前端："
echo "1. 开发模式：./start_frontend.sh"
echo "2. 服务模式：sudo systemctl start globallink-frontend"
echo "前端访问地址：http://localhost:3080"