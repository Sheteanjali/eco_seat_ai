@echo off
setlocal
cd /d "%~dp0frontend"
title Eco-Seat AI Frontend

echo ========================================
echo          ECO-SEAT AI FRONTEND
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Install Node.js LTS first.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1/2] Installing frontend dependencies...
  call npm install
  if errorlevel 1 goto :fail
) else (
  echo [1/2] node_modules already exists.
)

echo.
echo [2/2] Starting React app...
echo Frontend: http://localhost:3000
echo.
call npm start
if errorlevel 1 goto :fail
exit /b 0

:fail
echo.
echo ========================================
echo FRONTEND FAILED. Read the error above.
echo ========================================
pause
exit /b 1
