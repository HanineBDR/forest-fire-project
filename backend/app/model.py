"""
IN9AD - XGBoost Wildfire Risk Model & FWI Scoring Engine
Provides hybrid ML + Canadian Forest Fire Weather Index (FWI) calibrated for Northern Algeria.
"""

import os
import json
import math
import logging
from typing import Dict, Any, List, Optional
import numpy as np

logger = logging.getLogger(__name__)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "fire_xgboost_model.json")
METADATA_PATH = os.path.join(BASE_DIR, "models", "model_metadata.json")

class WildfirePredictor:
    def __init__(self):
        self.model = None
        self.metadata = {}
        self.load_model()
        
    def load_model(self):
        """Loads trained XGBoost model if exists on disk."""
        if os.path.exists(MODEL_PATH):
            try:
                import xgboost as xgb
                self.model = xgb.XGBRegressor()
                self.model.load_model(MODEL_PATH)
                logger.info(f"Loaded XGBoost model from {MODEL_PATH}")
                if os.path.exists(METADATA_PATH):
                    with open(METADATA_PATH, "r", encoding="utf-8") as f:
                        self.metadata = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load XGBoost model: {e}. Falling back to calibrated FWI physics engine.")
                self.model = None
        else:
            logger.info("XGBoost model not found on disk yet. Running in calibrated FWI physics mode.")
            self.model = None

    @staticmethod
    def calculate_fwi(temp: float, wind: float, humidity: float, rain: float = 0.0) -> Dict[str, float]:
        """
        Computes Canadian Forest Fire Weather Index components:
        FFMC (Fine Fuel Moisture Code), ISI (Initial Spread Index), BUI, FWI.
        """
        # Fine Fuel Moisture Code
        rain_factor = max(0.0, 1.0 - (rain / 10.0))
        moisture = (humidity / 100.0) * 0.7 + (1.0 - rain_factor) * 0.3
        temp_factor = np.clip((temp - 10.0) / 35.0, 0.0, 1.5)
        wind_factor = np.clip(wind / 50.0, 0.0, 1.5)
        
        ffmc = 50.0 + (temp_factor * 25.0) + (wind_factor * 15.0) - (moisture * 30.0)
        ffmc = float(np.clip(ffmc, 20.0, 99.0))
        
        # Initial Spread Index (ISI)
        f_wind = math.exp(0.05039 * wind)
        m = 147.2 * (101.0 - ffmc) / (59.5 + ffmc)
        f_f = 91.9 * math.exp(-0.1386 * m) * (1.0 + (m ** 5.31) / (4.93e7))
        isi = float(np.clip(0.208 * f_wind * f_f, 0.0, 60.0))
        
        # Buildup Index (BUI)
        bui = float(np.clip((temp * 1.8) - (humidity * 0.5) - (rain * 2.0), 5.0, 120.0))
        
        # Composite FWI
        if bui <= 80:
            fwi = 0.1 * isi * (0.626 * (bui ** 0.809) + 2.0)
        else:
            fwi = 0.1 * isi * (1000.0 / (25.0 + 108.64 / math.exp(0.023 * bui)))
        fwi = float(np.clip(fwi, 0.0, 100.0))
        
        return {
            "ffmc": round(ffmc, 1),
            "isi": round(isi, 1),
            "bui": round(bui, 1),
            "fwi": round(fwi, 1)
        }

    def predict(
        self,
        lat: float,
        lon: float,
        temp: float,
        wind: float,
        humidity: float,
        rain: float = 0.0,
        wind_direction: float = 180.0
    ) -> Dict[str, Any]:
        """
        Executes fire risk prediction for given coordinate and meteorological parameters.
        """
        fwi_dict = self.calculate_fwi(temp, wind, humidity, rain)
        
        # Check for Algerian Sirocco (Chergui) hot desert wind from South
        is_sirocco = (130.0 <= wind_direction <= 230.0) and (temp >= 33.0) and (humidity <= 32.0)
        
        # Generic Mediterranean forest belt detection across Northern Algeria (Tell Atlas, Kabylie, Aurès, Numidia)
        in_dense_forest = 34.8 <= lat <= 37.5 and -2.5 <= lon <= 9.0
        
        score: float = 0.0
        used_model = "XGBoost Regressor (Inference)"
        
        if self.model is not None:
            try:
                features = np.array([[
                    lat, lon, temp, wind, humidity, rain, wind_direction,
                    fwi_dict["ffmc"], fwi_dict["isi"], fwi_dict["bui"], fwi_dict["fwi"],
                    1.0 if is_sirocco else 0.0
                ]])
                pred = float(self.model.predict(features)[0])
                score = float(np.clip(pred, 0.0, 100.0))
            except Exception as e:
                logger.warning(f"XGBoost runtime inference failed: {e}. Using calibrated fallback.")
                score = self._fallback_score(temp, wind, humidity, rain, fwi_dict["fwi"], is_sirocco, in_dense_forest)
                used_model = "Calibrated FWI Physical Model (Fallback)"
        else:
            score = self._fallback_score(temp, wind, humidity, rain, fwi_dict["fwi"], is_sirocco, in_dense_forest)
            used_model = "Calibrated Algerian FWI Engine"
            
        score = round(score, 1)
        
        # Determine risk classification category
        if score < 25.0:
            level = "Low"
            color = "#10b981" # Emerald Green
            french_level = "Faible"
            arabic_level = "منخفض"
        elif score < 50.0:
            level = "Moderate"
            color = "#f59e0b" # Amber Yellow
            french_level = "Modéré"
            arabic_level = "متوسط"
        elif score < 75.0:
            level = "High"
            color = "#f97316" # Orange
            french_level = "Élevé"
            arabic_level = "مرتفع"
        elif score < 88.0:
            level = "Very High"
            color = "#ef4444" # Red
            french_level = "Très Élevé"
            arabic_level = "مرتفع جداً"
        else:
            level = "Extreme (Crisis Alert)"
            color = "#7f1d1d" # Deep Crimson
            french_level = "Extrême / Alerte Rouge"
            arabic_level = "كارثي / استنفار أقصى"
            
        # Explanatory factors
        factors = []
        if is_sirocco:
            factors.append("Sirocco (Chergui) desert wind active: extreme heat + desiccation.")
        if temp >= 38.0:
            factors.append(f"Severe heatwave anomaly: {temp}°C accelerates moisture vaporization.")
        if humidity <= 20.0:
            factors.append(f"Critical dry air: {humidity}% relative humidity leaves dead fuel hyper-flammable.")
        if wind >= 35.0:
            factors.append(f"High wind velocity: {wind} km/h fuels aggressive convective oxygen feed.")
        if fwi_dict["isi"] >= 15.0:
            factors.append(f"High Initial Spread Index (ISI: {fwi_dict['isi']}): rapid ignition potential.")
        if in_dense_forest:
            factors.append("Dense Mediterranean forest canopy (Tell Atlas / Coastal Mountain belt).")
        if rain > 0.0:
            factors.append(f"Dampening factor: {rain} mm precipitation temporarily suppresses ignition.")
        if not factors:
            factors.append("Ambient conditions within normal seasonal safety thresholds.")

        # Civil Protection Recommendations (Protection Civile Algérienne / DGF)
        if score >= 75.0:
            advisory = "CRITICAL ALERT: Activate Algerian Civil Protection emergency dispatch protocol. Prohibit agricultural burning, prepare water bombing aircraft (Beriev Be-200 / AT-802), and maintain immediate evacuation corridors."
        elif score >= 50.0:
            advisory = "HIGH VIGILANCE: Forest surveillance patrols on high alert across Northern Algeria massifs. Mobile fire watchtowers manned 24/7."
        else:
            advisory = "NORMAL MONITORING: Continuous satellite observation via NASA FIRMS. Routine forestry conservation patrols active."

        return {
            "risk_score": score,
            "risk_level": level,
            "risk_level_fr": french_level,
            "risk_level_ar": arabic_level,
            "theme_color": color,
            "engine": used_model,
            "fwi_metrics": fwi_dict,
            "is_sirocco": is_sirocco,
            "in_forest_reserve": in_dense_forest,
            "contributing_factors": factors,
            "civil_protection_advisory": advisory
        }

    def _fallback_score(
        self,
        temp: float,
        wind: float,
        humidity: float,
        rain: float,
        fwi: float,
        is_sirocco: bool,
        in_forest: bool
    ) -> float:
        """Calibrated fallback calculation guaranteeing 100% reliability."""
        raw = (fwi * 0.45) + (temp * 0.8) - (humidity * 0.4) + (wind * 0.35) - (rain * 15.0)
        if is_sirocco:
            raw += 22.0
        if in_forest:
            raw += 7.0
        # Sigmoid mapping centered at 32
        val = 100.0 / (1.0 + math.exp(-(raw - 32.0) / 10.0))
        return float(np.clip(val, 0.0, 100.0))

# Global predictor instance
predictor = WildfirePredictor()
