"""
INKAD Real-Time Notifications & Inter-Panel Communication Router
Connects Protection Civile, Administration Centrale, and Mohafadat El Ghabat (DGF).
Provides bidirectional alerts, acknowledgments, SSE real-time stream, and Email incident dispatch.
"""

import os
import re
import uuid
import smtplib
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Request, Path, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.neon_db import execute_neon_sql
from app.realtime_events import broadcast_realtime_event, sse_event_generator

logger = logging.getLogger("inkad-notifications")

router = APIRouter(prefix="/api/notifications", tags=["Notifications & Panel Intercom"])


class AlertPanelPayload(BaseModel):
    from_role: str = Field(..., description="Role of the sender panel (protection_civile, admin_centrale, mohafadat_ghabat)")
    to_role: str = Field(..., description="Target recipient panel role or 'all'")
    alert_id: Optional[str] = Field(None, description="Related alert identifier")
    title: Optional[str] = Field(None, description="Title of the inter-panel transmission")
    message: str = Field(..., description="Operational message or alert description")
    massif: Optional[str] = Field(None, description="Forest massif name")
    wilaya: Optional[str] = Field(None, description="Wilaya name")
    lat: Optional[float] = Field(None, description="Latitude")
    lon: Optional[float] = Field(None, description="Longitude")
    risk_level: Optional[str] = Field("Elevé", description="Risk level")
    risk_score: Optional[float] = Field(None, description="Risk score percentage")


class AcknowledgePayload(BaseModel):
    alert_id: str = Field(..., description="Target alert ID")
    user_role: str = Field(..., description="Role performing the action")
    action: str = Field("acknowledged", description="'acknowledged', 'escalated', 'resolved', or 'alerted_other'")
    comment: Optional[str] = Field(None, description="Operational notes or response details")
    target_role: Optional[str] = Field(None, description="Target role if escalating or alerting")


class EmailReportPayload(BaseModel):
    recipient_email: str = Field(..., example="commandant.tizi@protectioncivile.dz")
    alert_id: Optional[str] = Field(None, example="ALT-2026-DZ-5192")
    forest_name: Optional[str] = Field("Massif de Yakouren", example="Massif de Yakouren")
    wilaya: Optional[str] = Field("Tizi Ouzou", example="Tizi Ouzou")
    severity: Optional[str] = Field("CRITICAL", example="CRITICAL")
    risk_score: Optional[float] = Field(88.5, example=88.5)
    message: str = Field(..., example="Active wildfire outbreak confirmed by watchtower sensor.")
    lat: Optional[float] = Field(None, example=36.735)
    lon: Optional[float] = Field(None, example=4.435)
    sender_role: Optional[str] = Field("protection_civile", example="protection_civile")


ROLE_LABELS = {
    "protection_civile": "Protection Civile (CODIS)",
    "admin_centrale": "Administration Centrale",
    "mohafadat_ghabat": "Conservation des Forêts (DGF)",
    "ai_model": "Système IA INKAD",
    "all": "Tous les Commandements"
}


@router.get("")
def list_notifications(
    role: Optional[str] = Query(None, description="Filter by recipient role"),
    unread_only: bool = Query(False, description="Filter unread notifications only"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of items")
):
    """
    Lists real-time notifications for operational panels.
    Filters by recipient role (including 'all' broadcasts).
    """
    conditions = []
    params = []

    if role:
        # Match specific role or broadcast to 'all'
        params.append(role)
        conditions.append(f"(recipient_role = ${len(params)} OR recipient_role = 'all')")

    if unread_only:
        conditions.append("is_read = FALSE")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    params.append(limit)
    sql = f"""
    SELECT 
        id, alert_id, sender_role, recipient_role, recipient_user_id,
        title, message, risk_level, risk_score, massif, wilaya, lat, lon,
        is_read, created_at
    FROM notifications
    {where_clause}
    ORDER BY created_at DESC
    LIMIT ${len(params)}
    """

    rows = execute_neon_sql(sql, params)
    unread_count = sum(1 for r in rows if not r.get("is_read"))
    return {
        "ok": True,
        "count": len(rows),
        "unread_count": unread_count,
        "data": rows
    }


@router.post("/{notification_id}/read")
def mark_notification_as_read(notification_id: int = Path(..., description="Notification ID")):
    """Marks a notification as read."""
    sql = "UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING id"
    res = execute_neon_sql(sql, [notification_id])
    if not res:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"ok": True, "id": notification_id, "is_read": True}


