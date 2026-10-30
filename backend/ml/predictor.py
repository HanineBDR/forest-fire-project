"""
INKAD - Wildfire Risk Predictor
Loads the pre-trained XGBoost model from /backend/ml/model.pkl and performs instantaneous inference.
No retraining occurs during prediction.
Evaluates local environmental parameters, computes risk score (0-100), classifies risk level
(Low, Medium, High, Very High), and highlights physical risk factors.
"""

import os
import math
import logging
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("inkad-predictor")

ML_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(ML_DIR, "model.pkl")

# Feature order expected by XGBoost model
FEATURES = ["temp", "humidity", "wind_speed", "precipitation", "vegetation_index", "month"]

# Strategic forest reserve coordinates in Northern Algeria
FOREST_RESERVES = [
    {"name": "Yakouren Forest (Tizi Ouzou)", "lat": 36.7350, "lon": 4.4350, "radius": 0.22, "canopy_ndvi": 0.76},
    {"name": "Akfadou Massif (Bejaia/Tizi)", "lat": 36.6710, "lon": 4.5820, "radius": 0.25, "canopy_ndvi": 0.78},
    {"name": "Djurdjura / Tikjda (Bouira)", "lat": 36.4520, "lon": 4.1320, "radius": 0.28, "canopy_ndvi": 0.72},
    {"name": "Gouraya National Park (Bejaia)", "lat": 36.7680, "lon": 5.0920, "radius": 0.15, "canopy_ndvi": 0.70},
    {"name": "Babor Massif (Setif/Jijel)", "lat": 36.5500, "lon": 5.4800, "radius": 0.25, "canopy_ndvi": 0.75},
    {"name": "Mizrana Forest (Tizi Ouzou)", "lat": 36.8850, "lon": 4.0200, "radius": 0.18, "canopy_ndvi": 0.68}
]


class PredictorEngine:
    """Singleton predictor that holds the loaded XGBoost model in memory."""
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        """Loads trained model.pkl without retraining."""
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                logger.info(f"Successfully loaded XGBoost model from {MODEL_PATH}")
            except Exception as e:
                logger.warning(f"Failed to load {MODEL_PATH}: {e}. Calibrated physics fallback will be used.")
                self.model = None
        else:
            logger.warning(f"Model file {MODEL_PATH} not found. Running in calibrated fallback mode.")
            self.model = None

    def estimate_vegetation_index(self, lat: float, lon: float, month: int) -> float:
        """
        Estimates local vegetation density (NDVI proxy 0.0 - 1.0) based on proximity
        to Northern Algeria mountain forest reserves and seasonal phenology.
        """
        # Default baseline for Mediterranean maquis/scrub
        base_ndvi = 0.52
        
        # Proximity boost for dense oak/cedar massifs
        for res in FOREST_RESERVES:
            dist = math.hypot(lat - res["lat"], lon - res["lon"])
            if dist <= res["radius"]:
                proximity_weight = 1.0 - (dist / res["radius"])
                base_ndvi = max(base_ndvi, base_ndvi + (res["canopy_ndvi"] - base_ndvi) * proximity_weight)

        # Summer seasonal drying curve: July/August vegetation is drier/stressed
        if month in [7, 8]:
            base_ndvi *= 0.90
        elif month in [6, 9]:
            base_ndvi *= 0.95

        return round(float(np.clip(base_ndvi, 0.20, 0.85)), 3)


# Instantiate singleton instance
_predictor = PredictorEngine()


