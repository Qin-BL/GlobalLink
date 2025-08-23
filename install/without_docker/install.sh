#!/usr/bin/env bash

# GlobalLink安装主脚本（不使用Docker）
# 此脚本整合了所有安装流程和修复功能，支持断点续装和自动修复
set -e

# 确保使用bash而不是sh
if [ -z "$BASH_VERSION" ]; then
  echo "错误：请使用bash而不是sh运行此脚本"
  exit 1
fi

# 全局变量
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"
LOG_FILE="$PROJECT_ROOT/install.log"
STATUS_FILE="$PROJECT_ROOT/install.status"
CURRENT_USER=$(whoami)

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 记录日志函数
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查状态函数
check_status() {
  local step=$1
  if [ -f "$STATUS_FILE" ] && grep -q "$step=completed" "$STATUS_FILE"; then
    return 0
  else
    return 1
  fi
}

# 设置状态函数
set_status() {
  local step=$1
  local status=$2
  if [ -f "$STATUS_FILE" ]; then
    sed -i "/$step=.*/d" "$STATUS_FILE"
  fi
  echo "$step=$status" >> "$STATUS_FILE"
}

# 错误处理函数
error_handler() {
  local error_msg=$1
  log "错误: $error_msg"
  log "开始自动修复..."
  # 尝试修复
  case $CURRENT_STEP in
    "system_deps")
      log "修复系统依赖..."
      sudo apt update --fix-missing
      ;;
    "database")
      log "修复数据库..."
      sudo service postgresql restart
      ;;
    "backend")
      log "修复后端..."
      # 检查并修复后端依赖
      cd "$PROJECT_ROOT/backend" || exit 1
      if [ -d "venv" ]; then
        source venv/bin/activate
        pip install --upgrade pip
        pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
      fi
      ;;
    "frontend")
      log "修复前端..."
      cd "$PROJECT_ROOT/frontend" || exit 1
      npm install --force
      ;;
    "nginx")
      log "修复Nginx..."
      sudo service nginx restart
      ;;
    "service")
      log "修复服务..."
      # 修复服务路径
      fix_service_paths
      ;;
    *)
      log "无法确定当前步骤，尝试通用修复..."
      ;;
  esac
  log "修复完成，尝试继续安装..."
}

# 修复服务路径函数
fix_service_paths() {
  log "修复服务文件路径..."
  # 修复backend.service
  if [ -f "$PROJECT_ROOT/backend.service" ]; then
    sed -i "s/User=.*/User=$CURRENT_USER/" "$PROJECT_ROOT/backend.service"
    sed -i "s/Group=.*/Group=$CURRENT_USER/" "$PROJECT_ROOT/backend.service"
    sed -i "s|WorkingDirectory=.*|WorkingDirectory=$PROJECT_ROOT/backend|" "$PROJECT_ROOT/backend.service"
    sed -i "s|ExecStart=.*|ExecStart=$PROJECT_ROOT/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000|" "$PROJECT_ROOT/backend.service"
    sed -i "s|Environment=PATH=.*|Environment=\"PATH=$PROJECT_ROOT/backend/venv/bin\"|" "$PROJECT_ROOT/backend.service"
    sed -i "s|EnvironmentFile=.*|EnvironmentFile=$PROJECT_ROOT/.env|" "$PROJECT_ROOT/backend.service"
    log "backend.service修复完成"
  else
    log "警告：backend.service文件不存在，将重新创建"
    create_backend_service
  fi

  # 修复frontend.service
  if [ -f "$PROJECT_ROOT/frontend.service" ]; then
    sed -i "s/User=.*/User=$CURRENT_USER/" "$PROJECT_ROOT/frontend.service"
    sed -i "s/Group=.*/Group=$CURRENT_USER/" "$PROJECT_ROOT/frontend.service"
    sed -i "s|WorkingDirectory=.*|WorkingDirectory=$PROJECT_ROOT/frontend|" "$PROJECT_ROOT/frontend.service"
    log "frontend.service修复完成"
  else
    log "警告：frontend.service文件不存在，将重新创建"
    create_frontend_service
  fi
}

# 创建后端服务文件函数
create_backend_service() {
  log "创建后端服务文件..."
  cat > "$PROJECT_ROOT/backend.service" << EOF
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
Environment=\"PATH=$PROJECT_ROOT/backend/venv/bin\"}
EnvironmentFile=$PROJECT_ROOT/.env

[Install]
WantedBy=multi-user.target
EOF
}

# 创建前端服务文件函数
create_frontend_service() {
  log "创建前端服务文件..."
  cat > "$PROJECT_ROOT/frontend.service" << EOF
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
}

