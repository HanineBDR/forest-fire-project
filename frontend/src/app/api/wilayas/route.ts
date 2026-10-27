import { NextRequest, NextResponse } from "next/server";
import { getNeonSql } from "@/lib/neon";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT id, name, lat, lng, region 
      FROM wilayas 
      ORDER BY id ASC
    `;
    return NextResponse.json({ ok: true, count: rows.length, data: rows });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to fetch wilayas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, lat, lng, region } = body;

    if (!id || !name || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: id, name, lat, lng" },
        { status: 400 }
      );
    }

    const sql = getNeonSql();
    const [inserted] = await sql`
      INSERT INTO wilayas (id, name, lat, lng, region)
      VALUES (${parseInt(id)}, ${name}, ${parseFloat(lat)}, ${parseFloat(lng)}, ${region || "Northern Algeria"})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        region = EXCLUDED.region
      RETURNING *
    `;

    return NextResponse.json({ ok: true, data: inserted }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to insert wilaya" },
      { status: 500 }
    );
  }
}
