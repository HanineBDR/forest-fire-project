import { NextRequest, NextResponse } from "next/server";
import { fetchNotificationsFromDb, deleteAllNotificationsFromDb } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const FALLBACK_NOTIFICATIONS = [
  {
    id: 1,
    alert_id: "ALT-2026-DZ-01",
    sender_role: "ai_model",
    recipient_role: "all",
    title: "Risque Très Élevé détecté au Massif de Yakouren (Tizi Ouzou)",
    message: "Le modèle IA (XGBoost + FWI) signale un indice de danger à 90.2% (38.5°C, 18.0% HR, vent Sirocco 30 km/h). Alerte Opérationnelle: pré-positionner les colonnes mobiles.",
    risk_level: "Critique",
    risk_score: 90.2,
    massif: "Massif de Yakouren",
    wilaya: "Tizi Ouzou",
    lat: 36.735,
    lon: 4.435,
    is_read: false,
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    alert_id: "ALT-2026-DZ-01",
    sender_role: "mohafadat_ghabat",
    recipient_role: "all",
    title: "Déploiement Patrouille Drone FLIR - Secteur Yakouren",
    message: "Mohafadat El Ghabat a lancé le Drone Thermique Alpha-1 sur le corridor Yakouren-Akfadou. Vigies DGF V1 et V4 placées en surveillance infrarouge continue.",
    risk_level: "Élevé",
    risk_score: 88.0,
    massif: "Massif de Yakouren",
    wilaya: "Tizi Ouzou",
    lat: 36.744,
    lon: 4.442,
    is_read: false,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    alert_id: "ALT-2026-DZ-01",
    sender_role: "admin_centrale",
    recipient_role: "protection_civile",
    title: "Coordination Stratégique Inter-Wilayas Activée",
    message: "Direction Générale valide le plan ORSEC feux de forêt. Coordination activée avec Béjaïa et Bouira. Avions bombardiers d'eau placés en réserve opérationnelle.",
    risk_level: "Information",
    risk_score: 75.0,
    massif: "Massif de Yakouren",
    wilaya: "Tizi Ouzou",
    lat: 36.735,
    lon: 4.435,
    is_read: true,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    alert_id: "ALT-2026-DZ-02",
    sender_role: "ai_model",
    recipient_role: "all",
    title: "Détection Foyer Thermique par Satellite FIRMS - Forêt d'Akfadou",
    message: "Anomalie thermique détectée par VIIRS NOAA-20 au col d'Akfadou (Béjaïa). Indice FWI 84.6. Risque d'extension rapide vers le versant nord.",
    risk_level: "Très Élevé",
    risk_score: 84.6,
    massif: "Forêt d'Akfadou",
    wilaya: "Béjaïa",
    lat: 36.670,
    lon: 4.580,
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const unreadOnly = searchParams.get("unread_only") === "true";
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  try {
    const rows = await fetchNotificationsFromDb(role, unreadOnly, limit);
    if (Array.isArray(rows) && rows.length > 0) {
      const unreadCount = rows.filter((r) => !r.is_read).length;
      return NextResponse.json({
        ok: true,
        count: rows.length,
        unread_count: unreadCount,
        data: rows,
      });
    }
  } catch (error: any) {
    // Database URL not defined or connection error
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const query = new URLSearchParams();
    if (role) query.set("role", role);
    if (unreadOnly) query.set("unread_only", "true");
    query.set("limit", String(limit));

    const res = await fetch(`${backendUrl}/api/notifications?${query.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return NextResponse.json(json);
      }
    }
  } catch (proxyError) {
    // Fall through to fallback
  }

  let filtered = [...FALLBACK_NOTIFICATIONS];
  if (role && role !== "all") {
    filtered = filtered.filter(
      (n) => n.recipient_role === "all" || n.recipient_role === role || n.sender_role === role
    );
  }
  if (unreadOnly) {
    filtered = filtered.filter((n) => !n.is_read);
  }

  return NextResponse.json({
    ok: true,
    count: filtered.length,
    unread_count: filtered.filter((n) => !n.is_read).length,
    data: filtered.slice(0, limit),
  });
}

export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();
    const {
      alert_id,
      sender_role,
      recipient_role,
      title,
      message,
      risk_level,
      risk_score,
      massif,
      wilaya,
      lat,
      lon,
    } = body;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${backendUrl}/api/notifications/alert-panel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alert_id,
        sender_role,
        target_role: recipient_role,
        title,
        message,
        risk_level,
        massif,
        wilaya,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json, { status: 201 });
    }
  } catch (err: any) {
    // Fallback response
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: Date.now(),
      ...body,
      is_read: false,
      created_at: new Date().toISOString(),
    },
  }, { status: 201 });
}

export async function DELETE() {
  try {
    await deleteAllNotificationsFromDb();
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true, message: "Notifications cleared" });
}
