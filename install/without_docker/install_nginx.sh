#!/bin/bash

# Nginx安装脚本（不使用Docker）
set -e

echo "===== 开始安装Nginx ====="

# 安装Nginx
echo "安装Nginx..."
sudo apt update
sudo apt install -y nginx

# 启动Nginx服务
echo "启动Nginx服务..."
sudo systemctl start nginx
sudo systemctl enable nginx

# 创建Nginx配置文件
echo "创建Nginx配置文件..."
cat > globallink.conf << EOF
server {
    listen 80;
    server_name localhost;

    # 前端静态文件
    location / {
        proxy_pass http://localhost:3080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # API文档
    location /docs {
        proxy_pass http://localhost:8000/docs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # OpenAPI JSON
    location /openapi.json {
        proxy_pass http://localhost:8000/openapi.json;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 复制配置文件到Nginx目录
echo "复制配置文件到Nginx目录..."
sudo cp globallink.conf /etc/nginx/sites-available/

# 启用站点配置
echo "启用站点配置..."
sudo ln -sf /etc/nginx/sites-available/globallink.conf /etc/nginx/sites-enabled/

# 移除默认配置
echo "移除默认配置..."
sudo rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
echo "测试Nginx配置..."
sudo nginx -t

# 重启Nginx服务
echo "重启Nginx服务..."
sudo systemctl restart nginx

echo "===== Nginx安装完成 ====="
echo "Nginx已配置为反向代理，将请求转发到前端和后端服务"
echo "您可以通过 http://localhost 访问GlobalLink应用"