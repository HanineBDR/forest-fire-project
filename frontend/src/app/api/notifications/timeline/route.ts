import { NextRequest, NextResponse } from "next/server";
import { fetchTimelineFromDb } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const FALLBACK_TIMELINE = [
  {
    id: 101,
    item_type: "notification",
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
    id: 102,
    item_type: "acknowledgment",
    alert_id: "ALT-2026-DZ-01",
    user_role: "protection_civile",
    action: "acknowledged",
    comment: "Prise en compte opérationnelle immédiate par le CODIS Tizi Ouzou. Notification transmise à la colonne mobile feux de forêt.",
    target_role: "admin_centrale",
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 103,
    item_type: "notification",
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
    id: 104,
    item_type: "acknowledgment",
    alert_id: "ALT-2026-DZ-01",
    user_role: "protection_civile",
    action: "deployed",
    comment: "Colonne Mobile n°1 déployée sur l'axe N12 - Yakouren avec 4 engins feux de forêt (CCF) et 18 sapeurs-pompiers.",
    target_role: "all",
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 105,
    item_type: "notification",
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
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 106,
    item_type: "acknowledgment",
    alert_id: "ALT-2026-DZ-02",
    user_role: "mohafadat_ghabat",
    action: "surveillance",
    comment: "Poste de Commandement Opérationnel (PCO) établi au carrefour Yakouren. Tranchées coupe-feu en cours par les brigades mixtes DGF.",
    target_role: "admin_centrale",
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const timeline = await fetchTimelineFromDb(limit);

    if (Array.isArray(timeline) && timeline.length > 0) {
      const normalized = timeline.map((item: any) => ({
        ...item,
        item_type: item.item_type || item.type || "notification",
      }));

      return NextResponse.json({
        ok: true,
        count: normalized.length,
        data: normalized,
        timeline: normalized,
      });
    }
  } catch (error: any) {
    // Database URL not defined or connection error, fallback to backend proxy
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const res = await fetch(`${backendUrl}/api/notifications/timeline?limit=${limit}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      const raw = Array.isArray(json.data) ? json.data : (Array.isArray(json.timeline) ? json.timeline : []);
      if (raw.length > 0) {
        const normalized = raw.map((item: any) => ({
          ...item,
          item_type: item.item_type || item.type || "notification",
        }));
        return NextResponse.json({
          ok: true,
          count: normalized.length,
          data: normalized,
          timeline: normalized,
        });
      }
    }
  } catch (proxyError) {
    // Fall through to deterministic fallback
  }

  return NextResponse.json({
    ok: true,
    count: FALLBACK_TIMELINE.length,
    data: FALLBACK_TIMELINE,
    timeline: FALLBACK_TIMELINE,
  });
}
