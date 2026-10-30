import { NextRequest, NextResponse } from "next/server";
import { fetchNotificationsFromDb, deleteAllNotificationsFromDb } from "@/lib/notifications";
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
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const { searchParams } = new URL(req.url);
      const role = searchParams.get("role");
      const unreadOnly = searchParams.get("unread_only") === "true";
      const limit = searchParams.get("limit") || "50";
      const query = new URLSearchParams();
      if (role) query.set("role", role);
      if (unreadOnly) query.set("unread_only", "true");
      query.set("limit", limit);

      const res = await fetch(`${backendUrl}/api/notifications?${query.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch (proxyError) {
      // Fall through to empty response
    }

    return NextResponse.json({
      ok: true,
      count: 0,
      unread_count: 0,
      data: [],
    });
  }
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
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${backendUrl}/api/notifications`, {
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
      { ok: false, error: error?.message || "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  try {
    await deleteAllNotificationsFromDb(role);
    return NextResponse.json({ ok: true, deleted: true });
  } catch (error: any) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const q = role ? `?role=${encodeURIComponent(role)}` : "";
      const res = await fetch(`${backendUrl}/api/notifications${q}`, { method: "DELETE" });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch {
      // Fall through
    }
    return NextResponse.json({ ok: true, deleted: true });
  }
}
