# GlobalLink项目安装指南

## 项目简介
GlobalLink是一个英语学习平台，包含前端React应用和后端FastAPI服务，使用PostgreSQL、MongoDB和Redis数据库。

## 安装脚本说明
本项目提供了两种安装方式：
1. 使用Docker安装（推荐）
2. 不使用Docker直接安装

所有安装脚本都针对Ubuntu 20.04系统进行了优化。

## 前提条件
- 网络连接正常
- Ubuntu 20.04系统
- 足够的磁盘空间（至少5GB）
- 对于Docker安装：需要安装Docker和Docker Compose
- 对于非Docker安装：需要安装Python 3.8+、Node.js 16+

## 使用Docker安装（推荐）

### 安装步骤
1. 打开终端，进入项目根目录
2. 运行安装脚本:
   ```bash
   sudo chmod +x ./install/with_docker/install.sh
   sudo ./install/with_docker/install.sh
   ```
3. 脚本会自动安装Docker、Docker Compose、配置数据库并启动所有服务
4. **重要**：安装完成后，如果需要自定义配置，请修改项目根目录下的`.env`文件，特别是数据库密码和邮件服务配置
5. 修改完成后，重启容器使配置生效:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### 单独安装组件
如果需要单独安装某个组件，可以使用以下脚本：

```bash
# 安装数据库（PostgreSQL、MongoDB、Redis）
sudo ./install/with_docker/install_database.sh

# 安装后端
sudo ./install/with_docker/install_backend.sh

# 安装前端
sudo ./install/with_docker/install_frontend.sh

# 安装Nginx
sudo ./install/with_docker/install_nginx.sh
```

### 启动服务
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f
```

## 不使用Docker安装

### 安装步骤
1. 打开终端，进入项目根目录
2. 运行安装脚本:
   ```bash
   sudo chmod +x ./install/without_docker/install.sh
   sudo ./install/without_docker/install.sh
   ```
3. 脚本会自动安装所有依赖、从.env.example复制创建.env文件并启动所有服务
4. **重要**：安装完成后，请务必修改`backend/.env`文件中的配置参数，特别是：
   - 数据库密码（POSTGRES_PASSWORD）
   - 邮件服务配置（MAIL_SERVER、MAIL_PORT、MAIL_USERNAME、MAIL_PASSWORD等）
   - 其他服务的配置参数
5. 修改完成后，重启服务使配置生效:
   ```bash
   sudo systemctl restart globallink-backend
   ```

### 单独安装组件
如果需要单独安装某个组件，可以使用以下脚本：

```bash
# 安装数据库（PostgreSQL、MongoDB、Redis）
sudo ./install/without_docker/install_database.sh

# 安装后端
sudo ./install/without_docker/install_backend.sh

# 安装前端
sudo ./install/without_docker/install_frontend.sh

# 安装Nginx
sudo ./install/without_docker/install_nginx.sh
```

### 启动服务
```bash
# 启动后端
sudo systemctl start globallink-backend
# 或者开发模式
./start_backend.sh

# 启动前端
sudo systemctl start globallink-frontend
# 或者开发模式
./start_frontend.sh
```

## 环境变量配置
后端服务需要配置环境变量，主要在`.env`文件中设置。如果使用安装脚本，会自动创建此文件。主要配置项包括：

```
POSTGRES_SERVER=localhost
POSTGRES_USER=globallink
POSTGRES_PASSWORD=password
POSTGRES_DB=globallink
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=globallink
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

## 访问项目
安装并启动成功后，在浏览器中访问:
- 前端应用: http://localhost:3080
- 后端API文档: http://localhost:8000/docs
- Nginx代理: http://localhost

## 故障排除
1. **数据库连接失败**:
   - 检查PostgreSQL/MongoDB/Redis服务是否正常运行
   - 确认.env文件中的数据库配置正确
   - Docker环境：`docker-compose logs db`查看数据库日志

2. **依赖安装失败**:
   - 检查网络连接
   - 尝试使用国内镜像源（如pip使用清华源）
   - Docker环境：确保Docker服务正常运行

3. **端口冲突**:
   - 确保8000和3080端口未被其他服务占用
   - 可以修改`docker-compose.yml`或前端配置中的端口

4. **服务无法启动**:
   - 检查日志：`sudo journalctl -u globallink-backend`
   - Docker环境：`docker-compose logs backend`或`docker-compose logs frontend`

如果遇到其他问题，请查看安装日志或联系技术支持。