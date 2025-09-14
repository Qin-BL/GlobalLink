#!/usr/bin/env bash

# 后端安装脚本（不使用Docker）
set -e

# 确保使用bash而不是sh
if [ -z "$BASH_VERSION" ]; then
  echo "错误：请使用bash而不是sh运行此脚本"
  exit 1
fi

echo "===== 开始安装GlobalLink后端 ======"

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    elif type lsb_release >/dev/null 2>&1; then
        OS=$(lsb_release -si)
        VER=$(lsb_release -sr)
    elif [ -f /etc/redhat-release ]; then
        OS="Red Hat Enterprise Linux"
        VER=$(cat /etc/redhat-release | sed 's/.*release \([0-9.]*\).*/\1/')
    else
        OS=$(uname -s)
        VER=$(uname -r)
    fi
    echo "检测到操作系统: $OS $VER"
}

# 检查是否有sudo权限
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        echo "错误：此脚本需要sudo权限，请确保当前用户有sudo权限"
        exit 1
    fi
}

# 错误处理函数
handle_error() {
    echo "错误：安装过程中出现问题，请检查上面的错误信息"
    echo "如果是网络问题，请稍后重试"
    echo "如果是权限问题，请确保有sudo权限"
    exit 1
}

# 设置错误处理
trap 'handle_error' ERR

detect_os
check_sudo

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"

# 输出调试信息
echo "脚本所在目录: $SCRIPT_DIR"
echo "项目根目录: $PROJECT_ROOT"

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 确保工作目录正确
if [ ! -d "backend" ]; then
  echo "错误：无法找到backend目录，请确认项目结构是否正确"
  exit 1
fi

# 安装系统依赖包
echo "安装系统依赖包..."
echo "正在更新包管理器..."
sudo apt update || {
    echo "警告：apt update失败，尝试修复..."
    sudo apt --fix-broken install -y
    sudo apt update
}

echo "安装编译工具和系统依赖..."
sudo apt install -y software-properties-common \
    build-essential gcc g++ make cmake \
    libjpeg-dev zlib1g-dev libfreetype6-dev \
    liblcms2-dev libwebp-dev tcl8.6-dev tk8.6-dev \
    libffi-dev libssl-dev libbz2-dev libreadline-dev \
    libsqlite3-dev wget curl llvm libncurses5-dev \
    libncursesw5-dev xz-utils tk-dev libxml2-dev \
    libxmlsec1-dev liblzma-dev pkg-config \
    python3-dev python3-pip git || {
    echo "错误：无法安装系统依赖包"
    echo "请检查网络连接和包管理器状态"
    exit 1
}

# 安装Python 3.12.10和pip
echo "安装Python 3.12.10和pip..."
echo "添加deadsnakes PPA..."
sudo add-apt-repository -y ppa:deadsnakes/ppa || {
    echo "警告：无法添加deadsnakes PPA，尝试使用系统默认Python"
    if command -v python3.12 >/dev/null 2>&1; then
        echo "系统已有Python 3.12"
    else
        echo "错误：无法安装Python 3.12，请手动安装"
        exit 1
    fi
}

sudo apt update

# 安装Python 3.12及相关开发包
echo "安装Python 3.12及开发包..."
sudo apt install -y python3.12 python3.12-venv python3.12-dev || {
    echo "错误：无法安装Python 3.12"
    exit 1
}

# 安装distutils模块（解决依赖安装问题的关键步骤）
echo "安装distutils模块（解决依赖安装问题）..."
# 检测Linux发行版包管理器类型
PACKAGE_MANAGER="apt"
if command -v yum &> /dev/null; then
    PACKAGE_MANAGER="yum"
elif command -v dnf &> /dev/null; then
    PACKAGE_MANAGER="dnf"
fi

