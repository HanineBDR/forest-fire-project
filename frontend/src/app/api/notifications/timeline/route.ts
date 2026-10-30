import { NextRequest, NextResponse } from "next/server";
import { fetchTimelineFromDb } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const timeline = await fetchTimelineFromDb(limit);

    const normalized = timeline.map((item: any) => ({
      ...item,
      item_type: item.item_type || item.type || "notification",
    }));

    return NextResponse.json({
      ok: true,
      count: normalized.length,
      data: normalized,
      timeline: normalized,
    });
  } catch (error: any) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get("limit") || "50", 10);
      const res = await fetch(`${backendUrl}/api/notifications/timeline?limit=${limit}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const raw = Array.isArray(json.data) ? json.data : (Array.isArray(json.timeline) ? json.timeline : []);
        const normalized = raw.map((item: any) => ({
          ...item,
          item_type: item.item_type || item.type || "notification",
        }));
        return NextResponse.json({
          ok: true,
          count: normalized.length,
          data: normalized,
          timeline: normalized,
        });
      }
    } catch (proxyError) {
      // Fall through
    }
    return NextResponse.json({
      ok: true,
      count: 0,
      data: [],
      timeline: [],
    });
  }
}
