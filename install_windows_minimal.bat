@echo on
chcp 65001

echo 开始创建启动脚本start.bat...

echo @echo off > start.bat
echo echo 启动GlobalLink服务... >> start.bat
echo cd /d "%~dp0" >> start.bat
echo start "GlobalLink" cmd /k "node server.js" >> start.bat
echo echo 服务已启动，请保持此窗口打开。 >> start.bat

echo 启动脚本start.bat创建成功！

echo 安装完成。
pause