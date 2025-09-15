# GlobalLink 前端构建指南

本指南将帮助您正确构建 GlobalLink 前端应用，避免在错误的目录下执行构建命令。

## 问题说明

如果您在运行 `npm run build` 命令时遇到以下错误：

```
npm error code ENOENT
npm error syscall open
npm error path /path/to/GlobalLink/package.json
npm error errno -2
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/path/to/GlobalLink/package.json'
```

这意味着您在错误的目录下执行了构建命令。正确的构建命令应该在 `frontend` 目录中执行，因为 `package.json` 文件位于该目录下。

## 解决方案

我们提供了两个脚本来简化前端构建过程：

### Windows 系统

1. 在 Windows 系统上，您可以直接双击运行 `build_frontend.bat` 文件
2. 或者在命令提示符中执行：
   ```
   build_frontend.bat
   ```

### Linux/Mac 系统

1. 在 Linux 或 Mac 系统上，首先需要为脚本添加执行权限：
   ```
   chmod +x build_frontend.sh
   ```
2. 然后执行脚本：
   ```
   ./build_frontend.sh
   ```

## 脚本功能

这些脚本会自动：

1. 检查当前目录是否为正确的项目根目录
2. 切换到 `frontend` 目录
3. 检查 `package.json` 文件是否存在
4. 检查 npm 是否已安装
5. 安装前端依赖
6. 构建前端应用

## 手动构建步骤

如果您希望手动执行构建步骤，可以按照以下方式操作：

1. 切换到 frontend 目录：
   ```
   cd frontend
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 构建应用：
   ```
   npm run build
   ```

## 构建结果

构建成功后，生成的静态文件将位于 `frontend/build` 目录中，可以部署到 Web 服务器上。

## 注意事项

- 请确保您已经安装了 Node.js 和 npm
- 构建过程可能需要一些时间，具体取决于您的网络速度和计算机性能
- 如果遇到任何问题，请检查错误信息并尝试解决，或者联系技术支持