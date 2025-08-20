@echo off
chcp 65001

echo 创建start.bat文件...

( echo @echo off
  echo echo 启动GlobalLink服务...
  echo cd /d "%~dp0"
  echo start "GlobalLink" cmd /k "node server.js"
  echo echo 服务已启动，请保持此窗口打开。
) > start.bat

echo start.bat文件创建完成！
pause