import { NextRequest, NextResponse } from "next/server";
import { getNeonSql } from "@/lib/neon";
import { createAlertAndNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT id, wilaya, massif, risk_level, temperature, humidity, wind_speed, fwi, created_at
      FROM predictions
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ ok: true, count: rows.length, data: rows });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to fetch predictions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      wilaya,
      massif,
      risk_level,
      temperature,
      humidity,
      wind_speed,
      fwi,
      risk_score,
      lat,
      lon,
    } = body;

    if (!wilaya || !massif || !risk_level) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: wilaya, massif, risk_level" },
        { status: 400 }
      );
    }

    const tempNum = temperature !== undefined ? parseFloat(temperature) : 35.0;
    const humNum = humidity !== undefined ? parseFloat(humidity) : 25.0;
    const windNum = wind_speed !== undefined ? parseFloat(wind_speed) : 20.0;
    const fwiNum = fwi !== undefined ? parseFloat(fwi) : 30.0;
    const scoreNum = risk_score !== undefined ? parseFloat(risk_score) : fwiNum * 2.5;

    const sql = getNeonSql();
    const [inserted] = await sql`
      INSERT INTO predictions (wilaya, massif, risk_level, temperature, humidity, wind_speed, fwi)
      VALUES (
        ${wilaya},
        ${massif},
        ${risk_level},
        ${tempNum},
        ${humNum},
        ${windNum},
        ${fwiNum}
      )
      RETURNING *
    `;

    // National Early Warning: If risk is elevated, auto-notify all panels
    let dispatchResult: any = null;
    const isElevated =
      ["High", "Very High", "Elevé", "Très Elevé", "Extreme"].some((lvl) =>
        risk_level.toLowerCase().includes(lvl.toLowerCase())
      ) ||
      scoreNum > 60 ||
      fwiNum >= 25;

    if (isElevated) {
      try {
        dispatchResult = await createAlertAndNotifications({
          wilaya,
          massif,
          risk_level,
          risk_score: scoreNum,
          temp: tempNum,
          humidity: humNum,
          wind: windNum,
          lat: lat !== undefined ? parseFloat(lat) : 36.735,
          lon: lon !== undefined ? parseFloat(lon) : 4.435,
        });
      } catch (e: any) {
        console.warn("Auto notification dispatch error:", e?.message);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        data: inserted,
        auto_notified: !!dispatchResult,
        dispatch: dispatchResult,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to insert prediction" },
      { status: 500 }
    );
  }
}