def predict_risk(
    lat: float,
    lon: float,
    temp: float,
    humidity: float,
    wind: float,
    precip: float = 0.0,
    vegetation_index: Optional[float] = None,
    month: Optional[int] = None,
    wind_direction: Optional[float] = 180.0,
    **kwargs
) -> Dict[str, Any]:
    """
    Main prediction function required by INKAD specification:
    Inputs: lat, lon, temp, humidity, wind, precip (and optional vegetation_index, month, wind_direction)
    Returns:
    {
        "risk_score": float (0-100),
        "risk_level": "Low" | "Medium" | "High" | "Very High",
        "factors": List[str],
        ...
    }
    """
    # 1. Determine seasonal month if not provided
    if month is None:
        try:
            month = datetime.now().month
        except Exception:
            month = 7  # Default to peak summer

    # 2. Determine vegetation index if not provided
    if vegetation_index is None:
        vegetation_index = _predictor.estimate_vegetation_index(lat, lon, month)

    # 3. Predict probability using loaded XGBoost model
    if _predictor.model is not None:
        try:
            input_df = pd.DataFrame([{
                "temp": float(temp),
                "humidity": float(humidity),
                "wind_speed": float(wind),
                "precipitation": float(precip),
                "vegetation_index": float(vegetation_index),
                "month": int(month)
            }], columns=FEATURES)

            proba = float(_predictor.model.predict_proba(input_df)[0, 1])
            risk_score = round(proba * 100.0, 1)
            engine_name = "XGBoost Classifier (Render Free-Tier)"
        except Exception as e:
            logger.error(f"Prediction inference error: {e}. Falling back to physics formula.")
            risk_score = _calibrated_physics_risk(temp, humidity, wind, precip, vegetation_index)
            engine_name = "Calibrated Algerian FWI Heuristic"
    else:
        risk_score = _calibrated_physics_risk(temp, humidity, wind, precip, vegetation_index)
        engine_name = "Calibrated Algerian FWI Heuristic (Pre-Train Mode)"

    # Clip to valid 0 - 100 range
    risk_score = float(np.clip(risk_score, 0.0, 100.0))

    # 4. Determine Risk Level
    if risk_score < 25.0:
        risk_level = "Low"
        risk_level_fr = "Faible"
        risk_level_ar = "منخفض"
        theme_color = "#10b981"  # Emerald
    elif risk_score < 50.0:
        risk_level = "Medium"
        risk_level_fr = "Modéré"
        risk_level_ar = "متوسط"
        theme_color = "#f59e0b"  # Amber
    elif risk_score < 75.0:
        risk_level = "High"
        risk_level_fr = "Élevé"
        risk_level_ar = "مرتفع"
        theme_color = "#ea580c"  # Orange
    else:
        risk_level = "Very High"
        risk_level_fr = "Très Élevé / Alerte Rouge"
        risk_level_ar = "شديد الخطورة"
        theme_color = "#dc2626"  # Crimson

    # 5. Determine Contributing Factors
    factors = []
    
    # Check for Algerian Sirocco (Chergui) wind from the South
    is_sirocco = (130.0 <= (wind_direction or 180.0) <= 230.0) and (temp >= 34.0) and (humidity <= 30.0)
    if is_sirocco:
        factors.append("Sirocco (Chergui) Desert Wind: Hot, hyper-dry gusts blowing from the Sahara.")

    if temp >= 38.0:
        factors.append(f"Critical Heatwave: Ambient temperature of {temp:.1f}°C exceeds critical ignition thresholds.")
    elif temp >= 32.0:
        factors.append(f"Elevated Temperature: {temp:.1f}°C accelerates fine fuel evaporation.")

    if humidity <= 20.0:
        factors.append(f"Severe Fuel Desiccation: Relative humidity at {humidity:.1f}% leaves forest litter hyper-combustible.")
    elif humidity <= 35.0:
        factors.append(f"Dry Atmospheric Moisture: Relative humidity at {humidity:.1f}%.")

    if wind >= 35.0:
        factors.append(f"High Wind Velocity: {wind:.1f} km/h induces rapid spotting and extreme rate of spread.")
    elif wind >= 20.0:
        factors.append(f"Moderate Breeze: {wind:.1f} km/h sustains directional flame elongation.")

    if precip == 0.0:
        factors.append("Precipitation Deficit: 0.0 mm rainfall, persistent dry spell.")
    elif precip > 0.0:
        factors.append(f"Recent Rainfall: {precip:.1f} mm mitigates surface ignition risk.")

    if vegetation_index >= 0.65:
        factors.append(f"Heavy Canopy Fuel Load: High NDVI ({vegetation_index:.2f}) indicates dense Mediterranean oak/pine massifs.")

    if month in [7, 8]:
        factors.append("Seasonal Peak: High summer wildfire hazard window for Northern Algeria.")

    if not factors:
        factors.append("Stable environmental conditions within historical normal bounds.")

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_level_fr": risk_level_fr,
        "risk_level_ar": risk_level_ar,
        "theme_color": theme_color,
        "factors": factors,
        "engine": engine_name,
        "input_features": {
            "lat": lat,
            "lon": lon,
            "temp": temp,
            "humidity": humidity,
            "wind": wind,
            "precip": precip,
            "vegetation_index": vegetation_index,
            "month": month,
            "wind_direction": wind_direction
        }
    }


def _calibrated_physics_risk(
    temp: float,
    humidity: float,
    wind: float,
    precip: float,
    vegetation_index: float
) -> float:
    """Fallback Canadian FWI proxy adapted for Mediterranean conditions."""
    temp_score = np.clip((temp - 15.0) / 30.0, 0.0, 1.0) * 35.0
    hum_score = np.clip((75.0 - humidity) / 60.0, 0.0, 1.0) * 30.0
    wind_score = np.clip(wind / 55.0, 0.0, 1.0) * 20.0
    veg_score = np.clip(vegetation_index, 0.0, 1.0) * 15.0
    rain_dampening = max(0.0, 1.0 - (precip / 8.0))

    score = (temp_score + hum_score + wind_score + veg_score) * rain_dampening
    return round(float(np.clip(score, 5.0, 98.0)), 1)


if __name__ == "__main__":
    # Test sample prediction
    res = predict_risk(lat=36.7350, lon=4.4350, temp=41.0, humidity=16.0, wind=35.0, precip=0.0)
    print("\n--- Test Prediction (Yakouren Forest Summer Heatwave) ---")
    print(f"Risk Score: {res['risk_score']} / 100")
    print(f"Risk Level: {res['risk_level']}")
    print(f"Engine:     {res['engine']}")
    print("Factors:")
    for f in res["factors"]:
        print(f" - {f}")
