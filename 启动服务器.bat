@echo off
echo ========================================
echo AI绘本工坊 - 本地服务器启动器
echo ========================================
echo.

echo 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Python，请先安装Python
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python环境正常

echo.
echo 检查requests库...
python -c "import requests" >nul 2>&1
if errorlevel 1 (
    echo 正在安装requests库...
    pip install requests
    if errorlevel 1 (
        echo ❌ requests库安装失败
        pause
        exit /b 1
    )
)

echo ✅ requests库已安装

echo.
echo 启动本地服务器...
echo 服务器将在 http://localhost:8000 启动
echo 调试工具: http://localhost:8000/debug-proxy.html
echo 主应用: http://localhost:8000/index.html
echo.
echo 按 Ctrl+C 停止服务器
echo.

python server.py

pause

