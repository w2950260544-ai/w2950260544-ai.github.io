@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Andy's Blog - 一键发布数据观察 PPT
echo ============================================
echo.
if "%~1"=="" (
    echo [模式] 自动选择最新 PPT
    python tools\publish.py
) else (
    echo [模式] 发布拖入的文件：%~nx1
    python tools\publish.py "%~1"
)
echo.
echo ============================================
echo   完成。窗口可关闭。
echo ============================================
pause
