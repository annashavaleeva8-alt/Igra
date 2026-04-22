@echo off
chcp 65001 >nul
cd /d "%~dp0"
cls
echo ============================================
echo   Просмотр игры с телефона (одна Wi-Fi)
echo ============================================
echo.
echo 1. На ПК: Win+R, введите cmd, затем ipconfig
echo    Найдите IPv4-адрес (например 192.168.0.15)
echo.
echo 2. На телефоне в той же Wi-Fi откройте браузер:
echo    http://ВАШ_IPv4:8080
echo.
echo Сервер остановить: Ctrl+C
echo ============================================
echo.
python -m http.server 8080
if errorlevel 1 (
  echo.
  echo Не удалось запустить Python.
  echo Установите Python с https://www.python.org/downloads/
  echo либо в этой папке в PowerShell выполните:
  echo   npx --yes serve -l 8080
  echo.
  pause
)
