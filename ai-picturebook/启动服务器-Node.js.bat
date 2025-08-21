@echo off
echo ========================================
echo AI绘本工坊 - Node.js本地服务器启动器
echo ========================================
echo.

echo 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js环境正常

echo.
echo 启动本地服务器...
echo 服务器将在 http://localhost:8000 启动
echo 调试工具: http://localhost:8000/debug-proxy.html
echo 主应用: http://localhost:8000/index.html
echo.
echo 按 Ctrl+C 停止服务器
echo.

node server.js

pause
