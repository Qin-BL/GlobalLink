# 检查是否以管理员权限运行
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "请以管理员权限运行此脚本"
    exit
}

# 获取项目根目录
$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BACKEND_DIR = Join-Path $PROJECT_DIR "backend"

# 安装依赖
Write-Host "正在安装缺失的依赖..."
Set-Location -Path $BACKEND_DIR
pip install -r requirements.txt

# 检查并启动后端服务（Windows环境下使用不同的服务管理方式）
Write-Host "
注意：Windows环境下不使用systemd，您可以通过以下命令手动启动后端服务：
"
Write-Host "cd $BACKEND_DIR"
Write-Host "venv\Scripts\activate"  # 假设存在虚拟环境
Write-Host "uvicorn main:app --host 0.0.0.0 --port 8000"

# 提供额外的故障排查信息
Write-Host "
如果启动过程中遇到问题，可以尝试以下操作：
1. 确保已安装所有依赖：pip install -r requirements.txt
2. 检查Python版本是否符合要求
3. 查看错误日志以获取详细信息
"

Write-Host "修复脚本执行完成。"