# 安装系统依赖
install_system_deps() {
  CURRENT_STEP="system_deps"
  if check_status "$CURRENT_STEP"; then
    log "系统依赖已安装，跳过"
    return
  fi

  log "===== 安装系统依赖 ====="
  # 检查是否为Ubuntu 20.04
  if [ "$(lsb_release -is)" != "Ubuntu" ] || [ "$(lsb_release -rs)" != "20.04" ]; then
    log "警告：此脚本针对Ubuntu 20.04优化，当前系统为$(lsb_release -ds)"
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi

  # 安装基本依赖
  log "安装基本依赖..."
  sudo apt update
  sudo apt install -y git curl wget

  set_status "$CURRENT_STEP" "completed"
}

# 安装数据库
install_database() {
  CURRENT_STEP="database"
  if check_status "$CURRENT_STEP"; then
    log "数据库已安装，跳过"
    return
  fi

  log "===== 安装数据库 ====="
  # 安装PostgreSQL
  log "安装PostgreSQL..."
  sudo apt install -y postgresql postgresql-contrib

  # 启动PostgreSQL服务
  log "启动PostgreSQL服务..."
  sudo service postgresql start
  sudo update-rc.d postgresql enable

  # 创建数据库和用户
  log "创建数据库和用户..."
  # 检查数据库是否已存在
  DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='globallink'")
  if [ "$DB_EXISTS" = '1' ]; then
    log "数据库 'globallink' 已存在，跳过创建"
    # 获取现有用户密码
    DB_PASSWORD=$(grep 'POSTGRES_PASSWORD=' "$PROJECT_ROOT/.env" 2>/dev/null | cut -d '=' -f 2)
    if [ -z "$DB_PASSWORD" ]; then
      # 如果.env文件中没有密码，生成新密码
      DB_PASSWORD=$(openssl rand -base64 12)
      log "数据库密码: $DB_PASSWORD"
      log "请保存此密码，稍后配置需要使用"
    else
      log "使用现有数据库密码"
    fi
  else
    # 生成随机密码
    DB_PASSWORD=$(openssl rand -base64 12)
    log "数据库密码: $DB_PASSWORD"
    log "请保存此密码，稍后配置需要使用"

    # 创建用户和数据库
    sudo -u postgres psql -c "CREATE USER globallink WITH PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "CREATE DATABASE globallink OWNER globallink;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE globallink TO globallink;"
  fi

  # 安装MongoDB
  log "安装MongoDB..."
  sudo apt install -y gnupg
  wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
  sudo apt update
  sudo apt install -y mongodb-org
  sudo service mongod start
  sudo update-rc.d mongod enable

  # 安装Redis
  log "安装Redis..."
  sudo apt install -y redis-server
  sudo service redis-server start
  sudo update-rc.d redis-server enable

  set_status "$CURRENT_STEP" "completed"
}

# 安装后端
install_backend() {
  CURRENT_STEP="backend"
  if check_status "$CURRENT_STEP"; then
    log "后端已安装，跳过"
    return
  fi

  log "===== 安装后端 ====="
  # 切换到项目根目录
  cd "$PROJECT_ROOT" || {
    log "错误：无法切换到项目根目录 $PROJECT_ROOT"
    exit 1
  }

  # 确保工作目录正确
  if [ ! -d "backend" ]; then
    log "错误：无法找到backend目录，请确认项目结构是否正确"
    exit 1
  fi

  # 安装Python和pip
  log "安装Python和pip..."
  sudo apt install -y python3 python3-pip python3-venv

  # 创建并激活虚拟环境
  log "创建Python虚拟环境..."
  cd backend
  python3 -m venv venv
  source venv/bin/activate

  # 安装后端依赖
  log "安装后端依赖..."
  pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --upgrade pip
  pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

  # 检查项目根目录下的.env文件
  log "检查环境变量文件..."
  if [ -f "$PROJECT_ROOT/.env" ]; then
    log "发现项目根目录下的.env文件，复制到backend目录..."
    cp "$PROJECT_ROOT/.env" .env
  else
    log "未找到项目根目录下的.env文件，创建默认.env文件"
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
    log "警告：请务必修改.env文件中的数据库密码"
  fi

  # 修改后端CORS配置
  log "更新后端CORS配置..."
  sed -i 's/"http:\/\/localhost:3000"/"http:\/\/localhost:3080"/g' app/core/config.py

  # 添加启动脚本
  log "创建启动脚本..."
  cat > ../start_backend.sh << EOF
#!/bin/bash
cd "\$(dirname "\$0")/backend"
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
EOF

  chmod +x ../start_backend.sh

  # 创建后端服务管理脚本
  log "创建服务管理脚本..."
  create_backend_service

  cd ..

  set_status "$CURRENT_STEP" "completed"
}

