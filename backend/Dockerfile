# 使用Python 3.11官方镜像
FROM python:3.12.10-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 确保distutils模块可用
RUN python -c "import distutils.core; print('✓ distutils模块导入成功')" || \
    (echo '警告：distutils模块不可用，尝试安装...' && \
    apt-get update && \
    apt-get install -y python3-distutils && \
    python -c "import distutils.core; print('✓ distutils模块安装成功')")

# 复制requirements文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    # 设置PYTHONPATH以提高兼容性
    export PYTHONPATH=$PYTHONPATH:/usr/lib/python3.12 && \
    # 预安装可能有编译问题的包
    pip install --no-cache-dir Cython numpy && \
    # 安装项目依赖
    pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建静态文件目录
RUN mkdir -p /app/static

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["python", "start_async.py"]