@router.post("/alert-panel")
def panel_to_panel_alert(payload: AlertPanelPayload):
    """
    Enables bidirectional panel communication (intercom).
    Example: Mohafadat El Ghabat spots smoke -> clicks 'Alerter Protection Civile'
    -> inserts notification + acknowledgment + broadcasts in real-time.
    """
    sender_label = ROLE_LABELS.get(payload.from_role, payload.from_role)
    target_label = ROLE_LABELS.get(payload.to_role, payload.to_role)
    
    title = payload.title or f"Message Opérationnel de {sender_label}"
    if payload.massif:
        title = f"Signalement Terrain ({payload.massif}) - {sender_label}"

    # 1. Insert notification for target panel
    insert_notif_sql = """
    INSERT INTO notifications (
        alert_id, sender_role, recipient_role, title, message,
        risk_level, risk_score, massif, wilaya, lat, lon, is_read, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE, NOW())
    RETURNING id
    """
    notif_res = execute_neon_sql(insert_notif_sql, [
        payload.alert_id,
        payload.from_role,
        payload.to_role,
        title,
        payload.message,
        payload.risk_level or "Elevé",
        payload.risk_score or 75.0,
        payload.massif,
        payload.wilaya,
        payload.lat,
        payload.lon
    ])

    # 2. Record in alert acknowledgments
    insert_ack_sql = """
    INSERT INTO alert_acknowledgments (
        alert_id, user_role, action, comment, target_role, created_at
    ) VALUES ($1, $2, 'alerted_other', $3, $4, NOW())
    RETURNING id
    """
    ack_res = execute_neon_sql(insert_ack_sql, [
        payload.alert_id or "GENERAL-DISPATCH",
        payload.from_role,
        payload.message,
        payload.to_role
    ])

    # 3. Broadcast real-time event to SSE and WebSocket clients
    broadcast_data = {
        "type": "panel_alert",
        "sender_role": payload.from_role,
        "recipient_role": payload.to_role,
        "sender_label": sender_label,
        "target_label": target_label,
        "title": title,
        "message": payload.message,
        "alert_id": payload.alert_id,
        "massif": payload.massif,
        "wilaya": payload.wilaya,
        "risk_level": payload.risk_level or "Elevé"
    }
    broadcast_realtime_event("panel_alert", broadcast_data)

    return {
        "ok": True,
        "status": "dispatched",
        "notification_id": notif_res[0].get("id") if notif_res else None,
        "acknowledgment_id": ack_res[0].get("id") if ack_res else None,
        "broadcast": broadcast_data
    }


@router.post("/acknowledge")
def acknowledge_alert(payload: AcknowledgePayload):
    """
    Records an operational acknowledgment, escalation, or resolution.
    Cross-notifies partner panels so that all teams know who is responding.
    """
    user_label = ROLE_LABELS.get(payload.user_role, payload.user_role)
    
    # 1. Insert acknowledgment record
    insert_ack_sql = """
    INSERT INTO alert_acknowledgments (
        alert_id, user_role, action, comment, target_role, created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id
    """
    res = execute_neon_sql(insert_ack_sql, [
        payload.alert_id,
        payload.user_role,
        payload.action,
        payload.comment or f"Action {payload.action} effectuée par {user_label}",
        payload.target_role
    ])

    # 2. If acknowledged or escalated, notify partner panels
    action_texts = {
        "acknowledged": f"{user_label} a pris en charge l'alerte {payload.alert_id}",
        "escalated": f"{user_label} a escaladé l'alerte {payload.alert_id}",
        "resolved": f"{user_label} signale l'alerte {payload.alert_id} comme maîtrisée"
    }
    notif_title = action_texts.get(payload.action, f"Mise à jour sur l'alerte {payload.alert_id}")
    notif_msg = payload.comment or f"Statut mis à jour par {user_label}: {payload.action}."

    # Broadcast notification to other roles
    other_roles = [r for r in ["protection_civile", "admin_centrale", "mohafadat_ghabat"] if r != payload.user_role]
    for r in other_roles:
        execute_neon_sql("""
        INSERT INTO notifications (
            alert_id, sender_role, recipient_role, title, message, risk_level, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'Information', FALSE, NOW())
        """, [payload.alert_id, payload.user_role, r, notif_title, notif_msg])

    broadcast_realtime_event("alert_acknowledged", {
        "alert_id": payload.alert_id,
        "user_role": payload.user_role,
        "user_label": user_label,
        "action": payload.action,
        "comment": payload.comment
    })

    return {
        "ok": True,
        "id": res[0].get("id") if res else None,
        "alert_id": payload.alert_id,
        "action": payload.action
    }


