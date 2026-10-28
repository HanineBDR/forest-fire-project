import { NextRequest, NextResponse } from "next/server";
import { fetchNotificationsFromDb } from "@/lib/notifications";
import { getNeonSql } from "@/lib/neon";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const unreadOnly = searchParams.get("unread_only") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const rows = await fetchNotificationsFromDb(role, unreadOnly, limit);
    const unreadCount = rows.filter((r) => !r.is_read).length;

    return NextResponse.json({
      ok: true,
      count: rows.length,
      unread_count: unreadCount,
      data: rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    if (!sender_role || !recipient_role || !title || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const sql = getNeonSql();
    const [inserted] = await sql`
      INSERT INTO notifications (
        alert_id, sender_role, recipient_role, title, message,
        risk_level, risk_score, massif, wilaya, lat, lon, is_read, created_at
      ) VALUES (
        ${alert_id || null},
        ${sender_role},
        ${recipient_role},
        ${title},
        ${message},
        ${risk_level || "Elevé"},
        ${risk_score ? parseFloat(risk_score) : null},
        ${massif || null},
        ${wilaya || null},
        ${lat ? parseFloat(lat) : null},
        ${lon ? parseFloat(lon) : null},
        FALSE,
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({ ok: true, data: inserted }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to create notification" },
      { status: 500 }
    );
  }
}

