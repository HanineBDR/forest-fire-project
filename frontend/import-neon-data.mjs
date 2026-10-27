import { neon } from "@neondatabase/serverless";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("ERROR: DATABASE_URL is not set in environment or .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

console.log("=================================================");
console.log("    IN9AD NEON DATABASE IMPORT (IN9AD BRANCH)    ");
console.log("=================================================");
console.log("Connecting to:", dbUrl.replace(/:[^:@]+@/, ":***@"));

const WILAYAS_DATA = [
  { id: 1, name: "Adrar", lat: 27.8742, lng: -0.2939, region: "South" },
  { id: 2, name: "Chlef", lat: 36.1653, lng: 1.3344, region: "North-West" },
  { id: 3, name: "Laghouat", lat: 33.8000, lng: 2.8651, region: "Central South" },
  { id: 4, name: "Oum El Bouaghi", lat: 35.8755, lng: 7.1135, region: "East" },
  { id: 5, name: "Batna", lat: 35.5559, lng: 6.1741, region: "Aurès / East" },
  { id: 6, name: "Béjaïa", lat: 36.7559, lng: 5.0843, region: "Kabylie / North" },
  { id: 7, name: "Biskra", lat: 34.8504, lng: 5.7281, region: "South-East" },
  { id: 8, name: "Béchar", lat: 31.6167, lng: -2.2167, region: "South-West" },
  { id: 9, name: "Blida", lat: 36.4700, lng: 2.8300, region: "Mitidja / North" },
  { id: 10, name: "Bouira", lat: 36.3749, lng: 3.9020, region: "Djurdjura / North" },
  { id: 11, name: "Tamanrasset", lat: 22.7850, lng: 5.5228, region: "Deep South" },
  { id: 12, name: "Tébessa", lat: 35.4042, lng: 8.1242, region: "East" },
  { id: 13, name: "Tlemcen", lat: 34.8783, lng: -1.3150, region: "West" },
  { id: 14, name: "Tiaret", lat: 35.3710, lng: 1.3170, region: "Hauts Plateaux West" },
  { id: 15, name: "Tizi Ouzou", lat: 36.7118, lng: 4.0459, region: "Grande Kabylie / North" },
  { id: 16, name: "Alger", lat: 36.7538, lng: 3.0588, region: "Center / Coast" },
  { id: 17, name: "Djelfa", lat: 34.6728, lng: 3.2630, region: "Hauts Plateaux Central" },
  { id: 18, name: "Jijel", lat: 36.8206, lng: 5.7667, region: "Corniche Kabyle / North" },
  { id: 19, name: "Sétif", lat: 36.1911, lng: 5.4137, region: "Hauts Plateaux East" },
  { id: 20, name: "Saïda", lat: 34.8303, lng: 0.1517, region: "West" },
  { id: 21, name: "Skikda", lat: 36.8762, lng: 6.9092, region: "Northeastern Coast" },
  { id: 22, name: "Sidi Bel Abbès", lat: 35.1899, lng: -0.6309, region: "West" },
  { id: 23, name: "Annaba", lat: 36.9000, lng: 7.7667, region: "Northeastern Coast" },
  { id: 24, name: "Guelma", lat: 36.4621, lng: 7.4261, region: "Northeast" },
  { id: 25, name: "Constantine", lat: 36.3650, lng: 6.6147, region: "East" },
  { id: 26, name: "Médéa", lat: 36.2642, lng: 2.7539, region: "Titteri / Center" },
  { id: 27, name: "Mostaganem", lat: 35.9312, lng: 0.0892, region: "North-West Coast" },
  { id: 28, name: "M'Sila", lat: 35.7058, lng: 4.5419, region: "Hauts Plateaux" },
  { id: 29, name: "Mascara", lat: 35.3966, lng: 0.1403, region: "West" },
  { id: 30, name: "Ouargla", lat: 31.9500, lng: 5.3167, region: "South-East" },
  { id: 31, name: "Oran", lat: 35.6971, lng: -0.6308, region: "North-West Coast" },
  { id: 32, name: "El Bayadh", lat: 33.6832, lng: 1.0193, region: "Hauts Plateaux South-West" },
  { id: 33, name: "Illizi", lat: 26.5073, lng: 8.4816, region: "South-East" },
  { id: 34, name: "Bordj Bou Arréridj", lat: 36.0732, lng: 4.7611, region: "Hauts Plateaux North" },
  { id: 35, name: "Boumerdès", lat: 36.7664, lng: 3.4772, region: "North Coast" },
  { id: 36, name: "El Tarf", lat: 36.7672, lng: 8.3138, region: "Northeastern Coast" },
  { id: 37, name: "Tindouf", lat: 27.6711, lng: -8.1474, region: "South-West" },
  { id: 38, name: "Tissemsilt", lat: 35.6072, lng: 1.8108, region: "Ouarsenis / Center" },
  { id: 39, name: "El Oued", lat: 33.3683, lng: 6.8674, region: "South-East" },
  { id: 40, name: "Khenchela", lat: 35.4358, lng: 7.1433, region: "Aurès / East" },
  { id: 41, name: "Souk Ahras", lat: 36.2864, lng: 7.9511, region: "Northeast" },
  { id: 42, name: "Tipaza", lat: 36.5897, lng: 2.4475, region: "North Coast" },
  { id: 43, name: "Mila", lat: 36.4503, lng: 6.2644, region: "Northeast" },
  { id: 44, name: "Aïn Defla", lat: 36.2644, lng: 1.9679, region: "Center-West" },
  { id: 45, name: "Naâma", lat: 33.2667, lng: -0.3167, region: "South-West" },
  { id: 46, name: "Aïn Témouchent", lat: 35.2975, lng: -1.1404, region: "North-West Coast" },
  { id: 47, name: "Ghardaïa", lat: 32.4909, lng: 3.6736, region: "Mzab / South" },
  { id: 48, name: "Relizane", lat: 35.7373, lng: 0.5559, region: "North-West" },
  { id: 49, name: "Timimoun", lat: 29.2639, lng: 0.2310, region: "South" },
  { id: 50, name: "Bordj Badji Mokhtar", lat: 21.3283, lng: 0.9542, region: "Deep South" },
  { id: 51, name: "Ouled Djellal", lat: 34.4333, lng: 5.0667, region: "South" },
  { id: 52, name: "Béni Abbès", lat: 30.1333, lng: -2.1667, region: "South-West" },
  { id: 53, name: "In Salah", lat: 27.1936, lng: 2.4608, region: "Deep South" },
  { id: 54, name: "In Guezzam", lat: 19.5714, lng: 5.7725, region: "Deep South" },
  { id: 55, name: "Touggourt", lat: 33.1053, lng: 6.0580, region: "South-East" },
  { id: 56, name: "Djanet", lat: 24.5539, lng: 9.4858, region: "Deep South" },
  { id: 57, name: "El M'Ghair", lat: 33.9500, lng: 5.9167, region: "South-East" },
  { id: 58, name: "El Menia", lat: 30.5833, lng: 2.8833, region: "South" }
];

const MASSIFS_DATA = [
  { name: "Yakouren", wilaya_id: 15, lat: 36.735, lng: 4.435, risk_level: "High", area_hectares: 20500.0 },
  { name: "Akfadou", wilaya_id: 6, lat: 36.650, lng: 4.550, risk_level: "High", area_hectares: 17200.0 },
  { name: "Chrea", wilaya_id: 9, lat: 36.416, lng: 2.833, risk_level: "High", area_hectares: 26000.0 },
  { name: "Djurdjura", wilaya_id: 10, lat: 36.450, lng: 4.120, risk_level: "High", area_hectares: 18500.0 },
  { name: "El Kala", wilaya_id: 36, lat: 36.890, lng: 8.440, risk_level: "High", area_hectares: 76000.0 },
  { name: "Theniet El Had", wilaya_id: 38, lat: 35.867, lng: 2.017, risk_level: "Medium", area_hectares: 3425.0 },
  { name: "Belezma", wilaya_id: 5, lat: 35.580, lng: 6.030, risk_level: "Medium", area_hectares: 26250.0 },
  { name: "Babors", wilaya_id: 19, lat: 36.550, lng: 5.480, risk_level: "High", area_hectares: 17000.0 },
  { name: "Gouraya", wilaya_id: 6, lat: 36.760, lng: 5.060, risk_level: "Medium", area_hectares: 2080.0 },
  { name: "Mizrana", wilaya_id: 15, lat: 36.780, lng: 4.080, risk_level: "High", area_hectares: 8500.0 },
  { name: "Aurès - Chelia", wilaya_id: 5, lat: 35.310, lng: 6.640, risk_level: "Medium", area_hectares: 14000.0 }
];

async function createSchema() {
  console.log("\n[1/6] Creating Schema in IN9AD branch...");

  await sql`
    CREATE TABLE IF NOT EXISTS wilayas (
      id INT PRIMARY KEY,
      name TEXT NOT NULL,
      lat FLOAT NOT NULL,
      lng FLOAT NOT NULL,
      region TEXT NOT NULL
    );
  `;
  console.log("  - Table 'wilayas' ready");

  await sql`
    CREATE TABLE IF NOT EXISTS massifs (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      wilaya_id INT,
      lat FLOAT NOT NULL,
      lng FLOAT NOT NULL,
      risk_level TEXT NOT NULL,
      area_hectares FLOAT NOT NULL
    );
  `;
  console.log("  - Table 'massifs' ready");

  await sql`
    CREATE TABLE IF NOT EXISTS predictions (
      id SERIAL PRIMARY KEY,
      wilaya TEXT NOT NULL,
      massif TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      temperature FLOAT NOT NULL,
      humidity FLOAT NOT NULL,
      wind_speed FLOAT NOT NULL,
      fwi FLOAT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  console.log("  - Table 'predictions' ready");

  await sql`
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  console.log("  - Table 'reports' ready");

  await sql`
    CREATE TABLE IF NOT EXISTS historical_fires (
      id SERIAL PRIMARY KEY,
      wilaya TEXT NOT NULL,
      massif TEXT NOT NULL,
      date DATE NOT NULL,
      area_burned FLOAT NOT NULL,
      cause TEXT NOT NULL
    );
  `;
  console.log("  - Table 'historical_fires' ready");

  await sql`
    CREATE TABLE IF NOT EXISTS burn_stats (
      id SERIAL PRIMARY KEY,
      wilaya_code INT,
      wilaya_name TEXT,
      region TEXT,
      total_burned_points INT,
      estimated_burned_area_ha FLOAT,
      risk_category TEXT,
      top_vegetation_type TEXT
    );
  `;
  console.log("  - Table 'burn_stats' ready");

  await sql`
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      alert_id TEXT UNIQUE,
      lat FLOAT,
      lon FLOAT,
      wilaya TEXT,
      forest_name TEXT,
      risk_score FLOAT,
      risk_level TEXT,
      temp FLOAT,
      humidity FLOAT,
      wind FLOAT,
      wind_dir TEXT,
      status TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  console.log("  - Table 'alerts' ready");

  await sql`
    CREATE TABLE IF NOT EXISTS algeria_wildfires (
      id SERIAL PRIMARY KEY,
      lat FLOAT,
      lon FLOAT,
      temp FLOAT,
      humidity FLOAT,
      wind_speed FLOAT,
      precipitation FLOAT,
      vegetation_index FLOAT,
      month INT,
      fire_occurred INT
    );
  `;
  console.log("  - Table 'algeria_wildfires' ready");
}

async function seedWilayas() {
  console.log("\n[2/6] Seeding Wilayas of Algeria...");
  const countRes = await sql`SELECT COUNT(*)::int as count FROM wilayas`;
  if (countRes[0].count === 0) {
    for (const w of WILAYAS_DATA) {
      await sql`
        INSERT INTO wilayas (id, name, lat, lng, region)
        VALUES (${w.id}, ${w.name}, ${w.lat}, ${w.lng}, ${w.region})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`  [OK] Seeded ${WILAYAS_DATA.length} wilayas!`);
  } else {
    console.log(`  [SKIP] Wilayas table already has ${countRes[0].count} rows.`);
  }
}

