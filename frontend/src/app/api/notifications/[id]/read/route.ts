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
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to mark notification read" },
      { status: 500 }
    );
  }
}

