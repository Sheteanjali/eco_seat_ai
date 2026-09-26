@echo off
setlocal
cd /d "%~dp0"
title Eco-Seat AI Clean Start

echo This will remove backend\.venv and frontend\node_modules,
echo reinstall dependencies, and start the application.
echo.
choice /C YN /M "Continue"
if errorlevel 2 exit /b 0

if exist "backend\.venv" rmdir /s /q "backend\.venv"
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"
call "%~dp0START_APP.bat"