async function seedMassifs() {
  console.log("\n[3/6] Seeding Strategic Forest Massifs...");
  const countRes = await sql`SELECT COUNT(*)::int as count FROM massifs`;
  if (countRes[0].count === 0) {
    for (const m of MASSIFS_DATA) {
      await sql`
        INSERT INTO massifs (name, wilaya_id, lat, lng, risk_level, area_hectares)
        VALUES (${m.name}, ${m.wilaya_id}, ${m.lat}, ${m.lng}, ${m.risk_level}, ${m.area_hectares})
      `;
    }
    console.log(`  [OK] Seeded ${MASSIFS_DATA.length} strategic forest massifs!`);
  } else {
    console.log(`  [SKIP] Massifs table already has ${countRes[0].count} rows.`);
  }
}

async function importDatasets() {
  console.log("\n[4/6] Importing Dataset Files...");

  // A. Import burn_stats.csv
  const burnStatsPath = path.resolve("../backend/ml/outputs/burn_stats.csv");
  if (fs.existsSync(burnStatsPath)) {
    const countRes = await sql`SELECT COUNT(*)::int as count FROM burn_stats`;
    if (countRes[0].count === 0) {
      const content = fs.readFileSync(burnStatsPath, "utf-8").trim();
      const lines = content.split("\n").slice(1);
      for (const line of lines) {
        const parts = line.split(",").map(p => p.trim());
        if (parts.length >= 7) {
          await sql`
            INSERT INTO burn_stats (wilaya_code, wilaya_name, region, total_burned_points, estimated_burned_area_ha, risk_category, top_vegetation_type)
            VALUES (${parseInt(parts[0])}, ${parts[1]}, ${parts[2]}, ${parseInt(parts[3])}, ${parseFloat(parts[4])}, ${parts[5]}, ${parts[6]})
          `;
        }
      }
      console.log(`  [OK] Imported burn_stats.csv (${lines.length} rows)`);
    } else {
      console.log(`  [SKIP] burn_stats table already has ${countRes[0].count} rows.`);
    }
  }

  // B. Import historical_fires from historical records
  const histCountRes = await sql`SELECT COUNT(*)::int as count FROM historical_fires`;
  if (histCountRes[0].count === 0) {
    const sampleHistoricalFires = [
      { wilaya: "Tizi Ouzou", massif: "Yakouren", date: "2023-08-11", area_burned: 4200.5, cause: "Heatwave & Sirocco (44°C)" },
      { wilaya: "Bejaia", massif: "Akfadou", date: "2023-08-12", area_burned: 3600.0, cause: "Extreme Gale Winds (Sirocco)" },
      { wilaya: "Bouira", massif: "Djurdjura / Tikjda", date: "2023-07-24", area_burned: 1850.0, cause: "Lightning Strike in Dense Scrub" },
      { wilaya: "Blida", massif: "Chrea", date: "2022-08-15", area_burned: 950.0, cause: "Agricultural Burning Spread" },
      { wilaya: "El Tarf", massif: "El Kala", date: "2022-08-17", area_burned: 5400.0, cause: "Cross-border Extreme Firestorm" },
      { wilaya: "Jijel", massif: "Babors", date: "2023-08-13", area_burned: 2100.0, cause: "Thermal Anomaly & Strong Wind" },
      { wilaya: "Tissemsilt", massif: "Theniet El Had", date: "2021-08-09", area_burned: 820.0, cause: "Summer Drought & High Temperature" },
      { wilaya: "Batna", massif: "Belezma", date: "2021-07-28", area_burned: 640.0, cause: "Dry Grassland Transition to Cedar" }
    ];
    for (const hf of sampleHistoricalFires) {
      await sql`
        INSERT INTO historical_fires (wilaya, massif, date, area_burned, cause)
        VALUES (${hf.wilaya}, ${hf.massif}, ${hf.date}, ${hf.area_burned}, ${hf.cause})
      `;
    }
    console.log(`  [OK] Seeded ${sampleHistoricalFires.length} historical wildfire firestorm events!`);
  } else {
    console.log(`  [SKIP] historical_fires table already has ${histCountRes[0].count} rows.`);
  }

  // C. Import sample predictions
  const predCountRes = await sql`SELECT COUNT(*)::int as count FROM predictions`;
  if (predCountRes[0].count === 0) {
    const pilotPredictions = [
      { wilaya: "Tizi Ouzou", massif: "Yakouren Forest", risk_level: "Extreme", temp: 42.8, humidity: 12.0, wind: 49.0, fwi: 64.2 },
      { wilaya: "Bejaia", massif: "Akfadou Massif", risk_level: "High", temp: 39.5, humidity: 18.0, wind: 36.0, fwi: 48.7 },
      { wilaya: "Bouira", massif: "Tikjda - Djurdjura", risk_level: "High", temp: 36.2, humidity: 22.0, wind: 32.0, fwi: 41.5 },
      { wilaya: "Blida", massif: "Chréa National Park", risk_level: "Moderate", temp: 32.4, humidity: 35.0, wind: 20.0, fwi: 24.8 },
      { wilaya: "El Tarf", massif: "El Kala National Park", risk_level: "High", temp: 37.8, humidity: 24.0, wind: 28.0, fwi: 38.9 },
      { wilaya: "Tissemsilt", massif: "Theniet El Had", risk_level: "Moderate", temp: 31.0, humidity: 40.0, wind: 18.0, fwi: 19.3 },
      { wilaya: "Batna", massif: "Belezma", risk_level: "Moderate", temp: 33.5, humidity: 30.0, wind: 22.0, fwi: 27.1 },
      { wilaya: "Setif / Jijel", massif: "Babors", risk_level: "High", temp: 38.0, humidity: 19.0, wind: 34.0, fwi: 45.2 }
    ];
    for (const p of pilotPredictions) {
      await sql`
        INSERT INTO predictions (wilaya, massif, risk_level, temperature, humidity, wind_speed, fwi)
        VALUES (${p.wilaya}, ${p.massif}, ${p.risk_level}, ${p.temp}, ${p.humidity}, ${p.wind}, ${p.fwi})
      `;
    }
    console.log(`  [OK] Seeded ${pilotPredictions.length} pilot predictions!`);
  } else {
    console.log(`  [SKIP] predictions table already has ${predCountRes[0].count} rows.`);
  }

  // D. Import reports
  const repCountRes = await sql`SELECT COUNT(*)::int as count FROM reports`;
  if (repCountRes[0].count === 0) {
    const seedReports = [
      {
        title: "DGF Crisis Alert Bulletin: Yakouren Massif",
        data: {
          zone: "Yakouren Forest (Tizi Ouzou)",
          risk_level: "Extreme",
          temp: "42.8°C",
          humidity: "12%",
          wind: "49 km/h (Sirocco)",
          fwi: 64.2,
          directive: "Pre-position 4 fire engines on N12 axis (Azazga-Yakouren) and alert mobile columns."
        }
      },
      {
        title: "Operational Briefing: Akfadou Ridge Corridor",
        data: {
          zone: "Akfadou Massif (Bejaia)",
          risk_level: "High",
          temp: "39.5°C",
          humidity: "18%",
          wind: "36 km/h",
          fwi: 48.7,
          directive: "Continuous aerial watch by coastal reconnaissance unit; alert communal watchtowers."
        }
      }
    ];
    for (const r of seedReports) {
      await sql`
        INSERT INTO reports (title, data)
        VALUES (${r.title}, ${JSON.stringify(r.data)})
      `;
    }
    console.log(`  [OK] Seeded ${seedReports.length} operational reports!`);
  } else {
    console.log(`  [SKIP] reports table already has ${repCountRes[0].count} rows.`);
  }

  // E. Import algeria_wildfire_dataset.csv (4,000+ rows) via multi-row batch insert
  const wildPath = path.resolve("../backend/ml/data/algeria_wildfire_dataset.csv");
  if (fs.existsSync(wildPath)) {
    const countRes = await sql`SELECT COUNT(*)::int as count FROM algeria_wildfires`;
    if (countRes[0].count < 4000) {
      console.log("  - Fast multi-row batch inserting algeria_wildfire_dataset.csv (4000+ observations)...");
      await sql`TRUNCATE TABLE algeria_wildfires RESTART IDENTITY`;
      const content = fs.readFileSync(wildPath, "utf-8").trim();
      const lines = content.split("\n").slice(1);
      
      const chunkSize = 250;
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize);
        const rows = [];
        for (const line of chunk) {
          const parts = line.split(",").map(p => p.trim());
          if (parts.length >= 9) {
            rows.push(`(${parseFloat(parts[0])}, ${parseFloat(parts[1])}, ${parseFloat(parts[2])}, ${parseFloat(parts[3])}, ${parseFloat(parts[4])}, ${parseFloat(parts[5])}, ${parseFloat(parts[6])}, ${parseInt(parts[7])}, ${parseInt(parts[8])})`);
          }
        }
        if (rows.length > 0) {
          await sql.query(`INSERT INTO algeria_wildfires (lat, lon, temp, humidity, wind_speed, precipitation, vegetation_index, month, fire_occurred) VALUES ${rows.join(",")}`);
        }
      }
      console.log(`  [OK] Successfully imported ${lines.length} rows into algeria_wildfires!`);
    } else {
      console.log(`  [SKIP] algeria_wildfires already has ${countRes[0].count} rows.`);
    }
  }

  // F. Import alerts
  const alertCountRes = await sql`SELECT COUNT(*)::int as count FROM alerts`;
  if (alertCountRes[0].count === 0) {
    const seedAlerts = [
      {
        alert_id: "ALT-2026-DZ-01",
        lat: 36.7350,
        lon: 4.4350,
        wilaya: "Tizi Ouzou",
        forest_name: "Forêt de Yakouren (Massif Central)",
        risk_score: 94.2,
        risk_level: "EXTREME",
        temp: 42.8,
        humidity: 12.0,
        wind: 49.0,
        wind_dir: "Sud (Sirocco)",
        status: "UNITES_DEPLOYEES"
      },
      {
        alert_id: "ALT-2026-DZ-02",
        lat: 36.6500,
        lon: 4.5500,
        wilaya: "Béjaïa",
        forest_name: "Crête de l'Akfadou (Versant Nord)",
        risk_score: 87.5,
        risk_level: "TRES_ELEVE",
        temp: 39.5,
        humidity: 18.0,
        wind: 36.0,
        wind_dir: "Sud-Est",
        status: "PRISE_EN_COMPTE"
      },
      {
        alert_id: "ALT-2026-DZ-03",
        lat: 36.4500,
        lon: 4.1200,
        wilaya: "Bouira",
        forest_name: "Tikjda - Parc National du Djurdjura",
        risk_score: 81.0,
        risk_level: "TRES_ELEVE",
        temp: 36.2,
        humidity: 22.0,
        wind: 32.0,
        wind_dir: "Sud",
        status: "DETECTED"
      },
      {
        alert_id: "ALT-2026-DZ-04",
        lat: 36.8900,
        lon: 8.4400,
        wilaya: "El Tarf",
        forest_name: "Parc National d'El Kala (Zone Brabtia)",
        risk_score: 76.4,
        risk_level: "ELEVE",
        temp: 37.8,
        humidity: 24.0,
        wind: 28.0,
        wind_dir: "Est",
        status: "DETECTED"
      },
      {
        alert_id: "ALT-2026-DZ-05",
        lat: 36.4160,
        lon: 2.8330,
        wilaya: "Blida",
        forest_name: "Parc National de Chréa",
        risk_score: 58.0,
        risk_level: "MODERE",
        temp: 32.4,
        humidity: 35.0,
        wind: 20.0,
        wind_dir: "Nord-Ouest",
        status: "CLOTUREE"
      }
    ];

    for (const a of seedAlerts) {
      await sql`
        INSERT INTO alerts (alert_id, lat, lon, wilaya, forest_name, risk_score, risk_level, temp, humidity, wind, wind_dir, status)
        VALUES (${a.alert_id}, ${a.lat}, ${a.lon}, ${a.wilaya}, ${a.forest_name}, ${a.risk_score}, ${a.risk_level}, ${a.temp}, ${a.humidity}, ${a.wind}, ${a.wind_dir}, ${a.status})
        ON CONFLICT (alert_id) DO NOTHING
      `;
    }
    console.log(`  [OK] Seeded ${seedAlerts.length} operational alerts!`);
  } else {
    console.log(`  [SKIP] alerts table already has ${alertCountRes[0].count} rows.`);
  }
}

