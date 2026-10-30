"""
INKAD Machine Learning Package
Wildfire Risk Prediction & Spread Simulation for Northern Algeria
"""

from .predictor import predict_risk
from .simulation import simulate_fire_spread

__all__ = ["predict_risk", "simulate_fire_spread"]
