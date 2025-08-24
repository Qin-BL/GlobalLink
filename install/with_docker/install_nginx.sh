#!/bin/bash

# Nginx Docker安装脚本
set -e

echo "===== 开始安装Nginx ====="

# 安装Nginx
echo "安装Nginx..."
sudo apt update
sudo apt install -y nginx openssl

# 生成SSL证书
echo "生成SSL证书..."
sudo mkdir -p /etc/ssl/certs
sudo mkdir -p /etc/ssl/private

# 生成私钥
echo "生成RSA私钥..."
sudo openssl genrsa -out /etc/ssl/private/globallink.key 2048

# 生成证书签名请求
echo "生成证书签名请求..."
sudo openssl req -new -key /etc/ssl/private/globallink.key -out /etc/ssl/certs/globallink.csr -subj "/C=CN/ST=Beijing/L=Beijing/O=GlobalLink/OU=IT/CN=localhost"

# 生成自签名证书
echo "生成自签名证书..."
sudo openssl x509 -req -days 365 -in /etc/ssl/certs/globallink.csr -signkey /etc/ssl/private/globallink.key -out /etc/ssl/certs/globallink.crt

# 设置权限
echo "设置文件权限..."
sudo chmod 644 /etc/ssl/certs/globallink.crt
sudo chmod 600 /etc/ssl/private/globallink.key

# 创建Nginx配置文件（包含HTTPS）
echo "创建Nginx配置文件..."
sudo cat > /etc/nginx/sites-available/globallink << EOF
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
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API请求代理
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host \$host;
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

# 启用站点配置
echo "启用Nginx站点配置..."
sudo ln -sf /etc/nginx/sites-available/globallink /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
echo "测试Nginx配置..."
sudo nginx -t

# 重启Nginx服务
echo "重启Nginx服务..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "===== Nginx安装完成 ====="
echo "Nginx已配置为反向代理GlobalLink应用"
echo "您可以通过 https://localhost 访问应用（HTTPS）"
echo "HTTP请求将自动重定向到HTTPS"