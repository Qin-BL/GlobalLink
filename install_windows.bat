@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 开启详细日志模式
set LOG_LEVEL=DEBUG

REM 检查是否以管理员身份运行
NET SESSION >nul 2>&1
if %errorLevel% NEQ 0 (
    echo 错误：请以管理员身份运行此脚本！
    pause
    exit /B 1
)

REM 定义日志函数
:LOG
if "%LOG_LEVEL%" EQU "DEBUG" (
    REM 格式化日期时间
    set "LOG_TIME=%DATE:~0,4%-%DATE:~5,2%-%DATE:~8,2% %TIME:~0,2%:%TIME:~3,2%:%TIME:~6,2%"
    echo [%LOG_TIME%] %1
)
GOTO :EOF

REM 定义获取Chocolatey路径的函数
:GET_CHOCO_PATH
set CHOCO_PATH=
call :LOG "开始查找Chocolatey路径..."

REM 尝试直接从环境变量PATH中查找
call :LOG "尝试从环境变量PATH中查找..."
for /f "delims=" %%i in ('where choco 2^>nul') do set CHOCO_PATH=%%i

REM 如果未找到，尝试常见安装路径
if not defined CHOCO_PATH (
    call :LOG "未在PATH中找到，尝试默认安装路径..."
    if exist "C:\ProgramData\chocolatey\bin\choco.exe" (
        set CHOCO_PATH=C:\ProgramData\chocolatey\bin\choco.exe
        call :LOG "在默认安装路径找到Chocolatey"
    ) else (
        call :LOG "未找到Chocolatey命令"
        call :LOG "尝试手动添加默认路径到临时环境变量..."
        set "PATH=%PATH%;C:\ProgramData\chocolatey\bin"
        for /f "delims=" %%i in ('where choco 2^>nul') do set CHOCO_PATH=%%i
        if not defined CHOCO_PATH (
            call :LOG "添加路径后仍未找到Chocolatey"
            exit /b 1
        )
    )
)

call :LOG "找到Chocolatey路径: %CHOCO_PATH%"
GOTO :EOF

REM 检查并安装Chocolatey包管理器
 echo 检查Chocolatey是否已安装...
 call :GET_CHOCO_PATH