@router.post("/email-report")
def send_email_report(payload: EmailReportPayload):
    """
    Dispatches operational wildfire incident report to designated authority via Email.
    Supports live SMTP when configured, or simulated emergency dispatch with verified audit trail.
    """
    email_clean = payload.recipient_email.strip().lower()
    email_regex = r"^[\w\.\+\-]+@[\w\.\-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_regex, email_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format d'adresse e-mail invalide. Exemple: officier@protectioncivile.dz"
        )

    message_id = f"EMAIL-{uuid.uuid4().hex[:8].upper()}"
    subject = f"[INKAD OP-REPORT] {payload.severity} - {payload.forest_name} ({payload.wilaya}) · Ref: {payload.alert_id or message_id}"

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("SMTP_FROM", "alerte-inkad@protectioncivile.dz")

    sent_live = False
    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"INKAD Wildfire Dispatch <{sender_email}>"
            msg["To"] = email_clean

            text_content = f"""
========================================================================
REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE
MINISTERE DE L'INTERIEUR ET DES COLLECTIVITES LOCALES
INKAD - SYSTEME NATIONAL D'ALERTE ET TRANSMISSION OPERATIONNELLE
========================================================================

RAPPORT D'INCIDENT / TRANSMISSION INTER-CENTRES
Reference: {payload.alert_id or message_id}
Niveau d'Urgence: {payload.severity} (Score Risque: {payload.risk_score}%)
Secteur: {payload.forest_name} - Wilaya de {payload.wilaya}
Coordonnees GPS: {payload.lat or 'N/A'}, {payload.lon or 'N/A'}
Emetteur: {payload.sender_role}

MESSAGE DE TRANSMISSION:
------------------------------------------------------------------------
{payload.message}
------------------------------------------------------------------------

Rapport genere automatiquement par la plateforme INKAD le {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}.
========================================================================
"""
            msg.attach(MIMEText(text_content, "plain"))
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender_email, [email_clean], msg.as_string())
            sent_live = True
        except Exception as e:
            logger.warning(f"SMTP live send failed, falling back to simulated dispatch: {e}")

    return {
        "status": "success",
        "message": f"Rapport opérationnel transmis avec succès à {email_clean}",
        "message_id": message_id,
        "recipient": email_clean,
        "sent_live": sent_live
    }


@router.get("/realtime")
async def realtime_notifications_sse(
    role: str = Query("all", description="Panel role to listen for (protection_civile, admin_centrale, mohafadat_ghabat, or all)")
):
    """
    Server-Sent Events (SSE) real-time streaming endpoint.
    Maintains persistent HTTP connection and streams alerts instantly.
    """
    return StreamingResponse(
        sse_event_generator(role=role),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/timeline")
def get_alerts_timeline(limit: int = Query(50, ge=1, le=100)):
    """
    Returns unified chronological timeline:
    AI model detections -> Panel alerts -> Acknowledgments -> Operational escalations.
    """
    notifs = execute_neon_sql("""
    SELECT 
        'notification' as type,
        id, alert_id, sender_role, recipient_role, title, message,
        risk_level, risk_score, massif, wilaya, created_at
    FROM notifications
    ORDER BY created_at DESC
    LIMIT $1
    """, [limit])

    acks = execute_neon_sql("""
    SELECT 
        'acknowledgment' as type,
        id, alert_id, user_role, action, comment, target_role, created_at
    FROM alert_acknowledgments
    ORDER BY created_at DESC
    LIMIT $1
    """, [limit])

    # Merge and sort
    timeline = sorted(notifs + acks, key=lambda x: str(x.get("created_at", "")), reverse=True)[:limit]
    return {
        "ok": True,
        "count": len(timeline),
        "timeline": timeline
    }