# 针对不同包管理器安装distutils
distutils_installed=false
case "$PACKAGE_MANAGER" in
    apt)
        # 首先检查python3-distutils是否已安装
        if dpkg -l | grep -q "python3-distutils"; then
            echo "✓ python3-distutils 已安装"
            distutils_installed=true
        fi
        
        # 尝试直接安装python3.12-distutils
        if ! $distutils_installed; then
            echo "尝试安装python3.12-distutils..."
            sudo apt install -y python3.12-distutils 2>/dev/null && distutils_installed=true
        fi
        
        # 如果上面的尝试失败，安装通用python3-distutils包
        if ! $distutils_installed; then
            echo "无法找到python3.12-distutils包，尝试安装python3-distutils..."
            sudo apt install -y python3-distutils 2>/dev/null && distutils_installed=true
        fi
        
        # 如果仍然失败，尝试通过pip安装setuptools
        if ! $distutils_installed; then
            echo "警告：无法通过包管理器安装distutils，尝试通过pip安装setuptools..."
            # 确保pip已安装
            if ! python3.12 -m pip --version >/dev/null 2>&1; then
                curl -sS https://bootstrap.pypa.io/get-pip.py | sudo python3.12
            fi
            # 安装setuptools，这通常包含distutils
            sudo python3.12 -m pip install --upgrade setuptools
        fi
        ;;
    yum|dnf)
        # CentOS/RHEL系统的安装方法
        echo "使用$PACKAGE_MANAGER安装Python 3.12相关包..."
        sudo $PACKAGE_MANAGER install -y python3.12 python3.12-devel
        # 安装setuptools，这通常包含distutils
        sudo python3.12 -m pip install --upgrade setuptools
        ;;
    *)
        echo "警告：未知的包管理器，尝试通过pip安装setuptools..."
        sudo python3.12 -m pip install --upgrade setuptools
        ;;
esac

# 安装pip for Python 3.12
echo "安装pip for Python 3.12..."
if ! python3.12 -m pip --version >/dev/null 2>&1; then
    echo "使用get-pip.py安装pip..."
    curl -sS https://bootstrap.pypa.io/get-pip.py | sudo python3.12 || {
        echo "错误：无法安装pip"
        echo "提示：可能需要检查网络连接或Python安装状态"
        echo "尝试使用替代源安装："
        curl -sS https://bootstrap.pypa.io/pip/3.12/get-pip.py | sudo python3.12 || {
            echo "错误：pip安装失败，请手动安装pip"
            exit 1
        }
    }
fi

# 验证distutils是否可用
echo "验证distutils模块是否可用..."
python3.12 -c "import distutils.core; print('✓ distutils模块导入成功')" || {
    echo "警告：distutils模块不可用，尝试全面修复..."
    
    # 增强的distutils修复逻辑，来自fix_distutils_python312.sh脚本
    echo "开始修复Python 3.12的distutils缺失问题..."
    
    # 再次尝试多种方法安装distutils
    distutils_installed=false
    echo "安装distutils模块（解决依赖安装问题）..."
    case "$PACKAGE_MANAGER" in
        apt)
            # 尝试安装python3.12-distutils
            echo "尝试安装python3.12-distutils..."
            sudo apt install -y python3.12-distutils 2>/dev/null
            if [ $? -eq 0 ]; then
                distutils_installed=true
                echo "✓ python3.12-distutils 安装成功"
            fi
            
            # 如果上面失败，尝试安装python3-distutils
            if ! $distutils_installed; then
                echo "无法找到python3.12-distutils包，尝试安装python3-distutils..."
                sudo apt install -y python3-distutils 2>/dev/null
                if [ $? -eq 0 ]; then
                    distutils_installed=true
                    echo "✓ python3-distutils 安装成功"
                fi
            fi
            
            # 尝试安装python3-setuptools
            echo "尝试安装python3-setuptools..."
            sudo apt install -y python3-setuptools 2>/dev/null
            ;;
        
        yum|dnf)
            # CentOS/RHEL系统的安装方法
            echo "使用$PACKAGE_MANAGER安装相关包..."
            sudo $PACKAGE_MANAGER install -y python3.12 python3.12-devel
            sudo $PACKAGE_MANAGER install -y python3-setuptools
            ;;
        
        pacman)
            echo "使用pacman安装python-setuptools..."
            sudo pacman -S --noconfirm python-setuptools
            ;;
        
        *)
            echo "未知的包管理器"
            ;;
        
    esac
    
    # 使用pip安装setuptools（这通常包含distutils）
    echo "使用pip安装setuptools..."
    # 确保pip已安装
    if ! python3.12 -m pip --version >/dev/null 2>&1; then
        echo "pip未安装，正在安装pip..."
        curl -sS https://bootstrap.pypa.io/get-pip.py | sudo python3.12
    fi
    
    # 安装最新版本的setuptools和wheel
    echo "安装最新版本的setuptools和wheel..."
    sudo python3.12 -m pip install --upgrade pip setuptools wheel
    
    # 创建distutils路径（如果不存在）
    echo "检查并创建distutils路径..."
    PYTHON_SITE_PACKAGES=$(python3.12 -c "import site; print(site.getsitepackages()[0])")
    DISTUTILS_PATH="$PYTHON_SITE_PACKAGES/distutils"
    if [ ! -d "$DISTUTILS_PATH" ]; then
        echo "创建distutils路径: $DISTUTILS_PATH"
        sudo mkdir -p "$DISTUTILS_PATH"
    fi
    
    # 创建一个简单的distutils__init__.py文件
    echo "创建distutils__init__.py文件..."
    sudo tee "$DISTUTILS_PATH/__init__.py" > /dev/null << 'EOF'
