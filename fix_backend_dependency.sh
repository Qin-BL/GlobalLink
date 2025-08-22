#!/bin/bash

# 全面修复后端依赖问题的Shell脚本（适用于Ubuntu系统）

# 检查是否以root身份运行
if [ "$EUID" -ne 0 ]
  then echo "请以root身份运行此脚本"
  exit 1
fi

# 设置项目根目录
projectRoot="/path/to/GlobalLink"  # 请修改为实际项目路径
backendDir="$projectRoot/backend"
requirementsFile="$backendDir/requirements.txt"
configFile="$backendDir/app/core/config.py"

# 备份原始文件
echo "正在备份原始文件..."
timestamp=$(date +"%Y%m%d%H%M%S")
requirementsBackup="$requirementsFile.$timestamp.bak"
configBackup="$configFile.$timestamp.bak"
cp -f $requirementsFile $requirementsBackup
cp -f $configFile $configBackup
echo "文件备份完成: $requirementsBackup, $configBackup"

# 修复requirements.txt文件
echo "正在修复requirements.txt文件..."
# 确保移除pydantic-settings
sed -i '/pydantic-settings==[0-9.]*/d' $requirementsFile
# 确保pydantic版本与fastapi兼容
if grep -q "fastapi==0.95.1" $requirementsFile; then
    # 移除现有的pydantic行
    sed -i '/pydantic==[0-9.]*/d' $requirementsFile
    # 添加兼容的pydantic版本
    echo "pydantic==1.10.12" >> $requirementsFile
fi
echo "requirements.txt文件修复完成"

# 修复config.py文件
echo "正在修复config.py文件..."
# 确保使用正确的pydantic导入
sed -i 's/from pydantic_settings import BaseSettings/from pydantic import BaseSettings/g' $configFile
echo "config.py文件修复完成"

# 导航到后端目录
cd $backendDir

# 提示用户激活虚拟环境
echo -e "\n请确保已激活Python虚拟环境，然后按Enter继续..."
read -r

# 升级pip
echo "正在升级pip..."
python -m pip install --upgrade pip
if [ $? -ne 0 ]; then
    echo "升级pip失败"
    exit 1
fi

# 安装依赖
echo -e "\n正在安装依赖..."
# 使用--no-cache-dir参数避免使用缓存
pip install --no-cache-dir -r requirements.txt
if [ $? -ne 0 ]; then
    echo "安装依赖失败，请检查requirements.txt文件"
    # 尝试单独安装冲突的包
    echo "尝试单独安装pydantic..."
    pip install pydantic==1.10.12
    if [ $? -ne 0 ]; then
        echo "单独安装pydantic也失败"
        exit 1
    fi
    echo "尝试再次安装所有依赖..."
    pip install --no-cache-dir -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "再次安装依赖失败"
        exit 1
    fi
fi

# 启动后端服务
echo -e "\n正在启动后端服务..."
# 停止可能正在运行的服务
pkill -f uvicorn || true

# 启动新的服务进程
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > uvicorn.log 2>&1 &
service_pid=$!

# 检查服务是否启动成功
echo "正在检查服务状态..."
sleep 5
if ps -p $service_pid > /dev/null; then
    echo -e "\n后端服务启动成功!"
    echo "服务进程ID: $service_pid"
    echo "请访问 http://localhost:8000/docs 验证服务是否正常"
    echo -e "\n提示: 若要停止服务，可以运行以下命令:"
    echo "kill $service_pid"
else
    echo "后端服务启动失败，请查看日志以获取详细信息"
    echo "日志位置: $backendDir/uvicorn.log"
fi

echo -e "\n修复脚本执行完成"