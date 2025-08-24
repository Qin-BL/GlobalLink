# 密码加密功能自动化部署指南

## 概述

本文档提供GlobalLink项目密码加密传输功能的自动化部署指南，包含完整的HTTPS配置和功能验证。

## 部署前提

### 系统要求
- Ubuntu 20.04 LTS（推荐）
- Git
- Python 3.8+
- Node.js 16+
- Nginx
- OpenSSL

### 权限要求
- sudo权限（用于安装系统包和配置服务）
- 项目目录读写权限

## 自动化部署脚本

### 脚本文件
- `deploy_password_encryption.sh` - 主部署脚本
- `install/without_docker/install_nginx.sh` - Nginx配置脚本（已集成HTTPS）
- `install/with_docker/install_nginx.sh` - Docker环境Nginx配置脚本

### 部署步骤

1. **下载脚本**
   ```bash
   cd /opt
   git clone https://github.com/yourusername/GlobalLink.git
   cd GlobalLink
   ```

2. **赋予执行权限**
   ```bash
   chmod +x deploy_password_encryption.sh
   chmod +x install/without_docker/install_nginx.sh
   chmod +x install/with_docker/install_nginx.sh
   ```

3. **执行部署**
   ```bash
   sudo ./deploy_password_encryption.sh
   ```

## 部署流程详解

### 1. 系统检查
- 验证操作系统版本
- 检查必要命令是否存在（git, python3, pip, node, npm, nginx, openssl）

### 2. 配置备份
- 自动备份现有Nginx配置
- 备份SSL证书文件
- 创建带时间戳的备份目录

### 3. 代码更新
- 拉取最新的Git代码（如果存在Git仓库）
- 确保使用最新版本的密码加密功能

### 4. 依赖安装
- **后端依赖**: 创建Python虚拟环境，安装requirements.txt中的所有依赖，特别确保加密相关依赖（pycryptodome, passlib, bcrypt）
- **前端依赖**: 安装Node.js依赖包

### 5. HTTPS配置
- 自动生成自签名SSL证书（开发环境）
- 配置Nginx HTTPS服务器
- 设置HTTP到HTTPS的重定向
- 配置安全头部（HSTS, X-Frame-Options等）

### 6. 服务管理
- 重启或启动后端服务
- 重启或启动前端服务  
- 重启Nginx服务

### 7. 功能测试
- 自动运行密码加密测试套件
- 验证加密功能正常工作

### 8. 部署验证
- 检查HTTPS访问是否正常
- 验证服务运行状态
- 确认功能完整性

## 手动部署选项

### 非Docker环境
```bash
cd install/without_docker
sudo ./install_nginx.sh
```

### Docker环境
```bash
cd install/with_docker  
sudo ./install_nginx.sh
```

## 功能验证

### 1. HTTPS访问验证
```bash
# 检查HTTPS连接
curl -I https://localhost

# 测试API接口
curl -k https://localhost/api/health
```

### 2. 加密功能验证
```bash
# 运行加密测试
cd test
python test_password_encryption.py
```

### 3. 浏览器验证
1. 打开浏览器访问 `https://localhost`
2. 检查地址栏的锁图标（表示HTTPS连接安全）
3. 进行用户登录测试
4. 使用开发者工具检查网络请求，确认密码字段加密

## 故障排除

### 常见问题

1. **证书错误**
   ```bash
   # 重新生成证书
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/ssl/private/globallink.key \
     -out /etc/ssl/certs/globallink.crt
   ```

2. **Nginx配置错误**
   ```bash
   # 检查配置语法
   sudo nginx -t
   
   # 查看错误日志
   sudo tail -f /var/log/nginx/error.log
   ```

3. **端口冲突**
   ```bash
   # 检查端口占用
   sudo netstat -tlnp | grep :443
   sudo netstat -tlnp | grep :80
   ```

4. **服务启动失败**
   ```bash
   # 检查服务状态
   sudo systemctl status nginx
   sudo systemctl status backend
   sudo systemctl status frontend
   
   # 查看服务日志
   sudo journalctl -u nginx -f
   sudo journalctl -u backend -f
   ```

### 日志文件
- 部署日志: `deploy_password_encryption.log`
- Nginx错误日志: `/var/log/nginx/error.log`
- Nginx访问日志: `/var/log/nginx/access.log`
- 系统服务日志: `journalctl -u service-name`

## 回滚方案

### 自动回滚
部署脚本自动创建备份，位置为: `backup_YYYYMMDD_HHMMSS/`

### 手动回滚
```bash
# 恢复Nginx配置
sudo cp backup_*/globallink /etc/nginx/sites-available/

# 恢复SSL证书
sudo cp backup_*/globallink.crt /etc/ssl/certs/
sudo cp backup_*/globallink.key /etc/ssl/private/

# 重启服务
sudo systemctl restart nginx
```

## 监控和维护

### 服务监控
```bash
# 监控服务状态
sudo systemctl status nginx
sudo systemctl status backend
sudo systemctl status frontend

# 监控资源使用
htop
nginx -T
```

### 证书管理
- 自签名证书有效期为365天
- 生产环境建议使用Let's Encrypt证书
- 设置证书过期提醒

### 安全审计
```bash
# SSL/TLS安全扫描
sslscan localhost
nmap --script ssl-enum-ciphers -p 443 localhost
```

## 生产环境建议

### 证书管理
1. 使用Let's Encrypt免费证书
2. 设置自动续期
3. 监控证书过期时间

### 安全配置
1. 启用HTTP/2
2. 配置安全的SSL协议和加密套件
3. 设置适当的安全头部
4. 启用OCSP装订

### 性能优化
1. 启用SSL会话恢复
2. 配置适当的SSL缓存
3. 使用ECC证书减少计算开销

## 支持信息

### 文档参考
- [SSL配置说明](ssl/README-SSL.md)
- [密码加密功能说明](PASSWORD_ENCRYPTION_README.md)
- [安装指南](README_INSTALL.md)

### 获取帮助
1. 检查部署日志文件
2. 查看系统服务状态
3. 验证网络连接和端口
4. 检查文件权限

## 版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.0.0 | 2024-01-01 | 初始版本，包含完整的HTTPS自动化部署 |
| 1.0.1 | 2024-01-02 | 修复脚本语法错误，优化错误处理 |

## 免责声明

本自动化部署脚本仅用于开发和测试环境。生产环境部署前请进行充分测试，并根据实际环境调整配置。