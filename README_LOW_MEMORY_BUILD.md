# GlobalLink前端低内存环境构建指南

## 问题描述
在1核2G等资源受限的Linux测试机器上运行`npm run build`时，经常会遇到构建过程被系统杀死的情况。这通常是由于Node.js构建过程中消耗了过多内存，导致系统的OOM（Out Of Memory）杀手介入并终止进程。

## 解决方案

### 方案一：使用优化构建脚本（推荐）
项目根目录下已提供了专门针对低内存环境的优化构建脚本：`build_frontend_low_memory.sh`

#### 使用方法
1. 登录到Linux测试机器
2. 进入项目根目录
3. 运行以下命令：
   ```bash
   chmod +x build_frontend_low_memory.sh
   ./build_frontend_low_memory.sh
   ```

#### 脚本优化措施
该脚本集成了多项内存优化策略：
- 限制Node.js内存使用上限为1024MB
- 启用Node.js大小优化模式
- 调整V8引擎半空间大小
- 清理npm缓存减少内存占用
- 使用`--prefer-offline`和`--no-audit`参数优化依赖安装

### 方案二：手动设置内存限制
如果您希望直接使用npm命令，可以通过以下方式限制内存：

```bash
cd frontend
NODE_OPTIONS="--max-old-space-size=1024" npm run build
```

### 方案三：增加系统Swap空间
对于1核2G的机器，增加Swap空间是最有效的长期解决方案：

```bash
# 创建2GB的Swap文件
sudo fallocate -l 2G /swapfile

sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 设置Swap文件开机自动挂载
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 方案四：使用更轻量级的构建工具
如果上述方法仍无法解决问题，可以考虑替换构建工具：

1. 安装Vite构建工具：
   ```bash
   npm install vite @vitejs/plugin-react --save-dev
   ```

2. 创建`vite.config.js`文件：
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
     server: {
       port: 3080
     },
     build: {
       minify: 'terser',
       chunkSizeWarningLimit: 1000
     }
   })
   ```

3. 修改`package.json`中的scripts：
   ```json
   "scripts": {
     "start": "vite",
     "build": "vite build",
     "preview": "vite preview"
   }
   ```

## 技术原理说明

### 内存限制参数解析

- `--max-old-space-size=1024`：限制Node.js的堆内存大小为1024MB
- `--optimize-for-size`：让V8引擎优先优化代码大小而不是执行速度
- `--max-semi-space-size=256`：调整新生代内存区域的大小

### 构建过程的内存消耗点

1. **依赖安装阶段**：下载和解析大量npm包
2. **代码转译阶段**：将JSX、ES6+等代码转换为浏览器兼容的代码
3. **代码打包阶段**：合并和优化代码文件
4. **代码压缩阶段**：通过terser等工具压缩代码

## 监控构建过程

在低配置机器上，可以使用`htop`命令监控构建过程中的资源使用情况：

```bash
# 安装htop
sudo apt-get install htop -y

# 打开新终端监控资源使用
htop
```

## 持续集成优化建议

如果您在CI/CD环境中遇到此问题，可以考虑：

1. **使用缓存**：缓存node_modules和构建输出
2. **增量构建**：只重新构建已更改的文件
3. **分布式构建**：将构建任务分散到多台机器

## 常见问题排查

1. **构建仍然失败**：尝试进一步降低内存限制（如`--max-old-space-size=768`）
2. **Swap空间不足**：增加Swap文件大小到3GB或4GB
3. **CPU使用率过高**：使用`nice`命令降低构建进程优先级

## 注意事项

- 低内存环境下的构建时间会比高配置环境长
- 优化后的构建产物大小可能与标准构建略有不同
- 对于生产环境，建议在配置更高的机器上构建后再部署

希望本指南能帮助您在资源受限的环境中成功构建GlobalLink前端项目！如有其他问题，请联系技术支持。