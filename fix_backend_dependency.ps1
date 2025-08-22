# 修复后端依赖问题的PowerShell脚本

# 检查是否以管理员身份运行
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Write-Warning "请以管理员身份运行此脚本"
    exit 1
}

# 设置项目根目录
$projectRoot = "d:\项目\GlobalLink"
$backendDir = Join-Path $projectRoot "backend"

# 导航到后端目录
Set-Location -Path $backendDir

# 提示用户激活虚拟环境
Write-Host "请确保已激活Python虚拟环境，然后按Enter继续..."
Read-Host

# 安装依赖
Write-Host "正在安装依赖..."
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Error "安装依赖失败，请检查requirements.txt文件"
    exit 1
}

# 启动后端服务
Write-Host "正在启动后端服务..."
# 停止可能正在运行的服务
Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force

# 启动新的服务进程
Start-Process -FilePath "uvicorn" -ArgumentList "main:app --host 0.0.0.0 --port 8000" -WorkingDirectory $backendDir

# 检查服务是否启动成功
Start-Sleep -Seconds 5
if (Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue) {
    Write-Host "后端服务启动成功!"
    Write-Host "请访问 http://localhost:8000/docs 验证服务是否正常"
} else {
    Write-Error "后端服务启动失败，请查看日志以获取详细信息"
}

Write-Host "修复脚本执行完成"