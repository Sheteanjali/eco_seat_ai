@echo off
setlocal
cd /d "%~dp0"
title Eco-Seat AI Launcher

echo ========================================
echo          ECO-SEAT AI LAUNCHER
echo ========================================
echo.

where py >nul 2>&1
if errorlevel 1 (
  where python >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] Python was not found. Install Python and enable Add Python to PATH.
    pause
    exit /b 1
  )
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Install Node.js LTS first.
  pause
  exit /b 1
)

echo Starting backend setup/window...
start "Eco-Seat AI Backend" cmd /k call "%~dp0run_backend.bat"

echo Waiting 5 seconds before frontend...
timeout /t 5 /nobreak >nul
start "Eco-Seat AI Frontend" cmd /k call "%~dp0run_frontend.bat"

echo.
echo Backend:  http://127.0.0.1:8765/docs
echo Frontend: http://localhost:3000
echo.
echo Two command windows have been opened. Keep them open while using the app.
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"
exit /b 0
