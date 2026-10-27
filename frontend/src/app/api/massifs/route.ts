import { NextRequest, NextResponse } from "next/server";
import { getNeonSql } from "@/lib/neon";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT m.id, m.name, m.wilaya_id, w.name as wilaya_name, m.lat, m.lng, m.risk_level, m.area_hectares
      FROM massifs m
      LEFT JOIN wilayas w ON m.wilaya_id = w.id
      ORDER BY m.id ASC
    `;
    return NextResponse.json({ ok: true, count: rows.length, data: rows });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to fetch massifs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, wilaya_id, lat, lng, risk_level, area_hectares } = body;

    if (!name || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: name, lat, lng" },
        { status: 400 }
      );
    }

    const sql = getNeonSql();
    const [inserted] = await sql`
      INSERT INTO massifs (name, wilaya_id, lat, lng, risk_level, area_hectares)
      VALUES (
        ${name}, 
        ${wilaya_id ? parseInt(wilaya_id) : null}, 
        ${parseFloat(lat)}, 
        ${parseFloat(lng)}, 
        ${risk_level || "Medium"}, 
        ${area_hectares ? parseFloat(area_hectares) : 1000.0}
      )
      RETURNING *
    `;

    return NextResponse.json({ ok: true, data: inserted }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to insert massif" },
      { status: 500 }
    );
  }
}
