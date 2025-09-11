# GlobalLink Linux 服务器部署指南

## 🚀 快速部署

### 1. 环境准备

确保Linux服务器上已安装：
- Python 3.8+
- pip
- git

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv git

# CentOS/RHEL
sudo yum install python3 python3-pip git
```

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd GlobalLink
```

### 3. 创建虚拟环境

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或者在Windows上: venv\Scripts\activate
```

### 4. 安装依赖

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 5. 启动服务器

```bash
# 方法1: 使用启动脚本（推荐）
python start_server.py

# 方法2: 直接使用uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000

# 方法3: 后台运行
nohup python start_server.py > server.log 2>&1 &
```

## 🔧 配置说明

### 环境变量配置

创建 `.env` 文件：

```bash
# 数据库配置
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=globallink

# 管理员配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# 邮件配置
MAIL_SERVER=smtp.your-domain.com
MAIL_PORT=587
MAIL_USERNAME=your_email@domain.com
MAIL_PASSWORD=your_email_password
MAIL_FROM=your_email@domain.com

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MongoDB配置（可选）
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=globallink
```

### 数据库初始化

```bash
# 如果使用PostgreSQL
sudo -u postgres createdb globallink

# 如果使用SQLite（默认）
# 数据库文件会自动创建在 globallink.db
```

## 🌐 访问地址

启动成功后，可以通过以下地址访问：

- **主应用**: http://your-server-ip:8000
- **API文档**: http://your-server-ip:8000/docs
- **管理后台**: http://your-server-ip:8000/admin/login

## 🔒 安全配置

### 1. 防火墙设置

```bash
# Ubuntu/Debian
sudo ufw allow 8000
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

### 2. 使用Nginx反向代理（推荐）

安装Nginx：
```bash
sudo apt install nginx  # Ubuntu/Debian
sudo yum install nginx  # CentOS/RHEL
```

创建Nginx配置文件 `/etc/nginx/sites-available/globallink`：

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

    # 静态文件
    location /static/ {
        alias /path/to/GlobalLink/frontend/build/static/;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/globallink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. SSL证书（推荐）

使用Let's Encrypt：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📊 进程管理

### 使用systemd管理服务

创建服务文件 `/etc/systemd/system/globallink.service`：

```ini
[Unit]
Description=GlobalLink FastAPI Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/GlobalLink/backend
Environment=PATH=/path/to/GlobalLink/backend/venv/bin
ExecStart=/path/to/GlobalLink/backend/venv/bin/python start_server.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

启用服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable globallink
sudo systemctl start globallink
sudo systemctl status globallink
```

### 使用PM2管理（Node.js环境）

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start start_server.py --name globallink --interpreter python3

# 查看状态
pm2 status

# 查看日志
pm2 logs globallink

# 重启应用
pm2 restart globallink
```

## 🐛 故障排除

### 常见问题

1. **导入错误**
   ```bash
   # 确保Python路径正确
   export PYTHONPATH=/path/to/GlobalLink/backend:$PYTHONPATH
   ```

2. **端口被占用**
   ```bash
   # 查看端口占用
   sudo netstat -tlnp | grep :8000
   
   # 杀死进程
   sudo kill -9 <PID>
   ```

3. **权限问题**
   ```bash
   # 给予执行权限
   chmod +x start_server.py
   
   # 修改文件所有者
   sudo chown -R www-data:www-data /path/to/GlobalLink
   ```

4. **数据库连接问题**
   - 检查数据库服务是否运行
   - 验证连接字符串和凭据
   - 检查防火墙设置

### 日志查看

```bash
# 查看应用日志
tail -f server.log

# 查看系统日志
sudo journalctl -u globallink -f

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 📈 性能优化

### 1. 使用多个Worker进程

修改 `start_server.py`：
```python
uvicorn.run(
    app,
    host="0.0.0.0",
    port=8000,
    workers=4,  # 根据CPU核心数调整
    worker_class="uvicorn.workers.UvicornWorker"
)
```

### 2. 数据库连接池优化

在 `.env` 文件中：
```bash
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
```

### 3. Redis缓存

确保Redis服务运行：
```bash
sudo systemctl start redis
sudo systemctl enable redis
```

## 🔄 更新部署

```bash
# 拉取最新代码
git pull origin main

# 更新依赖
pip install -r requirements.txt

# 重启服务
sudo systemctl restart globallink
# 或者
pm2 restart globallink
```

## 📞 支持

如果遇到问题，请检查：
1. 服务器日志文件
2. 网络连接和防火墙设置
3. 依赖包版本兼容性
4. 数据库连接配置

---

**维护者**: GlobalLink 开发团队  
**最后更新**: 2025-01-10