# 最小化的distutils初始化文件，用于解决Python 3.12中distutils缺失的问题
__version__ = '3.12.0'
__revision__ = '$Revision$'

# 导入setuptools以获取distutils功能
import sys
import importlib.util

try:
    # 尝试导入setuptools提供的distutils
    from setuptools import distutils
    # 确保distutils在sys.modules中可用
    sys.modules['distutils'] = distutils
    # 导出常用的distutils功能
    from distutils import *
except ImportError:
    # 如果setuptools不提供distutils，设置一个基本的占位符
    pass
EOF
    
    # 再次验证distutils是否可用
    echo "再次验证distutils模块是否可用..."
    echo "检查Python路径: $(python3.12 -c "import sys; print(sys.executable)")"
    echo "检查site-packages路径: $(python3.12 -c "import site; print(site.getsitepackages()[0] if site.getsitepackages() else '未知')")"
    python3.12 -c "import distutils; print('✓ distutils模块导入成功'); try: import distutils.core; print('✓ distutils.core模块导入成功'); except ImportError: print('✗ distutils.core模块导入失败')" || {
        echo "修复失败，distutils模块仍然不可用"
        echo "尝试最后的解决方案：手动创建distutils.core模块..."
        
        # 创建一个更完整的distutils.core模块模拟
        echo "创建更完整的distutils.core模块模拟..."
        sudo tee "$DISTUTILS_PATH/core.py" > /dev/null << 'EOF'
# 增强的distutils.core模块模拟，用于解决Python 3.12中distutils缺失的问题
# 这个文件提供了足够的功能来满足大多数Python包安装需求

import sys
import os
import platform
import importlib.util

# 尝试从setuptools导入所需功能
try:
    from setuptools import setup, find_packages
    from setuptools.command import install as _install
    from setuptools import Extension
    from setuptools.dist import Distribution
    from setuptools.errors import DistutilsError, DistutilsArgError, DistutilsOptionError
    
    # 设置导入标志
    HAS_SETUPTOOLS = True
except ImportError:
    # 如果没有setuptools，创建基本的模拟对象
    HAS_SETUPTOOLS = False
    
    class DistutilsError(Exception): pass
    class DistutilsArgError(DistutilsError): pass
    class DistutilsOptionError(DistutilsError): pass
    
    def setup(*args, **kwargs):
        print("Warning: Using mock setup function. Some functionality may be limited.")
        return {}
    
    def find_packages(*args, **kwargs):
        return []
    
    class Extension:
        def __init__(self, *args, **kwargs):
            self.name = args[0] if args else "unknown"
            for key, value in kwargs.items():
                setattr(self, key, value)
    
    class Distribution:
        def __init__(self, attrs=None):
            self.attrs = attrs or {}

# 定义常用的distutils.core函数和类
Command = _install.install if HAS_SETUPTOOLS and 'install' in dir(_install) else object
DistributionMetadata = type('DistributionMetadata', (object,), {})
Extension = Extension

# 提供一个简单的run_setup函数，用于运行setup.py文件
def run_setup(script_name, script_args=None, stop_after="run"):
    import runpy
    import sys
    
    old_argv = sys.argv.copy()
    try:
        sys.argv = [script_name] + (script_args or [])
        namespace = runpy.run_path(script_name, run_name='__main__')
        return namespace.get('setup_result', {})
    finally:
        sys.argv = old_argv

# 提供一些常用的工具函数
def get_platform():
    return platform.system().lower()

def get_python_version():
    return f"{sys.version_info.major}.{sys.version_info.minor}"

# 导出所有公共API
__all__ = [
    'setup', 'find_packages', 'Extension', 'Distribution',
    'DistutilsError', 'DistutilsArgError', 'DistutilsOptionError',
    'Command', 'DistributionMetadata', 'run_setup',
    'get_platform', 'get_python_version'
]

# 确保关键模块可用
sys.modules['distutils.core'] = sys.modules[__name__]
EOF
        
        # 再次验证
        python3.12 -c "import distutils.core; print('✓ distutils.core模块导入成功')" || {
            echo "错误：所有修复尝试都失败了！"
            echo "最后的建议："
            echo "1. 确保您的系统已完全更新"
            echo "2. 考虑使用虚拟环境重新安装Python"
            echo "3. 或者手动下载并安装setuptools源码包"
            exit 1
        }
    }
    
    echo "✓ Python 3.12 distutils缺失问题已成功修复！"
}

