"""
IN9AD - FastAPI Wildfire Prediction & Simulation Backend
Endpoints:
- POST /predict : XGBoost risk score + FWI metrics + fire spread simulation
- GET /predict : Query-param friendly version of predict for quick curl/testing
- GET /weather : Live Open-Meteo meteorological feed for any lat/lon
- GET /firms : Active NASA FIRMS satellite thermal anomalies in Northern Algeria
- GET /simulate : Standalone Huygens elliptical fire propagation engine
- GET /regions : Strategic forest observation zones (Tizi Ouzou, Bejaia, Bouira)
"""

import os
import logging
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.model import predictor
from app.simulation import run_multi_horizon_simulation
from app.weather import fetch_live_weather
from app.firms import fetch_nasa_firms_hotspots

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("in9ad-api")

app = FastAPI(
    title="IN9AD - Wildfire Risk & Simulation API",
    description="AI-Based Forest Fire Risk Prediction for Northern Algeria (Tizi Ouzou, Bejaia, Bouira)",
    version="1.0.0"
)

# CORS setup for Vercel, localhost, and live previews
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in ALLOWED_ORIGINS else ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    lat: float = Field(..., description="Latitude in decimal degrees")
    lon: float = Field(..., description="Longitude in decimal degrees")
    temp: float = Field(..., description="Air temperature in Celsius")
    wind: float = Field(..., description="Wind speed in km/h")
    humidity: float = Field(..., description="Relative humidity in %")
    rain: Optional[float] = Field(0.0, description="Precipitation in mm")
    wind_direction: Optional[float] = Field(180.0, description="Wind direction in degrees (0-360)")

# Strategic Northern Algerian forest hotspots
STRATEGIC_REGIONS = [
    {
        "id": "yakouren",
        "name": "Yakouren Forest",
        "wilaya": "Tizi Ouzou",
        "lat": 36.7350,
        "lon": 4.4350,
        "elevation_m": 850,
        "canopy_type": "Dense Cork Oak & Zeen Oak (Chêne Liège / Chêne Zen)",
        "description": "Critical biodiversity forest corridor in Grande Kabylie, historically vulnerable to rapid summer fire propagation."
    },
    {
        "id": "akfadou",
        "name": "Akfadou Forest Massif",
        "wilaya": "Bejaia / Tizi Ouzou Border",
        "lat": 36.6710,
        "lon": 4.5820,
        "elevation_m": 1200,
        "canopy_type": "Extensive Deciduous & Mountain Oak",
        "description": "Massive high-altitude forest spanning the ridge between Bejaia and Tizi Ouzou, subject to strong mountain wind funnels."
    },
    {
        "id": "tikjda",
        "name": "Tikjda - Djurdjura National Park",
        "wilaya": "Bouira",
        "lat": 36.4520,
        "lon": 4.1320,
        "elevation_m": 1600,
        "canopy_type": "Cedar of Atlas (Cèdre de l'Atlas) & Alpine Shrub",
        "description": "Steep limestone massif and UNESCO Biosphere Reserve with extreme slope angles amplifying up-hill fire spread."
    },
    {
        "id": "gouraya",
        "name": "Gouraya National Park",
        "wilaya": "Bejaia",
        "lat": 36.7680,
        "lon": 5.0920,
        "elevation_m": 660,
        "canopy_type": "Maritime Pine, Aleppo Pine, Wild Olive & Scrub",
        "description": "Coastal cliffs bordering Bejaia city where sea-breeze microclimates create erratic wind shifts."
    },
    {
        "id": "mizrana",
        "name": "Mizrana Forest",
        "wilaya": "Tizi Ouzou / Boumerdes Border",
        "lat": 36.8850,
        "lon": 4.0200,
        "elevation_m": 450,
        "canopy_type": "Aleppo Pine & Dense Undergrowth Maquis",
        "description": "Coastal Mediterranean woodland with high fuel load and frequent human-wildland interface."
    }
]