call :LOG "检查Chocolatey安装状态..."
if defined CHOCO_PATH (
    call :LOG "Chocolatey已安装"
    echo 1 > choco_installed.txt
) else (
    call :LOG "Chocolatey未安装"
    echo 0 > choco_installed.txt
)
 if not exist choco_installed.txt (
        echo 获取Chocolatey安装状态失败
        pause
        exit /b 1
    )
    set /p CHOCO_INSTALLED=<choco_installed.txt
    del choco_installed.txt
    echo Chocolatey安装状态: %CHOCO_INSTALLED%

    if "%CHOCO_INSTALLED%" EQU "1" (
        call :LOG "Chocolatey已安装，跳过安装步骤"
        call :LOG "开始更新Chocolatey..."
        call :GET_CHOCO_PATH
        if defined CHOCO_PATH (
            call :LOG "使用Chocolatey路径: %CHOCO_PATH%"
            %CHOCO_PATH% upgrade chocolatey -y
            call :LOG "Chocolatey更新完成"
        ) else (
            call :LOG "Chocolatey命令不可用"
            cmd /c exit 1
        )
        if "%errorLevel%" NEQ "0" (
            echo Chocolatey更新失败，继续尝试使用现有版本...
        )
    ) else (
    echo 检查是否存在Chocolatey残留文件...
    if exist "C:\ProgramData\chocolatey" (
        echo 发现Chocolatey残留文件，正在尝试删除...
        REM 以管理员权限删除文件夹
        powershell -Command "Start-Process powershell -ArgumentList '-Command Remove-Item -Path ''C:\ProgramData\chocolatey'' -Recurse -Force' -Verb RunAs -Wait"
        if "%errorLevel%" NEQ "0" (
            echo 删除残留文件失败，请手动删除C:\ProgramData\chocolatey文件夹
            echo 然后重新运行此安装脚本
            pause
            exit /b 1
        )
    )

    echo 正在检查网络连接...
    powershell -Command "try { Invoke-WebRequest -Uri 'https://chocolatey.org' -UseBasicParsing | Out-Null; Write-Output '1' > network_connected.txt } catch { Write-Output '0' > network_connected.txt }"
    if not exist network_connected.txt (
        echo 获取网络状态失败
        pause
        exit /b 1
    )
    set /p NETWORK_CONNECTED=<network_connected.txt
    del network_connected.txt
    echo 网络状态: %NETWORK_CONNECTED%

    if "%NETWORK_CONNECTED%" EQU "0" (
        echo 网络连接失败，请检查您的网络并重试
        pause
        exit /b 1
    )

    call :LOG "开始安装Chocolatey包管理器..."
    set CHOCO_INSTALL_RETRIES=3
    set CHOCO_INSTALL_SUCCESS=0

    :choco_install_retry
    call :LOG "第 %CHOCO_INSTALL_RETRIES% 次尝试安装..."
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))"

    REM 验证Chocolatey是否安装成功
    call :LOG "验证Chocolatey是否安装成功..."
    call :GET_CHOCO_PATH
    if defined CHOCO_PATH (
        call :LOG "Chocolatey安装成功"
        echo 1 > choco_installed.txt
    ) else (
        call :LOG "Chocolatey安装失败"
        echo 0 > choco_installed.txt
    )
    if not exist choco_installed.txt (
        echo 获取Chocolatey状态失败
        pause
        exit /b 1
    )
    set /p CHOCO_INSTALLED=<choco_installed.txt
    del choco_installed.txt
    echo Chocolatey状态: %CHOCO_INSTALLED%

    if "%CHOCO_INSTALL_RETRIES%" EQU "3" (
        REM 首次安装失败，尝试添加环境变量
        echo 尝试添加Chocolatey到环境变量...
        set PATH=%PATH%;C:\ProgramData\chocolatey\bin
        powershell -Command "[System.Environment]::SetEnvironmentVariable('Path', [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';C:\ProgramData\chocolatey\bin', 'Machine')"
    )

    if "%CHOCO_INSTALL_RETRIES%" EQU "2" (
        REM 第二次安装失败，尝试手动刷新环境变量
        echo 尝试刷新环境变量...
        call refreshenv
    )

    REM 初始化重试标志
    if not defined CHOCO_INSTALL_RETRIED (
        set CHOCO_INSTALL_RETRIED=0
    )

    if "%CHOCO_INSTALLED%" EQU "1" (
        set CHOCO_INSTALL_SUCCESS=1
        goto choco_install_done
    ) else (
        set /a CHOCO_INSTALL_RETRIES-=1
        if "%CHOCO_INSTALL_RETRIES%" GTR "0" (
            echo Chocolatey安装失败，5秒后重试...
            timeout /t 5 /nobreak >nul
            goto choco_install_retry
        )
    )

    :choco_install_done
    if "%CHOCO_INSTALL_SUCCESS%" EQU "0" (
        echo Chocolatey安装失败，已达到最大重试次数
        echo 请手动安装Chocolatey: https://chocolatey.org/install
        echo 安装完成后重新运行此脚本
        pause
        exit /b 1
    )

    REM 确保Chocolatey命令可用
    echo 验证Chocolatey命令是否可用...
    call :GET_CHOCO_PATH
    if defined CHOCO_PATH (
        echo Chocolatey命令已找到
        for /f "delims=" %%v in ('%CHOCO_PATH% --version') do set CHOCO_VERSION=%%v
        echo Chocolatey版本: %CHOCO_VERSION%
    ) else (
        echo 未找到Chocolatey命令
        echo 尝试添加Chocolatey到环境变量...
        set "PATH=%PATH%;C:\ProgramData\chocolatey\bin"
        powershell -Command "[System.Environment]::SetEnvironmentVariable('Path', [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';C:\ProgramData\chocolatey\bin', 'Machine')"
        echo 再次验证Chocolatey命令是否可用...
        call :GET_CHOCO_PATH
        if defined CHOCO_PATH (
            echo 环境变量配置后找到Chocolatey命令
            for /f "delims=" %%v in ('%CHOCO_PATH% --version') do set CHOCO_VERSION=%%v
            echo Chocolatey版本: %CHOCO_VERSION%
        ) else (
            echo Chocolatey配置失败，请手动执行以下步骤:
            echo 1. 将C:\ProgramData\chocolatey\bin添加到系统PATH环境变量
            echo 2. 重启命令提示符
            echo 3. 运行'choco --version'验证安装
            pause
            exit /B 1
        )
    }
    echo Chocolatey安装并配置成功！
 )

REM 安装必要依赖
call :LOG "验证Chocolatey命令是否可用..."
call :GET_CHOCO_PATH
if not defined CHOCO_PATH (
    call :LOG "Chocolatey命令不可用，无法安装依赖"
    echo 请手动安装以下依赖:
    echo 1. Python
    echo 2. Node.js
    echo 3. Git
    echo 4. PostgreSQL 14
    pause
    exit /b 1
)
call :LOG "找到Chocolatey路径: %CHOCO_PATH%"
call :LOG "开始安装必要依赖..."
%CHOCO_PATH% install -y python nodejs git postgresql14 --timeout 1800
call :LOG "依赖安装完成"
if "%errorLevel%" NEQ "0" (
    echo 依赖安装失败，请检查网络连接并重试
    pause
    exit /b 1
)

REM 配置PostgreSQL数据库
echo 正在配置PostgreSQL数据库...

REM 检查PostgreSQL是否安装
if not exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    echo PostgreSQL未安装成功，请检查错误信息
    pause
    exit /b 1
)

