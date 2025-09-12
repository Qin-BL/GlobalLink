#!/bin/bash

# GlobalLink Nginx安装脚本 (With Docker)
# 安装和配置Nginx作为反向代理

set -e

# 确保使用bash而不是sh
if [ -z "$BASH_VERSION" ]; then
  echo "错误：请使用bash而不是sh运行此脚本"
  exit 1
fi

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

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    elif type lsb_release >/dev/null 2>&1; then
        OS=$(lsb_release -si)
        VER=$(lsb_release -sr)
    elif [ -f /etc/redhat-release ]; then
        OS="Red Hat Enterprise Linux"
        VER=$(cat /etc/redhat-release | sed 's/.*release \([0-9.]*\).*/\1/')
    else
        OS=$(uname -s)
        VER=$(uname -r)
    fi
    log "检测到操作系统: $OS $VER"
}

# 错误处理函数
handle_error() {
    log_error "安装过程中出现问题，请检查上面的错误信息"
    log_error "如果是网络问题，请稍后重试"
    log_error "如果是权限问题，请确保有sudo权限"
    exit 1
}

# 设置错误处理
trap 'handle_error' ERR

detect_os

log "===== GlobalLink Nginx安装开始 ====="

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 安装Nginx
log "安装Nginx..."
sudo apt update
sudo apt install -y nginx openssl

# 生成SSL证书
log "生成SSL证书..."
sudo mkdir -p /etc/ssl/certs
sudo mkdir -p /etc/ssl/private

# 生成私钥
log "生成RSA私钥..."
sudo openssl genrsa -out /etc/ssl/private/globallink.key 2048

# 生成证书签名请求
log "生成证书签名请求..."
sudo openssl req -new -key /etc/ssl/private/globallink.key -out /etc/ssl/certs/globallink.csr -subj "/C=CN/ST=Beijing/L=Beijing/O=GlobalLink/OU=IT/CN=localhost"

# 生成自签名证书
log "生成自签名证书..."
sudo openssl x509 -req -days 365 -in /etc/ssl/certs/globallink.csr -signkey /etc/ssl/private/globallink.key -out /etc/ssl/certs/globallink.crt

# 设置权限
log "设置文件权限..."
sudo chmod 644 /etc/ssl/certs/globallink.crt
sudo chmod 600 /etc/ssl/private/globallink.key

# 创建Nginx配置文件（包含HTTPS）
log "创建Nginx配置文件..."
cat > globallink.conf << EOF
# HTTP重定向到HTTPS
server {
    listen 80;
    server_name localhost;
    
    # HTTP重定向到HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS服务器配置
server {
    listen 443 ssl http2;
    server_name localhost;

    # SSL证书配置
    ssl_certificate /etc/ssl/certs/globallink.crt;
    ssl_certificate_key /etc/ssl/private/globallink.key;
    
    # SSL协议配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    
    # SSL会话配置
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # 安全头部
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # 前端静态文件
    location / {
        proxy_pass http://localhost:3080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API文档
    location /docs {
        proxy_pass http://localhost:8000/docs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # OpenAPI JSON
    location /openapi.json {
        proxy_pass http://localhost:8000/openapi.json;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 错误页面
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# 复制配置文件到Nginx目录
log "复制配置文件到Nginx目录..."
sudo cp globallink.conf /etc/nginx/sites-available/

# 启用站点配置
log "启用站点配置..."
sudo ln -sf /etc/nginx/sites-available/globallink.conf /etc/nginx/sites-enabled/

# 移除默认配置
log "移除默认配置..."
sudo rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
log "测试Nginx配置..."
sudo nginx -t

# 重启Nginx服务
log "重启Nginx服务..."
sudo systemctl restart nginx
sudo systemctl enable nginx

log "===== GlobalLink Nginx安装完成 ====="
log "Nginx已配置为反向代理，将请求转发到前端和后端服务"
log "您可以通过 https://localhost 访问GlobalLink应用（HTTPS）"
log "HTTP请求将自动重定向到HTTPS"
log "提示：Nginx已配置支持Websocket协议和完整的API路径代理"