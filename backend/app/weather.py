"""
INKAD - Open-Meteo Weather Service
Fetches real-time meteorological parameters for Northern Algeria (free, no API key required)
"""

import logging
from typing import Dict, Any, Optional
import requests

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

def fetch_live_weather(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetches real-time weather parameters from Open-Meteo API.
    Parameters requested:
    - temperature_2m (°C)
    - relative_humidity_2m (%)
    - wind_speed_10m (km/h)
    - wind_direction_10m (degrees)
    - wind_gusts_10m (km/h)
    - precipitation (mm)
    - weather_code
    """
    params = {
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m",
            "weather_code"
        ],
        "hourly": ["temperature_2m", "relative_humidity_2m", "wind_speed_10m"],
        "forecast_days": 1,
        "timezone": "auto"
    }
    
    try:
        response = requests.get(OPEN_METEO_URL, params=params, timeout=5.0)
        response.raise_for_status()
        data = response.json()
        
        current = data.get("current", {})
        temp = float(current.get("temperature_2m", 28.0))
        humidity = float(current.get("relative_humidity_2m", 45.0))
        wind_speed = float(current.get("wind_speed_10m", 18.0))
        wind_direction = float(current.get("wind_direction_10m", 180.0))
        wind_gusts = float(current.get("wind_gusts_10m", wind_speed * 1.3))
        precipitation = float(current.get("precipitation", 0.0))
        apparent_temp = float(current.get("apparent_temperature", temp))
        
        return {
            "source": "Open-Meteo Live API",
            "latitude": lat,
            "longitude": lon,
            "temperature": round(temp, 1),
            "humidity": round(humidity, 1),
            "wind_speed": round(wind_speed, 1),
            "wind_direction": round(wind_direction, 1),
            "wind_gusts": round(wind_gusts, 1),
            "precipitation": round(precipitation, 2),
            "apparent_temperature": round(apparent_temp, 1),
            "is_live": True
        }
    except Exception as e:
        logger.warning(f"Failed to fetch live Open-Meteo weather for ({lat}, {lon}): {e}. Using fallback.")
        # Realistic fallback calibrated for Northern Algeria summer
        return {
            "source": "Estimated Seasonal Baseline (Northern Algeria)",
            "latitude": lat,
            "longitude": lon,
            "temperature": 32.5,
            "humidity": 35.0,
            "wind_speed": 22.0,
            "wind_direction": 185.0, # Sirocco Southerly wind
            "wind_gusts": 32.0,
            "precipitation": 0.0,
            "apparent_temperature": 34.0,
            "is_live": False,
            "error_note": str(e)
        }
