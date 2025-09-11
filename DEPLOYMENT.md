# GlobalLink 部署指南

本项目提供两种部署方式：传统部署和Docker容器化部署。

## 系统要求

### 传统部署
- Ubuntu 18.04+ 或 CentOS 7+
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+
- MongoDB 4.4+
- Nginx

### Docker部署
- Docker 20.10+
- Docker Compose 2.0+

## 快速部署

### 方式一：Docker部署（推荐）

Docker部署是最简单快捷的方式，适合开发和测试环境。

```bash
# 1. 克隆项目
git clone <repository-url>
cd GlobalLink

# 2. 运行Docker部署脚本
chmod +x install/docker_deploy.sh
./install/docker_deploy.sh
```

部署完成后访问：
- 前端：http://localhost
- 后端API：http://localhost/api
- 管理员账号：admin / admin123

### 方式二：传统部署

传统部署适合生产环境，提供更好的性能和可定制性。

```bash
# 1. 克隆项目
git clone <repository-url>
cd GlobalLink

# 2. 运行传统部署脚本
chmod +x install/one_click_deploy.sh
sudo ./install/one_click_deploy.sh
```

## 数据库迁移

项目已从SQLite迁移到PostgreSQL，提供更好的性能和并发支持。

### 数据库配置

PostgreSQL配置信息：
- 数据库名：globallink
- 用户名：globallink_user
- 密码：globallink_password
- 端口：5432

### 环境变量

主要环境变量配置：

```bash
# 数据库配置
POSTGRES_SERVER=localhost
POSTGRES_USER=globallink_user
POSTGRES_PASSWORD=globallink_password
POSTGRES_DB=globallink
POSTGRES_PORT=5432

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# MongoDB配置
MONGODB_URL=mongodb://localhost:27017/globallink_logs

# JWT配置
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 管理员配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## 服务管理

### Docker方式

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service_name]

# 重启服务
docker-compose restart [service_name]

# 停止所有服务
docker-compose down

# 完全清理（包括数据）
docker-compose down -v --rmi all
```

### 传统方式

```bash
# 后端服务管理
sudo systemctl start globallink-backend.service
sudo systemctl stop globallink-backend.service
sudo systemctl restart globallink-backend.service
sudo systemctl status globallink-backend.service

# 查看日志
sudo journalctl -u globallink-backend.service -f

# Nginx管理
sudo systemctl restart nginx
sudo systemctl status nginx
```

## 数据库管理

### 连接数据库

```bash
# Docker方式
docker-compose exec postgres psql -U globallink_user -d globallink

# 传统方式
sudo -u postgres psql -U globallink_user -d globallink
```

### 备份和恢复

```bash
# 备份数据库
pg_dump -U globallink_user -h localhost globallink > backup.sql

# 恢复数据库
psql -U globallink_user -h localhost globallink < backup.sql
```

## 性能优化

### PostgreSQL优化

编辑 `/etc/postgresql/*/main/postgresql.conf`：

```conf
# 内存设置
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# 连接设置
max_connections = 200

# 日志设置
log_statement = 'all'
log_duration = on
```

### Nginx优化

编辑 `/etc/nginx/nginx.conf`：

```conf
worker_processes auto;
worker_connections 1024;

# 启用gzip压缩
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;

# 缓存设置
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 监控和日志

### 应用日志

- 后端日志：`/var/log/globallink/backend.log`
- Nginx访问日志：`/var/log/nginx/access.log`
- Nginx错误日志：`/var/log/nginx/error.log`

### 数据库日志

- PostgreSQL日志：`/var/log/postgresql/postgresql-*.log`
- Redis日志：`/var/log/redis/redis-server.log`

### 监控指标

建议监控以下指标：
- CPU使用率
- 内存使用率
- 磁盘使用率
- 数据库连接数
- 响应时间
- 错误率

## 安全配置

### 防火墙设置

```bash
# 开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### SSL证书

```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 数据库安全

```bash
# PostgreSQL安全配置
sudo -u postgres psql -c "ALTER USER globallink_user PASSWORD 'new_strong_password';"
```

## 故障排除

### 常见问题

1. **端口占用**
   ```bash
   sudo netstat -tulpn | grep :8000
   sudo kill -9 <PID>
   ```

2. **数据库连接失败**
   ```bash
   # 检查PostgreSQL状态
   sudo systemctl status postgresql
   
   # 检查连接
   pg_isready -U globallink_user -d globallink
   ```

3. **权限问题**
   ```bash
   # 修复文件权限
   sudo chown -R $USER:$USER /opt/globallink
   chmod +x install/*.sh
   ```

### 日志分析

```bash
# 查看错误日志
sudo journalctl -u globallink-backend.service --since "1 hour ago"

# 实时监控日志
tail -f /var/log/nginx/error.log
```

## 更新和维护

### 代码更新

```bash
# 拉取最新代码
git pull origin main

# Docker方式重新部署
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 传统方式重启服务
sudo systemctl restart globallink-backend.service
```

### 数据库迁移

```bash
# 运行数据库迁移
cd /opt/globallink/backend
source venv/bin/activate
python -c "from app.db.init_db import init_db; init_db()"
```

## 联系支持

如果遇到部署问题，请：
1. 检查日志文件
2. 确认系统要求
3. 查看故障排除部分
4. 联系技术支持