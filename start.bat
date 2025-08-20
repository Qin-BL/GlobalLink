@echo off
echo 启动GlobalLink服务...
cd /d "%~dp0\backend"
start "GlobalLink" cmd /k "python main.py"
echo 后端服务已启动，请保持此窗口打开。
echo 请在浏览器中访问 http://localhost:8000