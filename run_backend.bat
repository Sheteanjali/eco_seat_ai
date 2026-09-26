@echo off
setlocal
cd /d "%~dp0backend"
title Eco-Seat AI Backend

echo ========================================
echo          ECO-SEAT AI BACKEND
echo ========================================
echo.

if not exist ".venv\Scripts\python.exe" (
  echo [1/3] Creating Python virtual environment...
  where py >nul 2>&1
  if not errorlevel 1 (
    py -m venv .venv
  ) else (
    python -m venv .venv
  )
  if errorlevel 1 goto :fail
) else (
  echo [1/3] Virtual environment already exists.
)

echo [2/3] Installing backend dependencies...
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto :fail

echo.
echo [3/3] Starting FastAPI on safe development port 8765...
echo Swagger: http://127.0.0.1:8765/docs
echo.
".venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload
if errorlevel 1 goto :fail
exit /b 0

:fail
echo.
echo ========================================
echo BACKEND FAILED. Read the error above.
echo ========================================
pause
exit /b 1