async function uploadModelToStorage() {
  console.log("\n[5/6] Uploading ML Model to Neon Object Storage bucket 'assets'...");
  const modelPath = path.resolve("../backend/ml/model.pkl");
  if (fs.existsSync(modelPath)) {
    const s3 = new S3Client({
      region: process.env.AWS_REGION || "us-east-2",
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    const fileBuffer = fs.readFileSync(modelPath);
    await s3.send(new PutObjectCommand({
      Bucket: "assets",
      Key: "models/xgboost_wildfire_model.pkl",
      Body: fileBuffer,
      ContentType: "application/octet-stream",
    }));
    console.log(`  [PASS] Uploaded 'models/xgboost_wildfire_model.pkl' (${fileBuffer.length} bytes) to bucket 'assets'!`);
  } else {
    console.log("  [NOTE] backend/ml/model.pkl not found at path:", modelPath);
  }
}

async function verifyCounts() {
  console.log("\n[6/6] Verifying Table Row Counts in IN9AD branch:");
  const tables = ["wilayas", "massifs", "predictions", "reports", "historical_fires", "burn_stats", "alerts", "algeria_wildfires"];
  for (const t of tables) {
    try {
      const res = await sql.query(`SELECT COUNT(*)::int as count FROM ${t}`);
      console.log(`  - Table '${t}': ${res[0].count} rows`);
    } catch (err) {
      console.error(`  - Table '${t}': error querying count (${err.message})`);
    }
  }
}

async function run() {
  try {
    await createSchema();
    await seedWilayas();
    await seedMassifs();
    await importDatasets();
    await uploadModelToStorage();
    await verifyCounts();
    console.log("\n=================================================");
    console.log("    >>> IMPORT COMPLETED SUCCESSFULLY! <<<       ");
    console.log("=================================================\n");
  } catch (err) {
    console.error("FATAL ERROR during import:", err);
    process.exit(1);
  }
}

run();
