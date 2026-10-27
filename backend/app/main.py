"""
IN9AD Backend - Main Application Proxy
Routes all requests to the comprehensive backend/main.py implementation
(FastAPI, XGBoost, Cellular Automaton, SQLite history, DGF Watchtowers,
Emergency SMS Gateway, Sirocco Corridors, Thermal Drone Patrols & Roadmap).
"""

import os
import sys

# Ensure backend root directory is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(CURRENT_DIR)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

import main

# Export FastAPI app instance for uvicorn app.main:app
app = main.app
