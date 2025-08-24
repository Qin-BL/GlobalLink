#!/bin/bash

# SSL证书生成脚本
echo "===== 生成SSL证书 ====="

# 创建SSL目录
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

# 生成DH参数（可选，用于更安全的密钥交换）
echo "生成DH参数（这可能需要几分钟）..."
sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

echo "===== SSL证书生成完成 ====="
echo "证书位置: /etc/ssl/certs/globallink.crt"
echo "私钥位置: /etc/ssl/private/globallink.key"
echo ""
echo "下一步："
echo "1. 将nginx-ssl.conf复制到Nginx配置目录"
echo "2. 重启Nginx服务"
echo "3. 访问 https://localhost 测试"

# 测试证书
echo "测试证书信息:"
sudo openssl x509 -in /etc/ssl/certs/globallink.crt -text -noout | grep -E "Subject:|Not Before|Not After"