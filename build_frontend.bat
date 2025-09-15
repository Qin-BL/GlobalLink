@echo off

REM 构建前端应用的Windows批处理脚本

REM 检查是否在正确的项目根目录
if not exist "frontend" (
  echo 错误: 请在 GlobalLink 项目根目录下运行此脚本
  echo 当前目录: %cd%
  pause
  exit /b 1
)

REM 进入 frontend 目录
echo 正在进入 frontend 目录...
cd frontend

REM 检查 package.json 是否存在
if not exist "package.json" (
  echo 错误: frontend 目录中未找到 package.json 文件
  pause
  exit /b 1
)

REM 检查是否安装了 npm
echo 检查 npm 是否安装...
npm --version >nul 2>nul
if %errorlevel% neq 0 (
  echo 错误: npm 未安装，请先安装 Node.js 和 npm
  pause
  exit /b 1
)

REM 安装依赖
echo 正在安装依赖...
npm install
if %errorlevel% neq 0 (
  echo 错误: 依赖安装失败
  pause
  exit /b 1
)

REM 构建前端应用
echo 正在构建前端应用...
npm run build
if %errorlevel% neq 0 (
  echo 错误: 前端应用构建失败
  pause
  exit /b 1
)

echo 前端应用构建成功!
echo 构建文件位于 frontend/build 目录中
pause