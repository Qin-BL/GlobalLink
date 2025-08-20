# GlobalLink项目安装指南

## 项目简介
GlobalLink是一个英语学习平台，包含前端React应用和后端FastAPI服务，使用PostgreSQL数据库。

## 安装脚本说明
本项目提供了Linux和Windows两种系统的安装脚本，可以一键安装所有依赖并配置运行环境。

## 前提条件
- 网络连接正常
- 对于Linux: Ubuntu/Debian系统
- 对于Windows: Windows 10及以上版本

## Linux安装步骤
1. 打开终端，进入项目根目录
2. 运行安装脚本:
   ```bash
   sudo ./install_linux.sh
   ```
3. 脚本会自动安装所有依赖、配置数据库并创建启动脚本
4. 安装完成后，运行以下命令启动项目:
   ```bash
   ./start.sh
   ```

## Windows安装步骤
1. 以管理员身份打开命令提示符(cmd)
2. 进入项目根目录
3. 运行安装脚本:
   ```batch
   install_windows.bat
   ```
4. 脚本会自动安装所有依赖、配置数据库并创建启动脚本
5. 安装完成后，双击运行`start.bat`启动项目

## 手动配置环境变量(可选)
如果脚本自动配置失败，可能需要手动设置以下环境变量:

### Linux
```bash
# PostgreSQL环境变量
export PATH=$PATH:/usr/lib/postgresql/14/bin

# Python虚拟环境
source /path/to/backend/venv/bin/activate
```

### Windows
```batch
# PostgreSQL环境变量
set PATH=%PATH%;C:\Program Files\PostgreSQL\14\bin

# Python虚拟环境
call C:\path\to\backend\venv\Scripts\activate.bat
```

## 启动项目
### 后端
```bash
# Linux
source backend/venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000

# Windows
call backend\venv\Scripts\activate.bat
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 前端
```bash
# Linux/Windows
cd frontend
npm start
```

## 访问项目
安装并启动成功后，在浏览器中访问:
- 前端应用: http://localhost:3000
- 后端API文档: http://localhost:8000/docs

## 故障排除
1. **数据库连接失败**:
   - 检查PostgreSQL服务是否正常运行
   - 确认.env文件中的数据库配置正确

2. **依赖安装失败**:
   - 检查网络连接
   - 尝试手动安装失败的依赖包

3. **端口冲突**:
   - 确保8000和3000端口未被其他服务占用
   - 可以在启动命令中指定其他端口

如果遇到其他问题，请查看安装日志或联系技术支持。