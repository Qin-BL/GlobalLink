# GlobalLink后端依赖修复指南（Ubuntu系统）

## 问题概述
后端服务启动失败的主要原因是依赖冲突：
- `fastapi==0.95.1` 依赖 `pydantic<2.0.0`
- `pydantic-settings==2.0.3` 依赖 `pydantic>=2.0.1`

## 解决方案
我们提供了一个自动化修复脚本 `fix_backend_dependency.sh`，适用于Ubuntu系统。

## 使用步骤
1. 登录到Ubuntu服务器
2. 将 `fix_backend_dependency.sh` 上传到服务器上的项目根目录
3. 打开终端，导航到项目根目录
4. 为脚本添加执行权限：
   ```bash
   chmod +x fix_backend_dependency.sh
   ```
5. 修改脚本中的项目路径：
   ```bash
   nano fix_backend_dependency.sh
   ```
   将 `projectRoot="/path/to/GlobalLink"` 修改为实际项目路径
6. 以root身份运行脚本：
   ```bash
   sudo ./fix_backend_dependency.sh
   ```
7. 按照脚本提示操作，激活虚拟环境并完成修复

## 手动修复步骤（可选）
如果脚本执行失败，可以尝试手动修复：

1. 移除冲突依赖：
   ```bash
   sed -i '/pydantic-settings==[0-9.]*/d' backend/requirements.txt
   ```

2. 确保pydantic版本与fastapi兼容：
   ```bash
   sed -i '/pydantic==[0-9.]*/d' backend/requirements.txt
   echo "pydantic==1.10.12" >> backend/requirements.txt
   ```

3. 修复config.py文件中的导入：
   ```bash
   sed -i 's/from pydantic_settings import BaseSettings/from pydantic import BaseSettings/g' backend/app/core/config.py
   ```

4. 安装依赖：
   ```bash
   cd backend
   pip install --no-cache-dir -r requirements.txt
   ```

5. 启动后端服务：
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## 验证服务
修复完成后，访问 `http://localhost:8000/docs` 验证服务是否正常运行。