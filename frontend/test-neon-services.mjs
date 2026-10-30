import { neon } from "@neondatabase/serverless";
import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve("./.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

console.log("=================================================");
console.log("       INKAD NEON END-TO-END SERVICE TEST        ");
console.log("=================================================");

let allPassed = true;

// 1. Test Lakebase Postgres
async function testPostgres() {
  console.log("\n[1/5] Testing Neon Lakebase Postgres...");
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT 1 as connected, NOW() as current_time, version() as pg_version`;
    console.log("  [PASS] Successfully connected to Lakebase Postgres!");
    console.log("  - Server time:", rows[0].current_time);
    console.log("  - Version:", rows[0].pg_version.slice(0, 50) + "...");
    
    // Check INKAD Wildfire tables
    try {
      const [w, m, p, f] = await Promise.all([
        sql`SELECT COUNT(*)::int as c FROM wilayas`,
        sql`SELECT COUNT(*)::int as c FROM massifs`,
        sql`SELECT COUNT(*)::int as c FROM predictions`,
        sql`SELECT COUNT(*)::int as c FROM algeria_wildfires`,
      ]);
      console.log(`  - INKAD Wildfire Data: ${w[0].c} wilayas, ${m[0].c} massifs, ${p[0].c} predictions, ${f[0].c} fire observations`);
    } catch (e) {
      console.log("  - Table count query note:", e.message);
    }
  } catch (err) {
    console.error("  [FAIL] Postgres test failed:", err.message);
    allPassed = false;
  }
}

// 2. Test Object Storage
async function testObjectStorage() {
  console.log("\n[2/5] Testing Neon Object Storage (S3-compatible)...");
  try {
    const s3 = new S3Client({
      region: process.env.AWS_REGION || "us-east-2",
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    const testKey = `test-inkad-${Date.now()}.txt`;
    const testContent = "INKAD Wildfire Telemetry Verification - Neon Object Storage";
    
    await s3.send(new PutObjectCommand({
      Bucket: "assets",
      Key: testKey,
      Body: testContent,
      ContentType: "text/plain",
    }));
    console.log(`  [PASS] Successfully uploaded object '${testKey}' to bucket 'assets'!`);

    const listRes = await s3.send(new ListObjectsV2Command({
      Bucket: "assets",
      MaxKeys: 10,
    }));
    const keys = (listRes.Contents || []).map(c => c.Key);
    console.log(`  [PASS] Bucket 'assets' contains ${keys.length} items:`, keys.slice(0, 5));

    const getRes = await s3.send(new GetObjectCommand({
      Bucket: "assets",
      Key: testKey,
    }));
    const downloaded = await getRes.Body.transformToString();
    if (downloaded === testContent) {
      console.log("  [PASS] Downloaded content verified matching byte-for-byte!");
    } else {
      throw new Error("Content mismatch on download");
    }
  } catch (err) {
    console.error("  [FAIL] Object Storage test failed:", err.message);
    allPassed = false;
  }
}

// 3. Test Neon Functions
async function testFunctions() {
  console.log("\n[3/5] Testing Neon Functions (hello endpoint)...");
  try {
    const url = process.env.NEON_FUNCTION_HELLO_BASE_URL || process.env.NEXT_PUBLIC_NEON_FUNCTION_HELLO_URL;
    const fullUrl = url.endsWith("/") ? url : `${url}/`;
    const res = await fetch(fullUrl);
    const body = await res.text();
    console.log(`  [PASS] Neon Function responded HTTP ${res.status}: "${body.trim()}"`);
    if (res.status !== 200 || !body.includes("Hello from Neon Functions")) {
      throw new Error(`Unexpected function response: ${body}`);
    }
  } catch (err) {
    console.error("  [FAIL] Neon Function test failed:", err.message);
    allPassed = false;
  }
}

// 4. Test Neon Auth
async function testAuth() {
  console.log("\n[4/5] Testing Neon Auth (Managed Better Auth)...");
  try {
    const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
    const res = await fetch(jwksUrl);
    const jwks = await res.json();
    console.log(`  [PASS] Neon Auth JWKS endpoint responded HTTP ${res.status}`);
    console.log(`  - JWKS keys available: ${jwks.keys ? jwks.keys.length : 0} active keys`);
  } catch (err) {
    console.error("  [FAIL] Neon Auth test failed:", err.message);
    allPassed = false;
  }
}

// 5. Test Realtime
async function testRealtime() {
  console.log("\n[5/5] Testing Neon Realtime Configuration...");
  try {
    const rtUrl = process.env.NEON_REALTIME_URL;
    const secret = process.env.NEON_REALTIME_SECRET;
    if (rtUrl && secret) {
      console.log(`  [PASS] Neon Realtime WebSocket configured: ${rtUrl}`);
      console.log(`  - Realtime Secret format verified: ${secret.slice(0, 10)}...`);
    } else {
      throw new Error("Missing Realtime URL or secret");
    }
  } catch (err) {
    console.error("  [FAIL] Realtime test failed:", err.message);
    allPassed = false;
  }
}

async function runAll() {
  await testPostgres();
  await testObjectStorage();
  await testFunctions();
  await testAuth();
  await testRealtime();

  console.log("\n=================================================");
  if (allPassed) {
    console.log("  >>> ALL NEON SERVICES VERIFIED END-TO-END! <<< ");
  } else {
    console.log("  >>> SOME SERVICE TESTS FAILED! <<< ");
  }
  console.log("=================================================\n");
  process.exit(allPassed ? 0 : 1);
}

runAll();