REM 设置环境变量以便psql命令可用
set PATH=%PATH%;C:\Program Files\PostgreSQL\14\bin

REM 确保PostgreSQL服务已启动
sc query postgresql-x64-14 >nul 2>&1
if "%errorLevel%" NEQ "0" (
    echo 启动PostgreSQL服务...
    net start postgresql-x64-14
    if "%errorLevel%" NEQ "0" (
        echo PostgreSQL服务启动失败，请手动启动后重试
        pause
        exit /b 1
    )
)

REM 使用psql命令行工具配置数据库
REM 检查postgres用户是否存在并设置密码
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'password';" >nul 2>&1
if "%errorLevel%" NEQ "0" (
    echo 设置postgres用户密码失败，尝试创建用户...
    psql -U postgres -c "CREATE USER postgres WITH PASSWORD 'password';" >nul 2>&1
    if "%errorLevel%" NEQ "0" (
        echo 创建数据库用户失败，请检查PostgreSQL配置
        pause
        exit /b 1
    )
)

REM 创建数据库
psql -U postgres -c "CREATE DATABASE IF NOT EXISTS globallink;" >nul 2>&1
if "%errorLevel%" NEQ "0" (
    echo 创建数据库失败
    echo 错误信息: & psql -U postgres -c "CREATE DATABASE IF NOT EXISTS globallink;"
    pause
    exit /b 1
)

REM 授予用户权限
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE globallink TO postgres;" >nul 2>&1
if "%errorLevel%" NEQ "0" (
    echo 授予数据库权限失败
    pause
    exit /b 1
)

REM 配置环境变量
setx PATH "%PATH%;C:\Program Files\PostgreSQL\14\bin"

REM 安装Python虚拟环境工具
pip install virtualenv
if "%errorLevel%" NEQ "0" (
    echo 安装virtualenv失败，请检查Python配置
    pause
    exit /b 1
)

REM 进入后端目录并创建虚拟环境
cd backend
virtualenv venv
if "%errorLevel%" NEQ "0" (
    echo 创建虚拟环境失败
    echo 错误信息: & virtualenv venv
    pause
    exit /b 1
)

call venv\Scripts\activate.bat
if "%errorLevel%" NEQ "0" (
    echo 激活虚拟环境失败
    pause
    exit /b 1
)

REM 安装后端依赖
 echo 正在安装后端依赖...
pip install -r requirements.txt
if "%errorLevel%" NEQ "0" (
    echo 后端依赖安装失败，请检查网络连接或requirements.txt文件
    pause
    exit /b 1
)

REM 创建.env文件
if not exist .env.example (
    echo .env.example文件不存在
    pause
    exit /b 1
)

copy .env.example .env >nul 2>&1
if "%errorLevel%" NEQ "0" (
    echo 创建.env文件失败
    pause
    exit /b 1
)

echo 后端依赖安装完成

deactivate

REM 进入前端目录并安装依赖
cd ..\frontend

REM 检查npm是否安装成功
npm --version >nul 2>&1
if "%errorLevel%" NEQ "0" (
    echo npm未安装成功，请检查Node.js配置
    pause
    exit /b 1
)

REM 安装前端依赖
 echo 正在安装前端依赖...
npm install
if "%errorLevel%" NEQ "0" (
    echo 前端依赖安装失败，请检查网络连接
    pause
    exit /b 1
)

REM 返回项目根目录
cd ..

REM 创建启动脚本start.bat
call :LOG "开始创建启动脚本start.bat..."
    call :LOG "当前目录: %CD%"
    (
        echo @echo off
        echo cd /d "%~dp0"
        echo echo 正在启动GlobalLink项目...
        echo echo 正在启动后端服务...
        echo cd backend
        echo call venv\Scripts\activate.bat
        echo start "Backend Server" cmd /c "uvicorn main:app --reload"
        echo timeout /t 5 /nobreak ^>nul
        echo echo 正在启动前端服务...
        echo cd ..\frontend
        echo start "Frontend Server" cmd /c "npm start"
        echo echo 服务启动完成！
        echo echo 前端地址: http://localhost:3000
        echo echo 后端API文档: http://localhost:8000/docs
        echo pause
    ) > start.bat
    if errorlevel 1 (
        call :LOG "创建start.bat失败，错误码: %errorlevel%"
        echo 创建启动脚本失败，请手动创建
        pause
        exit /b 1
    )
    call :LOG "启动脚本start.bat创建成功！"
    echo 启动脚本start.bat创建成功！
    call :LOG "验证start.bat是否存在..."
    if exist start.bat (
        call :LOG "start.bat文件已成功创建"
    ) else (
        call :LOG "警告：start.bat文件未找到"
    )

REM 设置start.bat为可执行
icacls start.bat /grant everyone:F >nul 2>&1

REM 安装完成
 echo 安装完成！
 echo 请双击start.bat启动项目
 echo 前端地址: http://localhost:3000
 echo 后端API文档: http://localhost:8000/docs
pause

exit /b 0