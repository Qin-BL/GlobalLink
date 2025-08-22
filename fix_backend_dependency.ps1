# 全面修复后端依赖问题的PowerShell脚本

# 检查是否以管理员身份运行
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    Write-Warning "请以管理员身份运行此脚本"
    exit 1
}

# 设置项目根目录
$projectRoot = "d:\项目\GlobalLink"
$backendDir = Join-Path $projectRoot "backend"
$requirementsFile = Join-Path $backendDir "requirements.txt"
$configFile = Join-Path $backendDir "app\core\config.py"

# 备份原始文件
Write-Host "正在备份原始文件..."
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$requirementsBackup = "$requirementsFile.$timestamp.bak"
$configBackup = "$configFile.$timestamp.bak"
Copy-Item -Path $requirementsFile -Destination $requirementsBackup
Copy-Item -Path $configFile -Destination $configBackup
Write-Host "文件备份完成: $requirementsBackup, $configBackup"

# 修复requirements.txt文件
Write-Host "正在修复requirements.txt文件..."
$requirementsContent = Get-Content -Path $requirementsFile -Raw
# 确保移除pydantic-settings
$requirementsContent = $requirementsContent -replace "pydantic-settings==[0-9.]+\s*", ""
# 确保pydantic版本与fastapi兼容
if ($requirementsContent -match "fastapi==0.95.1") {
    $requirementsContent = $requirementsContent -replace "pydantic==[0-9.]+\s*", "pydantic==1.10.12 "
}
# 保存修改后的文件
Set-Content -Path $requirementsFile -Value $requirementsContent
Write-Host "requirements.txt文件修复完成"

# 修复config.py文件
Write-Host "正在修复config.py文件..."
$configContent = Get-Content -Path $configFile -Raw
# 确保使用正确的pydantic导入
$configContent = $configContent -replace "from pydantic_settings import BaseSettings", "from pydantic import BaseSettings"
# 保存修改后的文件
Set-Content -Path $configFile -Value $configContent
Write-Host "config.py文件修复完成"

# 导航到后端目录
Set-Location -Path $backendDir

# 提示用户激活虚拟环境
Write-Host "
请确保已激活Python虚拟环境，然后按Enter继续..."
Read-Host

# 升级pip
Write-Host "正在升级pip..."
python -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) {
    Write-Error "升级pip失败"
    exit 1
}

# 安装依赖
Write-Host "
正在安装依赖..."
# 使用--no-cache-dir参数避免使用缓存
pip install --no-cache-dir -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Error "安装依赖失败，请检查requirements.txt文件"
    # 尝试单独安装冲突的包
    Write-Host "尝试单独安装pydantic..."
    pip install pydantic==1.10.12
    if ($LASTEXITCODE -ne 0) {
        Write-Error "单独安装pydantic也失败"
        exit 1
    }
    Write-Host "尝试再次安装所有依赖..."
    pip install --no-cache-dir -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Error "再次安装依赖失败"
        exit 1
    }
}

# 启动后端服务
Write-Host "
正在启动后端服务..."
# 停止可能正在运行的服务
Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force

# 启动新的服务进程
$serviceProcess = Start-Process -FilePath "uvicorn" -ArgumentList "main:app --host 0.0.0.0 --port 8000" -WorkingDirectory $backendDir -PassThru

# 检查服务是否启动成功
Write-Host "正在检查服务状态..."
Start-Sleep -Seconds 5
if (Get-Process -Id $serviceProcess.Id -ErrorAction SilentlyContinue) {
    Write-Host "
后端服务启动成功!"
    Write-Host "服务进程ID: $($serviceProcess.Id)"
    Write-Host "请访问 http://localhost:8000/docs 验证服务是否正常"
    Write-Host "
提示: 若要停止服务，可以运行以下命令:"
    Write-Host "Stop-Process -Id $($serviceProcess.Id)"
} else {
    Write-Error "后端服务启动失败，请查看日志以获取详细信息"
}