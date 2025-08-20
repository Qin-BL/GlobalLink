# GlobalLink 手动安装指南

由于自动安装脚本遇到问题，以下是手动安装和启动GlobalLink服务的步骤：

## 1. 安装依赖

### 安装Python
1. 访问Python官网: https://www.python.org/downloads/
2. 下载并安装最新版本的Python (建议3.8或更高版本)
3. 安装时勾选"Add Python to PATH"

### 安装Node.js
1. 访问Node.js官网: https://nodejs.org/
2. 下载并安装最新的LTS版本
3. 安装时保持默认设置

## 2. 安装项目依赖

### 后端依赖
1. 打开命令提示符(cmd)
2. 导航到项目目录:
   ```
   cd d:\项目\GlobalLink\backend
   ```
3. 安装依赖:
   ```
   pip install -r requirements.txt
   ```

### 前端依赖
1. 打开新的命令提示符(cmd)
2. 导航到项目目录:
   ```
   cd d:\项目\GlobalLink\frontend
   ```
3. 安装依赖:
   ```
   npm install
   ```

## 3. 启动服务

### 启动后端服务
1. 在后端命令提示符中:
   ```
   python main.py
   ```

### 启动前端服务
1. 在前端命令提示符中:
   ```
   npm start
   ```

## 4. 访问应用
打开浏览器，访问: http://localhost:3000

## 故障排除
- 如果遇到Python相关错误，请确保Python已正确安装并添加到PATH
- 如果遇到Node.js相关错误，请确保Node.js已正确安装并添加到PATH
- 如果后端服务启动失败，请检查数据库配置是否正确
- 如果前端服务启动失败，请尝试删除node_modules文件夹并重新运行`npm install`