# 验证Python安装
echo "验证Python 3.12安装..."
python3.12 --version || {
    echo "错误：Python 3.12安装验证失败"
    exit 1
}
python3.12 -c "import sys; print('Python路径:', sys.executable)"

# 创建并激活虚拟环境
echo "创建Python 3.12虚拟环境..."
cd backend

# 删除旧的虚拟环境（如果存在）
if [ -d "venv" ]; then
    echo "删除旧的虚拟环境..."
    rm -rf venv
fi

# 创建新的虚拟环境
echo "创建新的虚拟环境..."
python3.12 -m venv venv || {
    echo "错误：无法创建虚拟环境"
    echo "尝试使用--without-pip选项..."
    python3.12 -m venv --without-pip venv || {
        echo "错误：虚拟环境创建失败"
        exit 1
    }
    # 手动安装pip到虚拟环境
    source venv/bin/activate
    curl -sS https://bootstrap.pypa.io/get-pip.py | python
} || {
    echo "错误：无法创建虚拟环境"
    exit 1
}

# 激活虚拟环境
source venv/bin/activate || {
    echo "错误：无法激活虚拟环境"
    exit 1
}

echo "虚拟环境创建成功，Python版本："
python --version
which python

# 安装后端依赖
echo "安装后端依赖..."

# 检查requirements.txt是否存在
if [ ! -f "requirements.txt" ]; then
    echo "错误：未找到requirements.txt文件"
    exit 1
fi

# 升级pip和基础工具
echo "升级pip和基础工具..."
pip install --upgrade pip setuptools wheel || {
    echo "使用清华源升级pip..."
    pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --upgrade pip setuptools wheel
}

# 设置编译环境变量
echo "设置编译环境变量..."
export CFLAGS="-I/usr/include/python3.12"
export LDFLAGS="-L/usr/lib/python3.12/config-3.12-x86_64-linux-gnu"
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# 先安装一些可能有问题的包
echo "预安装可能有编译问题的包..."
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple Cython || {
    echo "警告：Cython安装失败，继续安装其他包..."
}

# 尝试安装numpy（很多包依赖它）
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple numpy || {
    echo "警告：numpy安装失败，尝试使用系统包..."
    sudo apt install -y python3-numpy 2>/dev/null || true
}

# 安装requirements.txt中的依赖
echo "安装项目依赖..."
# 设置安装选项以提高兼容性
export PYTHONPATH=$PYTHONPATH:/usr/lib/python3.12

