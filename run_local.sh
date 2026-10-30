#!/bin/bash
set -e

echo "==================================================="
echo "  INKAD (إنقاذ) - Wildfire Prediction System"
echo "  National Forest Fire Early Warning & Propagation"
echo "==================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Environment files
if [ ! -f "backend/.env" ]; then
    echo "[Setup] Initializing backend/.env..."
    cp backend/.env.example backend/.env
fi
if [ ! -f "frontend/.env" ]; then
    echo "[Setup] Initializing frontend/.env..."
    cp frontend/.env.example frontend/.env
fi

# 2. Backend virtual environment
if [ ! -d "backend/venv" ]; then
    echo "[Setup] Creating Python virtual environment in backend/venv..."
    python3 -m venv backend/venv || python -m venv backend/venv
    echo "[Setup] Installing backend dependencies..."
    backend/venv/bin/pip install --upgrade pip
    backend/venv/bin/pip install -r backend/requirements.txt
fi

# 3. Model artifact
if [ ! -f "backend/models/fire_xgboost_model.json" ]; then
    echo "[Setup] Training calibrated XGBoost model artifact..."
    backend/venv/bin/python backend/data/train_model.py
fi

# 4. Frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "[Setup] Installing frontend npm packages..."
    (cd frontend && npm install)
fi

echo "==================================================="
echo "[1/2] Starting Backend Server on port 8000..."
(cd backend && source venv/bin/activate && uvicorn app.main:app --reload --reload-dir app --reload-exclude "*.db" --reload-exclude "*.db-*" --reload-exclude "ml/outputs/*" --host 127.0.0.1 --port 8000) &
BACKEND_PID=$!

sleep 3

echo "[2/2] Starting Frontend Server on port 3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Servers running:"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://127.0.0.1:8000/docs"
echo "==================================================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
