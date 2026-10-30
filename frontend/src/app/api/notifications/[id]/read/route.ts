import { NextRequest, NextResponse } from "next/server";
import { markNotificationReadInDb } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notifId = parseInt(id, 10);
    if (isNaN(notifId)) {
      return NextResponse.json({ ok: false, error: "Invalid notification ID" }, { status: 400 });
    }

    const success = await markNotificationReadInDb(notifId);
    if (!success) {
      return NextResponse.json({ ok: false, error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: notifId, is_read: true });
  } catch (error: any) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const { id } = await params;
      const res = await fetch(`${backendUrl}/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch (proxyError) {
      // Fall through
    }
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to mark notification read" },
      { status: 500 }
    );
  }
}

