import { NextRequest, NextResponse } from "next/server";
import { fetchTimelineFromDb } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const timeline = await fetchTimelineFromDb(limit);

    return NextResponse.json({
      ok: true,
      count: timeline.length,
      data: timeline,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}

