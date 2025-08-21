#!/bin/bash

# Nginx Docker安装脚本
set -e

echo "===== 开始安装Nginx ====="

# 安装Nginx
echo "安装Nginx..."
sudo apt update
sudo apt install -y nginx

# 创建Nginx配置文件
echo "创建Nginx配置文件..."
sudo cat > /etc/nginx/sites-available/globallink << EOF
server {
    listen 80;
    server_name localhost;

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
echo "您可以通过 http://localhost 访问应用"