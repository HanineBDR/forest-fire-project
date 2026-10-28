"""
IN9AD Predictions Router & AI Risk Early Warning Dispatcher
Runs XGBoost + FWI models and automatically broadcasts real-time alerts
and notifications to Protection Civile, Admin Centrale, and Mohafadat El Ghabat.
"""

import time
import re
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, HTTPException, Request
from pydantic import BaseModel, Field

from app.neon_db import execute_neon_sql
from app.realtime_events import broadcast_realtime_event

try:
    from ml.predictor import predict_risk as ml_predict_risk
except ImportError:
    import sys, os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from ml.predictor import predict_risk as ml_predict_risk

router = APIRouter(prefix="/api/predictions", tags=["Predictions & AI Warning"])


class PredictionInput(BaseModel):
    lat: float = Field(36.7350, description="Latitude")
    lon: float = Field(4.4350, description="Longitude")
    temp: float = Field(35.0, description="Temperature (°C)")
    humidity: float = Field(25.0, description="Relative humidity (%)")
    wind: float = Field(20.0, description="Wind speed (km/h)")
    rain: Optional[float] = Field(0.0, description="Precipitation (mm)")
    precip: Optional[float] = Field(None, description="Precipitation alias (mm)")
    wind_direction: Optional[float] = Field(180.0, description="Wind direction (degrees)")
    wilaya: Optional[str] = Field("Tizi Ouzou", description="Wilaya name")
    massif: Optional[str] = Field("Massif de Yakouren", description="Forest massif name")
    vegetation_index: Optional[float] = Field(0.45, description="NDVI vegetation index")
    month: Optional[int] = Field(7, description="Month (1-12)")


