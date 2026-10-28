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

    const ack = await createAcknowledgmentInDb({
      alert_id,
      user_role,
      action,
      comment,
      target_role,
    });

    return NextResponse.json({ ok: true, data: ack }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to record acknowledgment" },
      { status: 500 }
    );
  }
}

