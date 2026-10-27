import { NextResponse } from "next/server";
import {
  getNeonSql,
  getNeonStorageClient,
  listNeonStorageFiles,
  uploadToNeonStorage,
  invokeNeonFunction,
  checkNeonAuthHealth,
  getNeonRealtimeConfig,
} from "@/lib/neon";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    services: {},
  };

  // 1. Test Lakebase Postgres
  try {
    const sql = getNeonSql();
    const rows = await sql`SELECT 1 as connected, NOW() as server_time, version() as pg_version`;
    results.services.postgres = {
      status: "healthy",
      connected: true,
      serverTime: rows[0]?.server_time,
      version: rows[0]?.pg_version,
    };
  } catch (error: any) {
    results.services.postgres = {
      status: "error",
      error: error?.message || "Failed to query Lakebase Postgres",
    };
  }

  // 2. Test Neon Object Storage (S3)
  try {
    const testKey = `healthcheck/ping-${Date.now()}.txt`;
    await uploadToNeonStorage(testKey, "Neon Object Storage is active", "text/plain", "assets");
    const files = await listNeonStorageFiles("assets");
    results.services.objectStorage = {
      status: "healthy",
      bucket: "assets",
      filesFound: files.length,
      sampleFileUploaded: testKey,
    };
  } catch (error: any) {
    results.services.objectStorage = {
      status: "error",
      error: error?.message || "Failed to interact with Neon Object Storage",
    };
  }

  // 3. Test Neon Functions
  try {
    const fnResult = await invokeNeonFunction("hello");
    results.services.functions = {
      status: fnResult.status === 200 ? "healthy" : "warning",
      statusCode: fnResult.status,
      response: fnResult.text.trim(),
    };
  } catch (error: any) {
    results.services.functions = {
      status: "error",
      error: error?.message || "Failed to invoke Neon Function",
    };
  }

  // 4. Test Neon Auth (Managed Better Auth)
  try {
    const authResult = await checkNeonAuthHealth();
    results.services.auth = {
      status: authResult.ok ? "healthy" : "warning",
      statusCode: authResult.status,
      provider: "Managed Better Auth",
    };
  } catch (error: any) {
    results.services.auth = {
      status: "error",
      error: error?.message || "Failed to check Neon Auth endpoint",
    };
  }

  // 5. Realtime config
  try {
    const rtConfig = getNeonRealtimeConfig();
    results.services.realtime = {
      status: rtConfig.url ? "configured" : "not_configured",
      endpoint: rtConfig.url,
      hasSecret: rtConfig.hasSecret,
    };
  } catch (error: any) {
    results.services.realtime = {
      status: "error",
      error: error?.message || "Failed to inspect Realtime config",
    };
  }

  const allPassed =
    results.services.postgres?.status === "healthy" &&
    results.services.objectStorage?.status === "healthy" &&
    results.services.functions?.status === "healthy" &&
    results.services.auth?.status === "healthy";

  return NextResponse.json(
    {
      ok: allPassed,
      ...results,
    },
    { status: allPassed ? 200 : 207 }
  );
}
