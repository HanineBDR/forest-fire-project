/**
 * IN9AD Neon Cloud Backend Primitives Integration
 * Lakebase Postgres, Object Storage, Functions, Auth, Realtime
 */

import { neon, Pool } from "@neondatabase/serverless";

// 1. Lakebase Postgres
export function getNeonSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }
  return neon(connectionString);
}

let cachedPool: Pool | null = null;
export function getNeonPool() {
  if (!cachedPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not defined");
    }
    cachedPool = new Pool({ connectionString });
  }
  return cachedPool;
}

// 2. Neon Object Storage (S3-compatible)
let cachedS3Client: any = null;
export async function getNeonStorageClient(): Promise<any> {
  if (!cachedS3Client) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const endpoint = process.env.AWS_ENDPOINT_URL_S3;
    const region = process.env.AWS_REGION || "us-east-2";

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      throw new Error("Neon Object Storage credentials or endpoint are missing in environment");
    }

    try {
      const { S3Client } = await import("@aws-sdk/client-s3");
      cachedS3Client = new S3Client({
        region,
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
      });
    } catch (e: any) {
      throw new Error(`Neon Object Storage client init failed: ${e.message}`);
    }
  }
  return cachedS3Client;
}

export async function uploadToNeonStorage(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string = "application/octet-stream",
  bucket: string = "assets"
) {
  const client = await getNeonStorageClient();
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  return await client.send(command);
}

export async function listNeonStorageFiles(bucket: string = "assets") {
  const client = await getNeonStorageClient();
  const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    MaxKeys: 100,
  });
  const res = await client.send(command);
  return res.Contents || [];
}

// 3. Neon Functions
export async function invokeNeonFunction(functionName: string = "hello"): Promise<{ status: number; text: string }> {
  const baseUrl = process.env.NEON_FUNCTION_HELLO_BASE_URL || process.env.NEXT_PUBLIC_NEON_FUNCTION_HELLO_URL;
  if (!baseUrl) {
    throw new Error("NEON_FUNCTION_HELLO_BASE_URL is not set");
  }
  const url = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Accept": "text/plain" },
  });
  const text = await res.text();
  return { status: res.status, text };
}

// 4. Neon Auth (Managed Better Auth)
export async function checkNeonAuthHealth(): Promise<{ status: number; ok: boolean }> {
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  if (!jwksUrl) {
    throw new Error("NEON_AUTH_JWKS_URL is not set");
  }
  const res = await fetch(jwksUrl, {
    method: "GET",
    headers: { "Accept": "application/json" },
  });
  return { status: res.status, ok: res.ok };
}

// 5. Neon Realtime Config
export function getNeonRealtimeConfig() {
  return {
    url: process.env.NEON_REALTIME_URL || process.env.NEXT_PUBLIC_NEON_REALTIME_URL || null,
    hasSecret: !!process.env.NEON_REALTIME_SECRET,
  };
}
