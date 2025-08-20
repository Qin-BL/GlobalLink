@echo off
chcp 65001

echo 准备启动GlobalLink服务...

REM 检查Python是否已安装
python --version >nul 2>&1
if %errorLevel% NEQ 0 (
    echo 错误：未找到Python。请先安装Python。
    pause
    exit /B 1
)

REM 检查Node.js是否已安装
node --version >nul 2>&1
if %errorLevel% NEQ 0 (
    echo 错误：未找到Node.js。请先安装Node.js。
    pause
    exit /B 1
)

REM 安装后端依赖
cd /d "%~dp0\backend"
echo 正在安装后端依赖...
pip install -r requirements.txt
if %errorLevel% NEQ 0 (
    echo 错误：后端依赖安装失败。
    pause
    exit /B 1
)

REM 安装前端依赖
cd /d "%~dp0\frontend"
echo 正在安装前端依赖...
npm install
if %errorLevel% NEQ 0 (
    echo 错误：前端依赖安装失败。
    pause
    exit /B 1
)

REM 启动后端服务
cd /d "%~dp0"
echo 正在启动后端服务...
start "GlobalLink 后端服务" cmd /k "cd backend && python main.py"
if %errorLevel% NEQ 0 (
    echo 错误：后端服务启动失败。
    pause
    exit /B 1
)

REM 等待后端服务启动
ping 127.0.0.1 -n 5 >nul

REM 启动前端服务
cd /d "%~dp0\frontend"
echo 正在启动前端服务...
start "GlobalLink 前端服务" cmd /k "npm start"
if %errorLevel% NEQ 0 (
    echo 错误：前端服务启动失败。
    pause
    exit /B 1
)

echo 服务启动完成！
echo 请在浏览器中访问 http://localhost:3000
pause