@app.get("/")
def root():
    return {
        "project": "IN9AD - AI-Based Wildfire Risk Prediction & Simulation",
        "region": "Northern Algeria (Tizi Ouzou, Bejaia, Bouira)",
        "status": "operational",
        "docs_url": "/docs",
        "endpoints": {
            "predict_post": "/predict",
            "predict_get": "/predict?lat=36.7&lon=4.4&temp=38&wind=25&humidity=20",
            "weather": "/weather?lat=36.7169&lon=4.0497",
            "firms_hotspots": "/firms",
            "simulation": "/simulate?lat=36.7&lon=4.4&wind=25&wind_direction=180&risk_score=75",
            "regions": "/regions"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": predictor.model is not None,
        "engine": "XGBoost + Canadian FWI (Northern Algeria Calibrated)"
    }

@app.post("/predict")
def predict_risk(req: PredictRequest):
    """
    Core prediction endpoint:
    Calculates wildfire risk score with XGBoost + FWI, and projects spatial fire spread simulation.
    """
    prediction = predictor.predict(
        lat=req.lat,
        lon=req.lon,
        temp=req.temp,
        wind=req.wind,
        humidity=req.humidity,
        rain=req.rain or 0.0,
        wind_direction=req.wind_direction or 180.0
    )
    
    # Generate multi-horizon fire spread simulation
    simulation = run_multi_horizon_simulation(
        lat=req.lat,
        lon=req.lon,
        wind_speed=req.wind,
        wind_direction=req.wind_direction or 180.0,
        risk_score=prediction["risk_score"]
    )
    
    return {
        "input": {
            "lat": req.lat,
            "lon": req.lon,
            "temp": req.temp,
            "wind": req.wind,
            "humidity": req.humidity,
            "rain": req.rain,
            "wind_direction": req.wind_direction
        },
        **prediction,
        "simulation": simulation
    }

@app.get("/predict")
def predict_risk_get(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    temp: float = Query(..., description="Temperature °C"),
    wind: float = Query(..., description="Wind speed km/h"),
    humidity: float = Query(..., description="Humidity %"),
    rain: float = Query(0.0, description="Rain mm"),
    wind_direction: float = Query(180.0, description="Wind direction degrees")
):
    """GET version of /predict for easy testing and browser inspection."""
    req = PredictRequest(
        lat=lat,
        lon=lon,
        temp=temp,
        wind=wind,
        humidity=humidity,
        rain=rain,
        wind_direction=wind_direction
    )
    return predict_risk(req)

@app.get("/weather")
def get_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """Fetches real-time weather parameters from Open-Meteo API."""
    return fetch_live_weather(lat=lat, lon=lon)

@app.get("/firms")
def get_firms_hotspots():
    """Returns NASA FIRMS thermal anomaly satellite hotspots for Northern Algeria."""
    hotspots = fetch_nasa_firms_hotspots()
    return {
        "source": "NASA FIRMS (VIIRS / MODIS)",
        "region": "Northern Algeria Bounding Box (Tizi Ouzou, Bejaia, Bouira)",
        "total_hotspots": len(hotspots),
        "hotspots": hotspots
    }

@app.get("/simulate")
def simulate_fire_spread(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    wind: float = Query(25.0, description="Wind speed km/h"),
    wind_direction: float = Query(180.0, description="Wind direction degrees (from which wind blows)"),
    risk_score: float = Query(70.0, description="Risk score 0-100%")
):
    """Calculates Huygens elliptical fire propagation polygons over 1h, 3h, 6h, 12h horizons."""
    return run_multi_horizon_simulation(
        lat=lat,
        lon=lon,
        wind_speed=wind,
        wind_direction=wind_direction,
        risk_score=risk_score
    )

@app.get("/regions")
def get_regions():
    """Returns key vulnerable forest reserves in Kabylie / Northern Algeria."""
    return {
        "count": len(STRATEGIC_REGIONS),
        "regions": STRATEGIC_REGIONS
    }