def check_and_notify_risk(prediction_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates ML prediction risk level.
    If risk is High/Very High (or score > 60% / 0.6), auto-creates an official alert
    and broadcasts 3 notifications to:
      1. protection_civile
      2. admin_centrale
      3. mohafadat_ghabat
    """
    risk_level = prediction_data.get("risk_level", "Moderate")
    risk_level_fr = prediction_data.get("risk_level_fr", "Modéré")
    risk_score = float(prediction_data.get("risk_score", 0.0))
    
    # Check if high risk (supports both 0-1 and 0-100 scales)
    is_high = (
        risk_level in ["High", "Very High", "Elevé", "Très Elevé", "Extreme"]
        or risk_level_fr in ["Élevé", "Très Élevé", "Extrême", "Elevé", "Très Elevé"]
        or risk_score > 60.0
        or (0.6 < risk_score <= 1.0)
    )

    if not is_high:
        return {"notified": False, "reason": "Risk score below critical threshold"}

    # Extract geographical & meteorological context
    inp = prediction_data.get("input", {})
    wilaya = prediction_data.get("wilaya") or inp.get("wilaya") or "Tizi Ouzou"
    massif = prediction_data.get("massif") or prediction_data.get("forest_name") or inp.get("massif") or "Yakouren"
    lat = float(prediction_data.get("lat") or inp.get("lat") or 36.7350)
    lon = float(prediction_data.get("lon") or inp.get("lon") or 4.4350)
    temp = float(prediction_data.get("temp") or inp.get("temp") or 38.0)
    humidity = float(prediction_data.get("humidity") or inp.get("humidity") or 20.0)
    wind = float(prediction_data.get("wind") or inp.get("wind") or 25.0)

    # 1. Create alert ID
    timestamp = int(time.time())
    w_slug = re.sub(r'[^a-zA-Z0-9]', '', wilaya)
    m_slug = re.sub(r'[^a-zA-Z0-9]', '', massif)
    alert_id = f"ALERT-{w_slug}-{m_slug}-{timestamp}"

    # Normalized risk level string for database
    norm_level = "Très Elevé" if ("Très" in risk_level_fr or "Very" in risk_level or risk_score >= 75) else "Elevé"

    # 2. Insert into alerts table
    insert_alert_sql = """
    INSERT INTO alerts (alert_id, lat, lon, wilaya, forest_name, risk_score, risk_level, temp, humidity, wind, wind_dir, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'DETECTED', NOW(), NOW())
    """
    execute_neon_sql(insert_alert_sql, [
        alert_id, lat, lon, wilaya, massif, risk_score, norm_level, temp, humidity, wind, "Sud (Sirocco)"
    ])

    # 3. Insert 3 notifications (one per panel)
    panels = [
        ("protection_civile", "Protection Civile", "Alerte Opérationnelle: Risque d'incendie détecté par l'IA. Pré-positionner les colonnes mobiles."),
        ("admin_centrale", "Administration Centrale", "Alerte Stratégique: Risque feu de forêt élevé. Coordination inter-wilayas activée."),
        ("mohafadat_ghabat", "Conservation des Forêts", "Alerte Terrain: Surveillance accrue des vigies DGF et rondes de patrouille requises.")
    ]

    inserted_notifications = []
    for role_key, role_label, role_action in panels:
        title = f"Risque {norm_level} détecté à {massif} ({wilaya})"
        message = f"Le modèle IA (XGBoost + FWI) signale un indice de danger à {risk_score:.1f}% ({temp}°C, {humidity}% HR, {wind} km/h). {role_action}"
        
        insert_notif_sql = """
        INSERT INTO notifications (
            alert_id, sender_role, recipient_role, recipient_user_id,
            title, message, risk_level, risk_score, massif, wilaya, lat, lon,
            is_read, created_at
        ) VALUES ($1, 'ai_model', $2, NULL, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, NOW())
        """
        execute_neon_sql(insert_notif_sql, [
            alert_id, role_key, title, message, norm_level, risk_score, massif, wilaya, lat, lon
        ])
        inserted_notifications.append({
            "recipient_role": role_key,
            "title": title,
            "message": message
        })

    # 4. Broadcast Realtime Event
    broadcast_realtime_event("new_alert", {
        "alert_id": alert_id,
        "sender_role": "ai_model",
        "risk_level": norm_level,
        "risk_score": risk_score,
        "massif": massif,
        "wilaya": wilaya,
        "lat": lat,
        "lon": lon,
        "temp": temp,
        "humidity": humidity,
        "wind": wind,
        "created_at": time.time(),
        "title": f"Risque {norm_level} détecté à {massif}",
        "message": f"IA a alerté Protection Civile, Conservation des Forêts et Administration Centrale."
    })

    return {
        "notified": True,
        "alert_id": alert_id,
        "risk_level": norm_level,
        "risk_score": risk_score,
        "notifications_count": len(inserted_notifications),
        "notifications": inserted_notifications
    }


@router.post("")
def predict_and_notify(req: PredictionInput):
    """
    Runs XGBoost risk prediction on weather and geographic parameters.
    Automatically creates alert and multi-panel notifications if risk is elevated.
    """
    precip = req.precip if req.precip is not None else (req.rain or 0.0)
    
    # 1. ML Prediction
    pred = ml_predict_risk(
        lat=req.lat,
        lon=req.lon,
        temp=req.temp,
        humidity=req.humidity,
        wind=req.wind,
        precip=precip,
        vegetation_index=req.vegetation_index or 0.45,
        month=req.month or 7,
        wind_direction=req.wind_direction or 180.0
    )

    pred["input"] = {
        "lat": req.lat,
        "lon": req.lon,
        "temp": req.temp,
        "humidity": req.humidity,
        "wind": req.wind,
        "rain": precip,
        "wind_direction": req.wind_direction,
        "wilaya": req.wilaya,
        "massif": req.massif
    }
    pred["wilaya"] = req.wilaya
    pred["massif"] = req.massif

    # 2. Check and notify risk across all operational panels
    notification_result = check_and_notify_risk(pred)
    pred["notification_dispatch"] = notification_result
    pred["alert_id"] = notification_result.get("alert_id")
    pred["notifications_dispatched"] = notification_result.get("notifications_count", 0)

    return pred


@router.get("")
def predict_and_notify_get(
    lat: float = Query(36.7350, description="Latitude"),
    lon: float = Query(4.4350, description="Longitude"),
    temp: float = Query(38.0, description="Temperature °C"),
    humidity: float = Query(20.0, description="Humidity %"),
    wind: float = Query(25.0, description="Wind speed km/h"),
    rain: float = Query(0.0, description="Rain mm"),
    wilaya: str = Query("Tizi Ouzou", description="Wilaya"),
    massif: str = Query("Massif de Yakouren", description="Massif")
):
    """GET version for browser and automated monitoring health check."""
    req = PredictionInput(
        lat=lat,
        lon=lon,
        temp=temp,
        humidity=humidity,
        wind=wind,
        rain=rain,
        wilaya=wilaya,
        massif=massif
    )
    return predict_and_notify(req)
