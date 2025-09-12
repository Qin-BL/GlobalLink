#!/usr/bin/env bash

# GlobalLink后端故障排除脚本
set -e

echo "===== GlobalLink后端故障排除工具 ====="

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"

echo "项目根目录: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# 检查系统信息
echo ""
echo "=== 系统信息检查 ==="
echo "操作系统: $(lsb_release -d 2>/dev/null | cut -f2 || echo "未知")"
echo "内核版本: $(uname -r)"
echo "架构: $(uname -m)"
echo "内存: $(free -h | grep Mem | awk '{print $2}')"
echo "磁盘空间: $(df -h . | tail -1 | awk '{print $4}' | sed 's/G/ GB/')"

# 检查Python安装
echo ""
echo "=== Python环境检查 ==="
if command -v python3.12 >/dev/null 2>&1; then
    echo "✓ Python 3.12: $(python3.12 --version)"
    echo "  路径: $(which python3.12)"
else
    echo "✗ Python 3.12 未安装"
    echo "  解决方案: 运行 sudo apt install python3.12 python3.12-venv python3.12-dev"
fi

# 检查系统依赖
echo ""
echo "=== 系统依赖检查 ==="
dependencies=(
    "gcc" "g++" "make" "pkg-config"
    "libffi-dev" "libssl-dev" "zlib1g-dev"
    "libjpeg-dev" "libfreetype6-dev"
)

for dep in "${dependencies[@]}"; do
    if dpkg -l | grep -q "^ii.*$dep"; then
        echo "✓ $dep 已安装"
    else
        echo "✗ $dep 未安装"
    fi
done

# 检查虚拟环境
echo ""
echo "=== 虚拟环境检查 ==="
if [ -d "backend/venv" ]; then
    echo "✓ 虚拟环境存在: backend/venv"
    
    # 检查虚拟环境中的Python
    if [ -f "backend/venv/bin/python" ]; then
        echo "✓ 虚拟环境Python: $(backend/venv/bin/python --version)"
        
        # 检查pip
        if [ -f "backend/venv/bin/pip" ]; then
            echo "✓ 虚拟环境pip: $(backend/venv/bin/pip --version)"
        else
            echo "✗ 虚拟环境pip不存在"
        fi
    else
        echo "✗ 虚拟环境Python不存在"
    fi
else
    echo "✗ 虚拟环境不存在"
    echo "  解决方案: cd backend && python3.12 -m venv venv"
fi

# 检查requirements.txt
echo ""
echo "=== 项目文件检查 ==="
if [ -f "backend/requirements.txt" ]; then
    echo "✓ requirements.txt 存在"
    echo "  包数量: $(wc -l < backend/requirements.txt)"
else
    echo "✗ requirements.txt 不存在"
fi

if [ -f "backend/.env" ]; then
    echo "✓ .env 文件存在"
else
    echo "✗ .env 文件不存在"
    echo "  解决方案: 复制 .env.example 到 .env 并配置"
fi

# 检查关键Python包
echo ""
echo "=== Python包检查 ==="
if [ -d "backend/venv" ]; then
    cd backend
    source venv/bin/activate
    
    packages=("fastapi" "uvicorn" "sqlalchemy" "pydantic" "alembic")
    for package in "${packages[@]}"; do
        if python -c "import $package" 2>/dev/null; then
            version=$(python -c "import $package; print(getattr($package, '__version__', 'unknown'))" 2>/dev/null)
            echo "✓ $package: $version"
        else
            echo "✗ $package 未安装或有问题"
        fi
    done
    
    deactivate
    cd ..
else
    echo "跳过包检查（虚拟环境不存在）"
fi

# 检查服务状态
echo ""
echo "=== 服务状态检查 ==="
services=("postgresql" "redis-server")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service 2>/dev/null; then
        echo "✓ $service 正在运行"
    else
        echo "✗ $service 未运行"
        echo "  解决方案: sudo systemctl start $service"
    fi
done

# 网络连接检查
echo ""
echo "=== 网络连接检查 ==="
if curl -s --connect-timeout 5 https://pypi.org >/dev/null; then
    echo "✓ PyPI 连接正常"
else
    echo "✗ PyPI 连接失败"
    echo "  尝试清华源: https://pypi.tuna.tsinghua.edu.cn/simple"
fi

# 提供修复建议
echo ""
echo "=== 修复建议 ==="
echo "如果发现问题，请按以下步骤修复："
echo ""
echo "1. 安装缺失的系统依赖:"
echo "   sudo apt update"
echo "   sudo apt install -y build-essential python3.12-dev libffi-dev libssl-dev"
echo ""
echo "2. 重新创建虚拟环境:"
echo "   cd backend"
echo "   rm -rf venv"
echo "   python3.12 -m venv venv"
echo "   source venv/bin/activate"
echo "   pip install --upgrade pip setuptools wheel"
echo ""
echo "3. 重新安装Python包:"
echo "   pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt"
echo ""
echo "4. 启动必要服务:"
echo "   sudo systemctl start postgresql redis-server"
echo ""
echo "5. 检查配置文件:"
echo "   确保 backend/.env 文件存在并配置正确"
echo ""
echo "如果问题仍然存在，请将此输出发送给技术支持。"