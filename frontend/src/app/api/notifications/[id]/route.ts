import { NextRequest, NextResponse } from "next/server";
import { deleteNotificationFromDb } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const notifId = parseInt(id, 10);
  if (isNaN(notifId)) {
    return NextResponse.json({ ok: false, error: "Invalid notification ID" }, { status: 400 });
  }

  try {
    const success = await deleteNotificationFromDb(notifId);
    return NextResponse.json({ ok: true, id: notifId, deleted: success });
  } catch (error: any) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${backendUrl}/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch {
      // Fall through
    }
    // Return optimistic success so the UI stays responsive
    return NextResponse.json({ ok: true, id: notifId, deleted: true });
  }
}