# 安装前端
install_frontend() {
  CURRENT_STEP="frontend"
  if check_status "$CURRENT_STEP"; then
    log "前端已安装，跳过"
    return
  fi

  log "===== 安装前端 ====="
  # 切换到项目根目录
  cd "$PROJECT_ROOT" || {
    log "错误：无法切换到项目根目录 $PROJECT_ROOT"
    exit 1
  }

  # 确保工作目录正确
  if [ ! -d "frontend" ]; then
    log "错误：无法找到frontend目录，请确认项目结构是否正确"
    exit 1
  fi

  # 安装Node.js和npm
  log "安装Node.js和npm..."
  sudo apt install -y curl
  curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
  sudo apt install -y nodejs

  # 验证安装
  node --version
  npm --version

  # 安装前端依赖
  log "安装前端依赖..."
  cd frontend
  npm install

  # 修改前端端口配置
  log "修改前端端口为3080..."
  sed -i 's/"start": "react-scripts start"/"start": "PORT=3080 react-scripts start"/g' package.json

  # 添加启动脚本
  log "创建启动脚本..."
  cat > ../start_frontend.sh << EOF
#!/bin/bash
cd "\$(dirname "\$0")/frontend"
npm start
EOF

  chmod +x ../start_frontend.sh

  # 构建生产版本
  log "构建生产版本..."
  npm run build

  # 创建前端服务管理脚本
  log "创建服务管理脚本..."
  create_frontend_service

  cd ..

  set_status "$CURRENT_STEP" "completed"
}

# 安装Nginx
install_nginx() {
  CURRENT_STEP="nginx"
  if check_status "$CURRENT_STEP"; then
    log "Nginx已安装，跳过"
    return
  fi

  log "===== 安装Nginx ====="
  # 安装Nginx
  sudo apt install -y nginx

  # 启动Nginx服务
  sudo service nginx start
  sudo update-rc.d nginx enable

  # 配置Nginx代理
  log "配置Nginx代理..."
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo cat > /etc/nginx/sites-available/globallink << EOF
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:3080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /docs {
        proxy_pass http://localhost:8000/docs;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

  sudo ln -s /etc/nginx/sites-available/globallink /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo service nginx reload

  set_status "$CURRENT_STEP" "completed"
}

# 安装服务
install_service() {
  CURRENT_STEP="service"
  if check_status "$CURRENT_STEP"; then
    log "服务已安装，跳过"
    return
  fi

  log "===== 安装服务 ====="
  # 修复服务路径
  fix_service_paths

  # 安装服务
  sudo cp "$PROJECT_ROOT/backend.service" /etc/systemd/system/
  sudo cp "$PROJECT_ROOT/frontend.service" /etc/systemd/system/

  # 重新加载systemd
  sudo systemctl daemon-reload

  # 启用服务
  sudo systemctl enable globallink-backend
  sudo systemctl enable globallink-frontend

  # 启动服务
  log "启动服务..."
  sudo systemctl start globallink-backend
  sudo systemctl start globallink-frontend

  # 检查服务状态
  log "检查服务状态..."
  sleep 5
  sudo systemctl status globallink-backend --no-pager -l
  sudo systemctl status globallink-frontend --no-pager -l

  set_status "$CURRENT_STEP" "completed"
}

# 主程序
main() {
  log "===== 开始安装GlobalLink ====="

  # 检查是否以root用户运行
  if [ "$CURRENT_USER" = "root" ]; then
    log "警告：不建议以root用户直接运行此脚本"
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi

  # 确保状态文件存在
  touch "$STATUS_FILE"

  # 安装系统依赖
  install_system_deps || error_handler "安装系统依赖失败"

  # 安装数据库
  install_database || error_handler "安装数据库失败"

  # 安装后端
  install_backend || error_handler "安装后端失败"

  # 安装前端
  install_frontend || error_handler "安装前端失败"

  # 安装Nginx
  install_nginx || error_handler "安装Nginx失败"

  # 安装服务
  install_service || error_handler "安装服务失败"

  # 安装完成
  log "===== GlobalLink安装完成 ====="
  log "访问地址: http://localhost"
  log "后端API文档: http://localhost/docs"
  log "安装日志已保存至: $LOG_FILE"
  log "请确保已修改.env文件中的数据库密码"
  log "可以使用以下命令启动/停止服务:" 
  log "  sudo systemctl start/stop/restart globallink-backend"
  log "  sudo systemctl start/stop/restart globallink-frontend"
}

# 启动主程序
main