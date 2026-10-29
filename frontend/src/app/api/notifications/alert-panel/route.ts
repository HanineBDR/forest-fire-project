import { NextRequest, NextResponse } from "next/server";
import { createPanelIntercomAlert } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to dispatch panel alert" },
      { status: 500 }
    );
  }
}

