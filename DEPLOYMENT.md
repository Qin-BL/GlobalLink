# GlobalLink 部署指南

## 🚀 部署方式选择

### 方式一：Docker部署（推荐）
适合开发和测试环境，简单快捷

### 方式二：传统部署
适合生产环境，性能更好，可定制性更强

## 📋 系统要求

### 通用要求
- Linux服务器 (Ubuntu 18.04+ 或 CentOS 7+)
- Git
- 至少2GB内存
- 至少10GB磁盘空间

### Docker部署要求
- Docker 20.10+
- Docker Compose 2.0+

### 传统部署要求
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+

- Nginx

## 🐳 Docker部署

### 快速部署
```bash
# 克隆项目
git clone <your-repo-url>
cd GlobalLink

# 运行Docker部署脚本
chmod +x install/docker_deploy.sh
./install/docker_deploy.sh
```

### 手动Docker部署
```bash
# 构建和启动服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### Docker服务管理
```bash
# 重启特定服务
docker-compose restart backend

# 查看后端日志
docker-compose logs backend

# 进入容器
docker-compose exec backend bash

# 数据库管理
docker-compose exec postgres psql -U globallink_user -d globallink
```

## 🖥️ 传统部署

### 一键部署
```bash
# 克隆项目
git clone <your-repo-url>
cd GlobalLink

# 运行一键部署脚本
chmod +x install/one_click_deploy.sh
sudo ./install/one_click_deploy.sh
```

### 分步部署

#### 1. 系统准备
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv nodejs npm nginx postgresql redis-server

# CentOS/RHEL
sudo yum install python3 python3-pip nodejs npm nginx postgresql redis
```

#### 2. 数据库设置
```bash
# 创建数据库用户
sudo -u postgres createuser globallink_user
sudo -u postgres psql -c "ALTER USER globallink_user PASSWORD 'globallink_password';"

# 创建数据库
sudo -u postgres createdb globallink -O globallink_user
```

#### 3. 后端部署
```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install --upgrade pip
pip install -r requirements.txt

# 启动服务
python main.py
```

#### 4. 前端部署
```bash
cd frontend

# 安装依赖
npm install

# 构建生产版本
npm run build

# 启动开发服务器
npm start
```

#### 5. Nginx配置
创建 `/etc/nginx/sites-available/globallink`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /path/to/GlobalLink/frontend/build/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置:
```bash
sudo ln -s /etc/nginx/sites-available/globallink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## ⚙️ 环境配置

### 环境变量文件 (.env)
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
REDIS_PASSWORD=

# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/globallink_logs

# JWT配置
SECRET_KEY=your-secure-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256

# 管理员配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# 邮件配置（可选）
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com

# 微信支付配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_MCH_ID=your_wechat_mch_id
WECHAT_API_KEY=your_wechat_api_key
```

## 🔧 服务管理

### Systemd服务配置
创建 `/etc/systemd/system/globallink.service`:
```ini
[Unit]
Description=GlobalLink Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/globallink/backend
Environment=PYTHONPATH=/opt/globallink/backend
EnvironmentFile=/opt/globallink/backend/.env
ExecStart=/opt/globallink/backend/venv/bin/python main.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

启用服务:
```bash
sudo systemctl daemon-reload
sudo systemctl enable globallink
sudo systemctl start globallink
sudo systemctl status globallink
```

### PM2管理（可选）
```bash
npm install -g pm2

# 启动服务
pm2 start main.py --name globallink --interpreter python3

# 监控服务
pm2 monit

# 日志查看
pm2 logs globallink

# 重启服务
pm2 restart globallink
```

## 🔒 安全配置

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
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

### 数据库安全
```bash
# 修改默认密码
sudo -u postgres psql -c "ALTER USER globallink_user PASSWORD 'new-strong-password';"

# 限制连接
# 编辑 /etc/postgresql/*/main/pg_hba.conf
```

## 📊 性能优化

### PostgreSQL优化
编辑 `/etc/postgresql/*/main/postgresql.conf`:
```conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 200
```

### Nginx优化
编辑 `/etc/nginx/nginx.conf`:
```conf
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;

gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;
```

### 后端优化
在 `backend/app/core/config.py` 中调整:
```python
# 数据库连接池
DB_POOL_SIZE: int = 20
DB_MAX_OVERFLOW: int = 10
DB_POOL_TIMEOUT: int = 30

# Worker进程数
UVICORN_WORKERS: int = 4
```

## 🐛 故障排除

### 常见问题

#### 1. 端口被占用
```bash
sudo netstat -tulpn | grep :8000
sudo kill -9 <PID>
```

#### 2. 数据库连接失败
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 测试连接
pg_isready -h localhost -p 5432 -U globallink_user -d globallink
```

#### 3. 权限问题
```bash
# 修复文件权限
sudo chown -R www-data:www-data /opt/globallink
sudo chmod -R 755 /opt/globallink

# 给予脚本执行权限
chmod +x install/*.sh
```

#### 4. 依赖问题
```bash
# 重新安装依赖
cd backend
source venv/bin/activate
pip install --upgrade -r requirements.txt

cd ../frontend
npm install
```

### 日志查看

#### 应用日志
```bash
# 后端日志
tail -f /var/log/globallink/backend.log
sudo journalctl -u globallink -f

# 前端日志
cd frontend && npm run dev 2>&1 | tee frontend.log

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 数据库日志
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### Docker日志
```bash
docker-compose logs -f
docker logs <container_name>
```

### 健康检查

#### API健康检查
```bash
curl http://localhost:8000/api/health
```

#### 数据库健康检查
```bash
pg_isready -h localhost -p 5432 -U globallink_user -d globallink
```

#### Redis健康检查
```bash
redis-cli ping
```

## 🔄 更新和维护

### 代码更新
```bash
# 拉取最新代码
git pull origin main

# Docker方式更新
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 传统方式更新
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart globallink

cd ../frontend
npm install
npm run build
```

### 数据库备份
```bash
# 备份数据库
pg_dump -U globallink_user -h localhost globallink > backup_$(date +%Y%m%d).sql

# 恢复数据库
psql -U globallink_user -h localhost globallink < backup.sql
```

### 监控指标
建议监控以下指标：
- CPU使用率
- 内存使用率
- 磁盘使用率
- 数据库连接数
- API响应时间
- 错误率

## 📞 技术支持

如果遇到问题，请按以下步骤排查：

1. **检查日志**: 查看相关日志文件
2. **验证配置**: 确认环境变量和配置文件正确
3. **测试连接**: 验证数据库和服务连接
4. **查阅文档**: 查看本指南的相关章节
5. **联系支持**: 提供详细的错误信息和日志

### 支持信息
- **项目仓库**: [GitHub Repository]
- **问题跟踪**: [Issue Tracker]
- **文档网站**: [Documentation Site]
- **支持邮箱**: support@globallink.com

---

**维护者**: GlobalLink 开发团队  
**最后更新**: 2025-01-10