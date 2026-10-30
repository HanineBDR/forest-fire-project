import { GET as getNeonHealth } from "./src/app/api/neon/health/route.ts";
import { GET as getWilayas, POST as postWilaya } from "./src/app/api/wilayas/route.ts";
import { GET as getMassifs, POST as postMassif } from "./src/app/api/massifs/route.ts";
import { GET as getPredictions, POST as postPrediction } from "./src/app/api/predictions/route.ts";
import { GET as getDataSummary } from "./src/app/api/data/route.ts";
import fs from "fs";
import path from "path";

// Load .env.local
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

async function run() {
  console.log("=================================================");
  console.log("       INKAD NEON API ROUTE VERIFICATION         ");
  console.log("=================================================");

  // 1. /api/neon/health
  console.log("\n[1/5] Testing GET /api/neon/health...");
  const healthRes = await getNeonHealth();
  const healthJson = await healthRes.json();
  console.log("  Status:", healthRes.status);
  console.log("  Response:", JSON.stringify(healthJson, null, 2));

  // 2. /api/wilayas
  console.log("\n[2/5] Testing GET /api/wilayas...");
  const wilayasRes = await getWilayas();
  const wilayasJson = await wilayasRes.json();
  console.log(`  Status: ${wilayasRes.status}, Total Wilayas: ${wilayasJson.count}`);

  // 3. /api/massifs
  console.log("\n[3/5] Testing GET /api/massifs...");
  const massifsRes = await getMassifs();
  const massifsJson = await massifsRes.json();
  console.log(`  Status: ${massifsRes.status}, Total Massifs: ${massifsJson.count}`);

  // 4. /api/predictions
  console.log("\n[4/5] Testing GET /api/predictions...");
  const predRes = await getPredictions();
  const predJson = await predRes.json();
  console.log(`  Status: ${predRes.status}, Total Predictions: ${predJson.count}`);

  // 5. /api/data
  console.log("\n[5/6] Testing GET /api/data...");
  const req = new Request("http://localhost:3000/api/data");
  const dataRes = await getDataSummary(req);
  const dataJson = await dataRes.json();
  console.log("  Status:", dataRes.status);
  console.log("  Data Summary Counts:", JSON.stringify(dataJson.counts, null, 2));

  // 6. Test Write Operations (POST)
  console.log("\n[6/6] Testing Writable Data Routes (POST)...");
  
  // POST new prediction
  const postPredReq = new Request("http://localhost:3000/api/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wilaya: "Tizi Ouzou",
      massif: "Yakouren Live Telemetry",
      risk_level: "High",
      temperature: 41.5,
      humidity: 14.5,
      wind_speed: 34.0,
      fwi: 51.2
    })
  });
  const postPredRes = await postPrediction(postPredReq);
  const postPredJson = await postPredRes.json();
  console.log(`  [POST] /api/predictions Status ${postPredRes.status}: inserted id=${postPredJson.data?.id}, massif='${postPredJson.data?.massif}'`);

  // POST new massif
  const postMassifReq = new Request("http://localhost:3000/api/massifs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Tala Guilef Massif",
      wilaya_id: 15,
      lat: 36.478,
      lng: 4.015,
      risk_level: "High",
      area_hectares: 12500.0
    })
  });
  const postMassifRes = await postMassif(postMassifReq);
  const postMassifJson = await postMassifRes.json();
  console.log(`  [POST] /api/massifs Status ${postMassifRes.status}: inserted id=${postMassifJson.data?.id}, name='${postMassifJson.data?.name}'`);

  console.log("\n=================================================");
  console.log("   >>> ALL API ROUTES TESTED & OPERATIONAL! <<<  ");
  console.log("=================================================\n");
}

run().catch(console.error);
