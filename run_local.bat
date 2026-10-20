@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   IN9AD (إنقاذ) - Wildfire Prediction System
echo   National Forest Fire Early Warning & Propagation
echo ===================================================

cd /d "%~dp0"

:: 1. Ensure Environment Files Exist
if not exist "backend\.env" (
    echo [Setup] Initializing backend\.env from .env.example...
    copy "backend\.env.example" "backend\.env" >nul
)
if not exist "frontend\.env" (
    echo [Setup] Initializing frontend\.env from .env.example...
    copy "frontend\.env.example" "frontend\.env" >nul
)

:: 2. Ensure Backend Python Virtual Environment Exists
if not exist "backend\venv\Scripts\activate.bat" (
    echo [Setup] Creating Python virtual environment in backend\venv...
    python -m venv backend\venv
    echo [Setup] Installing backend dependencies...
    backend\venv\Scripts\python -m pip install --upgrade pip
    backend\venv\Scripts\pip install -r backend\requirements.txt
)

:: 3. Ensure XGBoost Model Artifact Exists
if not exist "backend\models\fire_xgboost_model.json" (
    echo [Setup] Training calibrated XGBoost model artifact...
    backend\venv\Scripts\python backend\data\train_model.py
)

:: 4. Ensure Frontend Dependencies are Installed
if not exist "frontend\node_modules" (
    echo [Setup] Installing frontend npm packages...
    cd frontend && call npm install && cd ..
)

echo.
echo ===================================================
echo [1/2] Launching Backend Server on port 8000...
start "IN9AD Backend (FastAPI)" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend Server on port 3000...
start "IN9AD Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching!
echo Frontend: http://localhost:3000
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ===================================================
pause
