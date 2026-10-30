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
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get("limit") || "50", 10);
      const res = await fetch(`${backendUrl}/api/notifications/timeline?limit=${limit}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch (proxyError) {
      // Fall through
    }
    return NextResponse.json({
      ok: true,
      count: 0,
      data: [],
    });
  }
}

