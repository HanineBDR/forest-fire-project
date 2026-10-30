import { NextRequest, NextResponse } from "next/server";
import { getNeonSql } from "@/lib/neon";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const sql = getNeonSql();

    if (type === "wilayas") {
      const rows = await sql`SELECT * FROM wilayas ORDER BY id ASC`;
      return NextResponse.json({ ok: true, data: rows });
    }

    if (type === "massifs") {
      const rows = await sql`SELECT * FROM massifs ORDER BY id ASC`;
      return NextResponse.json({ ok: true, data: rows });
    }

    if (type === "predictions") {
      const rows = await sql`SELECT * FROM predictions ORDER BY created_at DESC LIMIT 50`;
      return NextResponse.json({ ok: true, data: rows });
    }

    if (type === "historical_fires") {
      const rows = await sql`SELECT * FROM historical_fires ORDER BY date DESC`;
      return NextResponse.json({ ok: true, data: rows });
    }

    if (type === "burn_stats") {
      const rows = await sql`SELECT * FROM burn_stats ORDER BY total_burned_points DESC`;
      return NextResponse.json({ ok: true, data: rows });
    }

    if (type === "alerts") {
      const rows = await sql`SELECT * FROM alerts ORDER BY risk_score DESC`;
      return NextResponse.json({ ok: true, data: rows });
    }

    // Default summary
    const [wCount, mCount, pCount, hCount, bCount, aCount, obsCount] = await Promise.all([
      sql`SELECT COUNT(*)::int as c FROM wilayas`,
      sql`SELECT COUNT(*)::int as c FROM massifs`,
      sql`SELECT COUNT(*)::int as c FROM predictions`,
      sql`SELECT COUNT(*)::int as c FROM historical_fires`,
      sql`SELECT COUNT(*)::int as c FROM burn_stats`,
      sql`SELECT COUNT(*)::int as c FROM alerts`,
      sql`SELECT COUNT(*)::int as c FROM algeria_wildfires`,
    ]);

    return NextResponse.json({
      ok: true,
      branch: process.env.NEON_BRANCH || "INKAD",
      counts: {
        wilayas: wCount[0]?.c || 0,
        massifs: mCount[0]?.c || 0,
        predictions: pCount[0]?.c || 0,
        historical_fires: hCount[0]?.c || 0,
        burn_stats: bCount[0]?.c || 0,
        alerts: aCount[0]?.c || 0,
        algeria_wildfires: obsCount[0]?.c || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to query Neon data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, ...payload } = body;
    const sql = getNeonSql();

    if (type === "massif") {
      const { name, wilaya_id, lat, lng, risk_level, area_hectares } = payload;
      const [row] = await sql`
        INSERT INTO massifs (name, wilaya_id, lat, lng, risk_level, area_hectares)
        VALUES (${name}, ${wilaya_id || null}, ${parseFloat(lat)}, ${parseFloat(lng)}, ${risk_level || "Medium"}, ${parseFloat(area_hectares) || 1000.0})
        RETURNING *
      `;
      return NextResponse.json({ ok: true, data: row }, { status: 201 });
    }

    if (type === "prediction") {
      const { wilaya, massif, risk_level, temperature, humidity, wind_speed, fwi } = payload;
      const [row] = await sql`
        INSERT INTO predictions (wilaya, massif, risk_level, temperature, humidity, wind_speed, fwi)
        VALUES (${wilaya}, ${massif}, ${risk_level}, ${parseFloat(temperature) || 30.0}, ${parseFloat(humidity) || 30.0}, ${parseFloat(wind_speed) || 15.0}, ${parseFloat(fwi) || 20.0})
        RETURNING *
      `;
      return NextResponse.json({ ok: true, data: row }, { status: 201 });
    }

    if (type === "wilaya") {
      const { id, name, lat, lng, region } = payload;
      const [row] = await sql`
        INSERT INTO wilayas (id, name, lat, lng, region)
        VALUES (${parseInt(id)}, ${name}, ${parseFloat(lat)}, ${parseFloat(lng)}, ${region || "Northern Algeria"})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, lat = EXCLUDED.lat, lng = EXCLUDED.lng, region = EXCLUDED.region
        RETURNING *
      `;
      return NextResponse.json({ ok: true, data: row }, { status: 201 });
    }

    if (type === "report") {
      const { title, data } = payload;
      const [row] = await sql`
        INSERT INTO reports (title, data)
        VALUES (${title}, ${JSON.stringify(data)})
        RETURNING *
      `;
      return NextResponse.json({ ok: true, data: row }, { status: 201 });
    }

    return NextResponse.json(
      { ok: false, error: `Unknown type: ${type}. Expected: massif, prediction, wilaya, or report.` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to insert data into Neon" },
      { status: 500 }
    );
  }
}
