#!/bin/bash

# 后端安装脚本（不使用Docker）
set -e

echo "===== 开始安装GlobalLink后端 ====="

# 确保工作目录正确
if [ ! -d "backend" ]; then
  echo "错误：请在项目根目录下运行此脚本"
  exit 1
fi

# 安装Python和pip
echo "安装Python和pip..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv

# 创建并激活虚拟环境
echo "创建Python虚拟环境..."
cd backend
python3 -m venv venv
source venv/bin/activate

# 安装后端依赖
echo "安装后端依赖..."
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --upgrade pip
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# 创建环境变量文件
echo "创建环境变量文件..."
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "已从.env.example创建.env文件，请根据需要修改配置"
  else
    echo "警告：未找到.env.example文件，创建默认.env文件"
    cat > .env << EOF
POSTGRES_SERVER=localhost
POSTGRES_USER=globallink
POSTGRES_PASSWORD=password
POSTGRES_DB=globallink
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=globallink
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
EOF
  fi
fi

# 修改后端CORS配置
echo "更新后端CORS配置..."
sed -i 's/"http:\/\/localhost:3000"/"http:\/\/localhost:3080"/g' app/core/config.py

# 添加启动脚本
echo "创建启动脚本..."
cat > ../start_backend.sh << EOF
#!/bin/bash
cd "\$(dirname "\$0")/backend"
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
EOF

chmod +x ../start_backend.sh

# 创建后端服务管理脚本
echo "创建服务管理脚本..."
cat > ../backend.service << EOF
[Unit]
Description=GlobalLink Backend Service
After=network.target postgresql.service mongodb.service redis-server.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=on-failure
Environment="PATH=$(pwd)/venv/bin"

[Install]
WantedBy=multi-user.target
EOF

echo "将服务文件复制到系统目录需要root权限"
echo "请手动执行以下命令安装服务："
echo "sudo cp $(pwd)/../backend.service /etc/systemd/system/globallink-backend.service"
echo "sudo systemctl daemon-reload"
echo "sudo systemctl enable globallink-backend"
echo "sudo systemctl start globallink-backend"

cd ..

echo "===== GlobalLink后端安装完成 ====="
echo "您可以通过以下方式启动后端："
echo "1. 开发模式：./start_backend.sh"
echo "2. 服务模式：sudo systemctl start globallink-backend"
echo "API文档地址：http://localhost:8000/docs"