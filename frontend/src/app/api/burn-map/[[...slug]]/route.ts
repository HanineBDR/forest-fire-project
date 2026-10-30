import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;
  const subpath = slug && slug.length > 0 ? slug.join("/") : "";
  const backendUrl = subpath ? `${API_BASE}/burn-map/${subpath}` : `${API_BASE}/burn-map`;

  // 1. Try fetching live from FastAPI backend with a quick timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(backendUrl, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const html = await res.text();
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60",
        },
      });
    }
  } catch {
    // Backend offline or unreachable -> fallback to static files
  }

  // 2. Fallback to local static HTML files
  try {
    let targetFileName = "algeria_burn_map.html";
    if (slug && slug.length >= 2 && slug[0] === "history") {
      const period = slug[1].replace(".html", "");
      targetFileName = `algeria_burn_map_${period}.html`;
    }

    const publicHistoryPath = path.join(process.cwd(), "public", "history", targetFileName);
    const backendHistoryPath = path.join(process.cwd(), "..", "backend", "ml", "outputs", "history", targetFileName);
    const defaultPublicPath = path.join(process.cwd(), "public", "algeria_burn_map.html");

    let filePathToRead = "";
    if (fs.existsSync(publicHistoryPath)) {
      filePathToRead = publicHistoryPath;
    } else if (fs.existsSync(backendHistoryPath)) {
      filePathToRead = backendHistoryPath;
    } else if (fs.existsSync(defaultPublicPath)) {
      filePathToRead = defaultPublicPath;
    }

    if (filePathToRead && fs.existsSync(filePathToRead)) {
      const content = fs.readFileSync(filePathToRead, "utf-8");
      return new Response(content, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    }
  } catch (fsErr) {
    console.error("Failed to read static fallback burn map:", fsErr);
  }

  return new Response("<h3>Interactive Burn Map could not be loaded.</h3>", {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

