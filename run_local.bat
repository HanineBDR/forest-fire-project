@echo off
echo ===================================================
echo   IN9AD (إنقاذ) - Wildfire Prediction System
echo   Launching Backend (FastAPI) and Frontend (Next.js)
echo ===================================================

echo [1/2] Starting Backend Server on port 8000...
start "IN9AD Backend (FastAPI)" cmd /k "cd backend && call venv\Scripts\activate && python data\train_model.py && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server on port 3000...
start "IN9AD Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching!
echo Frontend will be accessible at: http://localhost:3000
echo Backend API Docs at: http://127.0.0.1:8000/docs
echo ===================================================
pause
