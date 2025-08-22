@echo off

:: 检查是否以管理员权限运行
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo 请以管理员权限运行此脚本
    pause
    exit /b 1
)

:: 调用PowerShell脚本
echo 正在启动修复脚本...
powershell -ExecutionPolicy Bypass -File "%~dp0fix_backend_service.ps1"

pause