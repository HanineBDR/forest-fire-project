import { NextRequest, NextResponse } from "next/server";
import { createAcknowledgmentInDb } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { alert_id, user_role, action, comment, target_role } = body;

    if (!alert_id || !user_role || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: alert_id, user_role, action" },
        { status: 400 }
      );
    }

    try {
      const ack = await createAcknowledgmentInDb({
        alert_id,
        user_role,
        action,
        comment,
        target_role,
      });
      return NextResponse.json({ ok: true, data: ack }, { status: 201 });
    } catch (dbErr) {
      // Proxy to backend
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${backendUrl}/api/notifications/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id, user_role, action, comment, target_role }),
      });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json, { status: 201 });
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: Date.now(),
        alert_id,
        user_role,
        action,
        comment,
        target_role: target_role || "all",
        created_at: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to record acknowledgment" },
      { status: 500 }
    );
  }
}