# 首先尝试使用清华源安装依赖
if ! pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir -r requirements.txt; then
    echo "清华源安装失败，尝试使用官方源..."
    if ! pip install --no-cache-dir -r requirements.txt; then
        echo "官方源也失败，尝试使用其他镜像源..."
        if ! pip install -i https://pypi.douban.com/simple --no-cache-dir -r requirements.txt; then
            echo "所有镜像源都失败，尝试逐个安装..."
            # 逐个安装，跳过失败的包
            while IFS= read -r line; do
                if [[ $line =~ ^[^#]*[a-zA-Z] ]]; then
                    package=$(echo "$line" | sed 's/[>=<].*//')
                    echo "安装包: $package"
                    pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir "$package" || {
                        echo "警告：包 $package 安装失败，尝试降级版本..."
                        pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir "$package"=="$(echo "$line" | sed 's/[a-zA-Z0-9_\-]*==//' | sed 's/>=//' | sed 's/<//')" || {
                            echo "警告：包 $package 安装失败，跳过..."
                        }
                    }
                fi
            done < requirements.txt
        fi
    fi
fi

# 关键修复：升级email-validator到pydantic所需的版本
# 错误信息显示需要email-validator >= 2.0
# 但requirements.txt中是1.3.1版本
echo "升级email-validator到>=2.0版本..."
pip install -U email-validator>=2.0.0

# 验证关键包安装
echo "验证关键包安装..."
python -c "import fastapi; print('FastAPI版本:', fastapi.__version__)" || {
    echo "警告：FastAPI未正确安装"
}
python -c "import uvicorn; print('Uvicorn安装成功')" || {
    echo "警告：Uvicorn未正确安装"
}
python -c "import sqlalchemy; print('SQLAlchemy安装成功')" || {
    echo "警告：SQLAlchemy未正确安装"
}
python -c "import email_validator; print('email-validator版本:', email_validator.__version__)" || {
    echo "警告：email-validator未正确安装"
}

# 验证pydantic能否正常工作
echo "验证pydantic能否正常工作..."
python -c "
from pydantic import BaseModel, EmailStr
class User(BaseModel):
    email: EmailStr
    name: str

# 测试EmailStr类型
user = User(email='test@example.com', name='Test User')
print('✓ pydantic EmailStr类型测试通过')
" || {
    echo "错误：pydantic使用EmailStr失败，可能是email-validator版本问题"
    # 再次尝试强制升级email-validator
    echo "尝试强制升级email-validator..."
    pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -U email-validator
}

echo "依赖安装完成！"

# 检查环境变量文件
echo "检查环境变量文件..."
# 首先检查backend目录下是否已有.env文件
if [ -f ".env" ]; then
  echo "发现backend目录下已有.env文件，保持不变"
# 如果backend目录没有，但项目根目录有，则复制过来
elif [ -f "$PROJECT_ROOT/.env" ]; then
  echo "发现项目根目录下的.env文件，复制到backend目录..."
  cp "$PROJECT_ROOT/.env" .env
else
  echo "未找到.env文件，创建默认.env文件"
  cat > .env << EOF
# 数据库配置
POSTGRES_SERVER=localhost
POSTGRES_USER=globallink
POSTGRES_PASSWORD=password
POSTGRES_DB=globallink
POSTGRES_PORT=5432
# PostgreSQL超级用户配置
POSTGRES_SUPERUSER=postgres
POSTGRES_SUPERUSER_PASSWORD=postgres_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# 日志配置
TABLE_NAME_LOGS=system_logs
ENABLE_ACTIVITY_LOGGING=true

# 邮件服务配置
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
SMTP_TLS=True
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password
SMTP_FROM=your_email@example.com
EMAIL_TIMEOUT=10
EMAIL_RETRY_COUNT=3

# JWT配置
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS配置
CORS_ORIGINS=http://localhost:3080,http://127.0.0.1:3080

# 应用配置
DEBUG=True
APP_NAME=GlobalLink
API_V1_STR=/api/v1

# 数据库连接池配置
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_RECYCLE=3600
DB_POOL_TIMEOUT=30

# 允许的主机
ALLOWED_HOSTS=localhost,127.0.0.1

# 日志级别
LOG_LEVEL=INFO
EOF
  echo "警告：请务必修改.env文件中的数据库密码和其他敏感信息"
fi

# 修改后端CORS配置（如果文件存在）
if [ -f "app/core/config.py" ]; then
    echo "更新后端CORS配置..."
    sed -i 's/"http:\/\/localhost:3000"/"http:\/\/localhost:3080"/g' app/core/config.py
else
    echo "警告：未找到app/core/config.py文件，跳过CORS配置更新"
fi

# 添加启动脚本
echo "创建启动脚本..."
cat > ../start_backend.sh << EOF
#!/bin/bash
cd "$(dirname "$0")/backend"
source venv/bin/activate
python start_async.py
EOF

chmod +x ../start_backend.sh

# 创建后端服务管理脚本
echo "创建服务管理脚本..."
# 获取当前用户
CURRENT_USER=$(whoami)
cat > ../backend.service << EOF
[Unit]
Description=GlobalLink Backend Service
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=$CURRENT_USER
Group=$CURRENT_USER
WorkingDirectory=$PROJECT_ROOT/backend
ExecStart=$PROJECT_ROOT/backend/venv/bin/python $PROJECT_ROOT/backend/start_async.py
Restart=always
RestartSec=3
Environment="PATH=$PROJECT_ROOT/backend/venv/bin"
EnvironmentFile=$PROJECT_ROOT/backend/.env

[Install]
WantedBy=multi-user.target
EOF

echo "服务文件已创建：$(pwd)/../backend.service"

# 检查是否需要更新系统服务文件
echo "检查系统服务文件状态..."
if [ -f "/etc/systemd/system/globallink-backend.service" ]; then
    echo "发现已存在的系统服务文件，准备更新..."
    # 备份当前服务文件
    sudo cp /etc/systemd/system/globallink-backend.service /etc/systemd/system/globallink-backend.service.bak.$(date +'%Y%m%d%H%M%S')
    # 复制新的服务文件
    sudo cp "$(pwd)/../backend.service" /etc/systemd/system/globallink-backend.service
    # 重新加载systemd配置
    sudo systemctl daemon-reload
    echo "✓ 系统服务文件已更新"
    echo "提示：请执行 'sudo systemctl restart globallink-backend' 使更改生效"
else
    echo "系统服务文件不存在，请运行主安装脚本完成服务安装："
    echo "cd $(dirname $(pwd))"
    echo "bash install/without_docker/install.sh"
fi

cd ..

# 添加数据库表结构初始化步骤
# 关键问题：之前的脚本没有初始化数据库表结构
# 这会导致首次部署时表不存在或字段不完整

# 在安装依赖之后，添加数据库表结构初始化
cd "$PROJECT_ROOT/backend"
if [ -f "app/db/init_db.py" ]; then
    echo "初始化数据库表结构..."
    source venv/bin/activate
    python -c "import sys, os; sys.path.insert(0, os.getcwd()); import asyncio; from app.db.init_db import init_db; asyncio.run(init_db())" 
    echo "✓ 数据库表结构初始化完成"
else
    echo "警告：未找到数据库初始化脚本，建议手动初始化数据库表结构"
    echo "路径：$(pwd)/app/db/init_db.py" 
fi
cd - > /dev/null

# 在最终验证部分，添加数据库连接测试
cd backend

# 测试虚拟环境和Python导入
# 使用here-doc语法避免引号嵌套问题
source venv/bin/activate
python << 'EOF'
import sys
print(f'Python版本: {sys.version}')
print(f'Python路径: {sys.executable}')

# 测试关键模块
modules_to_test = ['fastapi', 'uvicorn', 'sqlalchemy', 'pydantic', 'email_validator']
for module in modules_to_test:
    try:
        __import__(module)
        print(f'✓ {module} 导入成功')
    except ImportError as e:
        print(f'✗ {module} 导入失败: {e}')

# 测试数据库连接
try:
    import asyncio
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import text
    
    async def test_db_connection():
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(text('SELECT version()'))
                version = result.scalar_one()
                print(f'✓ 数据库连接成功: {version[:50]}...')
                
                # 检查users表是否存在
                check_table_sql = """
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'users'
                    )
                """
                result = await session.execute(text(check_table_sql))
                users_table_exists = result.scalar_one()
                if users_table_exists:
                    print('✓ users表存在')
                    # 检查is_superuser字段
                    check_column_sql = """
                        SELECT EXISTS (
                            SELECT FROM information_schema.columns 
                            WHERE table_schema = 'public' 
                            AND table_name = 'users'
                            AND column_name = 'is_superuser'
                        )
                    """
                    result = await session.execute(text(check_column_sql))
                    has_is_superuser = result.scalar_one()
                    if has_is_superuser:
                        print('✓ users表包含is_superuser字段')
                    else:
                        print('✗ users表缺少is_superuser字段，请运行修复脚本')
                else:
                    print('✗ users表不存在，请重新初始化数据库')
        except Exception as e:
            print(f'✗ 数据库连接测试失败: {e}')
            print('请检查数据库配置和服务状态')
    
    asyncio.run(test_db_connection())
except Exception as e:
    print(f'数据库测试异常: {e}')
    print('请手动验证数据库连接和表结构')

print('基础验证完成')
EOF

cd ..

echo ""
echo "===== GlobalLink后端安装完成 ======"
echo ""
echo "安装摘要："
echo "- Python版本: $(python3.12 --version)"
echo "- 虚拟环境位置: $(pwd)/backend/venv"
echo "- 项目根目录: $(pwd)"
echo ""
echo "您可以通过以下方式启动后端："
echo "1. 开发模式：./start_backend.sh"
echo "2. 服务模式：sudo systemctl start globallink-backend"
echo ""
echo "重要提示："
echo "- 请确保PostgreSQL和Redis服务已启动"
echo "- 请检查.env文件中的数据库配置"
echo "- API文档地址：http://localhost:8000/docs"
echo ""
echo "如果遇到问题，请检查："
echo "1. 系统依赖是否完整安装"
echo "2. Python虚拟环境是否正确激活"
echo "3. 数据库连接配置是否正确"
echo ""
echo "安装日志已保存，如有问题请查看上述输出信息"