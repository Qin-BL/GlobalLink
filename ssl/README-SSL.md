# SSL/TLS 配置说明

## 概述

本文档说明如何在 GlobalLink 项目中配置 HTTPS 安全传输，确保用户密码和其他敏感数据在传输过程中加密。

## 当前安全状况

### ✅ 已实现的安全特性
- 后端密码使用 bcrypt 哈希存储
- 密码验证使用 passlib 安全验证
- 包含必要的加密依赖包

### ⚠️ 需要改进的方面
- 当前使用 HTTP 协议传输数据
- 密码明文传输存在安全风险
- 缺乏传输层加密

## 配置步骤

### 1. 生成 SSL 证书

#### 使用自签名证书（开发环境）
```bash
# 进入 ssl 目录
cd ssl

# 赋予脚本执行权限
chmod +x generate-certs.sh

# 执行证书生成脚本（需要管理员权限）
sudo ./generate-certs.sh
```

#### 使用 Let's Encrypt（生产环境）
```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 设置自动续期
sudo certbot renew --dry-run
```

### 2. 配置 Nginx

#### 开发环境配置
1. 复制 SSL 配置到 Nginx：
   ```bash
   sudo cp nginx-ssl.conf /etc/nginx/sites-available/globallink-ssl
   sudo ln -s /etc/nginx/sites-available/globallink-ssl /etc/nginx/sites-enabled/
   ```

2. 测试配置：
   ```bash
   sudo nginx -t
   ```

3. 重启 Nginx：
   ```bash
   sudo systemctl restart nginx
   ```

#### 生产环境配置
生产环境建议使用专业的 SSL 证书，如：
- Let's Encrypt（免费）
- DigiCert
- GlobalSign
- Comodo

### 3. 验证配置

访问以下地址验证 HTTPS 是否正常工作：
- https://localhost（开发环境）
- https://yourdomain.com（生产环境）

使用浏览器检查证书信息，确保连接是安全的。

## 安全最佳实践

### 传输安全
1. **强制 HTTPS**：所有 HTTP 请求重定向到 HTTPS
2. **HSTS**：启用 HTTP Strict Transport Security
3. **安全头部**：配置适当的安全响应头

### 证书管理
1. **定期更新**：证书到期前及时续期
2. **密钥安全**：私钥文件权限设置为 600
3. **证书轮换**：定期更换证书增强安全性

### 前端安全
1. **混合内容保护**：确保所有资源都通过 HTTPS 加载
2. **安全 Cookie**：设置 Secure 和 HttpOnly 标志
3. **CSP**：实施内容安全策略

## 故障排除

### 常见问题

1. **证书不受信任**
   - 开发环境：在浏览器中添加自签名证书到信任库
   - 生产环境：确保证书链完整

2. **HTTPS 无法访问**
   - 检查防火墙设置（端口 443）
   - 验证 Nginx 配置语法

3. **混合内容警告**
   - 确保所有资源（CSS、JS、图片）都使用 HTTPS

### 日志检查
```bash
# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/access.log
```

## 性能优化

1. **会话恢复**：启用 SSL session resumption
2. **OCSP 装订**：减少证书验证延迟
3. **HTTP/2**：启用 HTTP/2 协议提升性能
4. **证书优化**：使用 ECC 证书减少计算开销

## 监控和维护

1. **证书过期监控**：设置证书到期提醒
2. **安全扫描**：定期进行 SSL/TLS 安全扫描
3. **协议更新**：及时更新到最新的安全协议

## 参考资料

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Termination](https://nginx.org/en/docs/http/configuring_https_servers.html)

## 支持

如遇到配置问题，请检查：
1. 证书文件路径和权限
2. Nginx 配置语法
3. 防火墙端口设置
4. 域名解析配置