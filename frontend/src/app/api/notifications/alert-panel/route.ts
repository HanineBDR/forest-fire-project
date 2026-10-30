import { NextRequest, NextResponse } from "next/server";
import { createPanelIntercomAlert } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();
    const {
      from_role,
      to_role,
      alert_id,
      message,
      title,
      massif,
      wilaya,
      lat,
      lon,
      risk_level,
      risk_score,
    } = body;

    if (!from_role || !to_role || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: from_role, to_role, message" },
        { status: 400 }
      );
    }

    const result = await createPanelIntercomAlert({
      from_role,
      to_role,
      alert_id,
      message,
      title,
      massif,
      wilaya,
      lat: typeof lat === "number" ? lat : (lat ? parseFloat(lat) : null),
      lon: typeof lon === "number" ? lon : (lon ? parseFloat(lon) : null),
      risk_level,
      risk_score: typeof risk_score === "number" ? risk_score : (risk_score ? parseFloat(risk_score) : null),
    });

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error: any) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${backendUrl}/api/notifications/alert-panel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json, { status: 201 });
      }
    } catch (proxyError) {
      // Fall through
    }
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to dispatch panel alert" },
      { status: 500 }
    );
  }
}

