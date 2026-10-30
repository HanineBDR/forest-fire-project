import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit") || "50";

    const query = new URLSearchParams();
    if (status) query.set("status", status);
    query.set("limit", limit);

    const res = await fetch(`${backendUrl}/api/community/reports?${query.toString()}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Backend offline fallback handled cleanly
  }

  return NextResponse.json({ count: 0, reports: [] });
}
