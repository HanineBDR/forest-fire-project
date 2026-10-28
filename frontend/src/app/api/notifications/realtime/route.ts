import { NextRequest } from "next/server";
import { fetchNotificationsFromDb } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "all";

  const encoder = new TextEncoder();
  let lastSeenId = 0;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ role, connected_at: new Date().toISOString() })}\n\n`
        )
      );

      // Fetch initial latest id
      try {
        const initial = await fetchNotificationsFromDb(role, false, 1);
        if (initial.length > 0) {
          lastSeenId = initial[0].id;
        }
      } catch (e) {
        // Continue
      }

      const interval = setInterval(async () => {
        try {
          const latest = await fetchNotificationsFromDb(role, false, 5);
          const newItems = latest.filter((item) => item.id > lastSeenId);

          if (newItems.length > 0) {
            lastSeenId = Math.max(...newItems.map((n) => n.id));
            for (const item of newItems) {
              controller.enqueue(
                encoder.encode(`event: new_notification\ndata: ${JSON.stringify(item)}\n\n`)
              );
            }
          } else {
            // Heartbeat ping
            controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`: ping error\n\n`));
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

