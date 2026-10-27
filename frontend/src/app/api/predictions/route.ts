import { NextRequest, NextResponse } from "next/server";
import { getNeonSql } from "@/lib/neon";

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
    const { wilaya, massif, risk_level, temperature, humidity, wind_speed, fwi } = body;

    if (!wilaya || !massif || !risk_level) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: wilaya, massif, risk_level" },
        { status: 400 }
      );
    }

    const sql = getNeonSql();
    const [inserted] = await sql`
      INSERT INTO predictions (wilaya, massif, risk_level, temperature, humidity, wind_speed, fwi)
      VALUES (
        ${wilaya},
        ${massif},
        ${risk_level},
        ${temperature !== undefined ? parseFloat(temperature) : 35.0},
        ${humidity !== undefined ? parseFloat(humidity) : 25.0},
        ${wind_speed !== undefined ? parseFloat(wind_speed) : 20.0},
        ${fwi !== undefined ? parseFloat(fwi) : 30.0}
      )
      RETURNING *
    `;

    return NextResponse.json({ ok: true, data: inserted }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to insert prediction" },
      { status: 500 }
    );
  }
}
