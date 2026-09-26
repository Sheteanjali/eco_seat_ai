# Eco-Seat AI — Windows Run Guide

## 1) Backend (PowerShell)
Open PowerShell in the extracted project folder, then run:

```powershell
cd backend
py -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload
```

Important: the activation command starts with `.` followed by `\` — do NOT type a leading backslash.

If `.venv` was created during a failed install, delete and recreate it:

```powershell
Deactivate 2>$null
Remove-Item -Recurse -Force .venv
py -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
```

Backend: http://127.0.0.1:8765
Swagger: http://127.0.0.1:8765/docs

## 2) Frontend (second PowerShell)
From the project root:

```powershell
cd frontend
npm install
npm start
```

Frontend: http://localhost:3000

## Demo accounts
- Admin: `admin` / `admin123`
- Invigilator: `inv2026` / `inv12345`
- Student: `RBU2026001` / branch `CSE`
