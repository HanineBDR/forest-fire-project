"""
INKAD - Health & Operational Monitoring Endpoints
Exposes platform telemetry, external API health, prediction auditing,
and model diagnostics.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel

from .service import (
    get_full_system_health,
    get_audit_logs,
    get_monitoring_metrics,
    run_test_model_inference,
    ANOMALIES_DETECTED
)
from auth.service import get_current_user, get_admin_user, ROLE_ADMIN

router = APIRouter(prefix="/monitoring", tags=["Monitoring & Diagnostics"])


class HealthCheckItem(BaseModel):
    service: str
    status: str
    latency_ms: float
    last_check: str
    details: Optional[str] = None


class SystemHealthResponse(BaseModel):
    status: str
    uptime_seconds: int
    uptime_formatted: str
    timestamp: str
    checks: List[Dict[str, Any]]
    model_accuracy: float
    accuracy_threshold: float
    anomalies_count: int
    total_audited_predictions: int
    refresh_telemetry: Optional[Dict[str, Any]] = None


@router.get("/health", response_model=SystemHealthResponse)
def get_system_health():
    """
    Checks AI model, NASA FIRMS, Open-Meteo Weather API, and persistent storage.
    Returns: {status: 'healthy' | 'degraded' | 'down', checks: [...], uptime}
    Critical for institutional reliability (Civil Protection / Forest Guards).
    """
    return get_full_system_health()


@router.get("/metrics")
def get_platform_metrics(current_user: dict = Depends(get_current_user)):
    """
    Returns predictions per hour, error rate, active anomalies, and average latency.
    Accessible to authenticated personnel.
    """
    return get_monitoring_metrics()


@router.get("/audit-logs")
def get_recent_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """
    Audit log: who predicted what, when.
    Ensures Civil Protection and Forest Guard accountability.
    """
    return get_audit_logs(limit=limit)


@router.get("/refresh-logs")
def get_monitoring_refresh_logs(limit: int = Query(10, ge=1, le=50)):
    """
    Returns recent refresh telemetry logs from history database.
    Shows NASA API queries, model retrainings, and snapshot updates.
    """
    try:
        from ml.history_manager import get_refresh_logs, check_nasa_quota_cache
        logs = get_refresh_logs(limit=limit)
        nasa_status = check_nasa_quota_cache()
        failed_count = sum(1 for l in logs if l.get("status") == "failed")
        return {
            "logs": logs,
            "nasa_quota": nasa_status,
            "failed_count": failed_count,
            "fallback_active": failed_count >= 3
        }
    except Exception as e:
        return {"logs": [], "error": str(e), "failed_count": 0, "fallback_active": False}



@router.post("/test-model")
def trigger_model_test(admin_user: dict = Depends(get_admin_user)):
    """
    Conducts live test inference with sample data and returns latency & risk diagnosis.
    Restricted to ADMIN role.
    """
    return run_test_model_inference()


@router.post("/trigger-anomaly-demo")
def trigger_anomaly_demo(admin_user: dict = Depends(get_admin_user)):
    """
    Demo utility for judges: injects a sample sensor saturation anomaly to demonstrate UI alerting.
    """
    import uuid
    from datetime import datetime
    sample_anomaly = {
        "id": f"anom-{uuid.uuid4().hex[:6]}",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "type": "SENSOR_SATURATION_ANOMALY",
        "location": "(36.735, 4.435) - Tizi Ouzou (Yakouren)",
        "consecutive_100_percent_count": 52,
        "message": "CRITICAL ANOMALY: Location (36.735, 4.435) returned 100% risk 50+ times continuously. Flagged for ground sensor calibration.",
        "severity": "HIGH"
    }
    ANOMALIES_DETECTED.insert(0, sample_anomaly)
    return {"status": "anomaly_injected", "anomaly": sample_anomaly}
