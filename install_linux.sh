#!/bin/bash

# GlobalLink项目安装脚本 (Linux)

# 确保以root用户运行
if [ "$EUID" -ne 0 ]
  then echo "请以root用户运行此脚本"
  exit
fi

# 更新系统包
apt update && apt upgrade -y

# 安装必要依赖
apt install -y python3 python3-pip python3-venv nodejs npm git postgresql postgresql-contrib

# 配置PostgreSQL数据库
sudo -u postgres psql -c "CREATE DATABASE globallink;"
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'password';"
sudo -u postgres psql -c "ALTER ROLE postgres SUPERUSER;"

echo "数据库配置完成"

# 克隆项目代码 (假设从GitHub克隆，实际使用时请替换为真实仓库URL)
# git clone https://github.com/yourusername/globallink.git
# cd globallink

# 进入后端目录并创建虚拟环境
cd backend
python3 -m venv venv
source venv/bin/activate

# 安装后端依赖
pip install -r requirements.txt

# 创建.env文件
cp .env.example .env

echo "后端依赖安装完成"

deactivate

# 进入前端目录并安装依赖
cd ../frontend
npm install

echo "前端依赖安装完成"

# 创建启动脚本
cat > start.sh << EOF
#!/bin/bash

# 启动后端
cd backend
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
echo "后端服务已启动，日志输出到backend.log"

deactivate

# 启动前端
cd ../frontend
nohup npm start > frontend.log 2>&1 &
echo "前端服务已启动，日志输出到frontend.log"

echo "项目启动完成！请访问 http://localhost:3000"
EOF

chmod +x start.sh

echo "安装完成！运行 ./start.sh 启动项目"