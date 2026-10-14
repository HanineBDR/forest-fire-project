#!/bin/bash
echo "==================================================="
echo "  IN9AD (إنقاذ) - Wildfire Prediction System"
echo "  Launching Backend (FastAPI) and Frontend (Next.js)"
echo "==================================================="

# Start Backend
echo "[1/2] Starting Backend Server..."
(cd backend && source venv/bin/activate && python data/train_model.py && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000) &
BACKEND_PID=$!

sleep 3

# Start Frontend
echo "[2/2] Starting Frontend Server..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Frontend: http://localhost:3000"
echo "Backend:  http://127.0.0.1:8000/docs"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
