# IN9AD (إنقاذ) - AI-Based Forest Fire Risk Prediction for Northern Algeria

> **National Wildfire Early Warning & Elliptical Spread Simulation System**  
> *Targeted on the Northern Algerian Fire Belt: Tizi Ouzou (15), Bejaia (06), and Bouira (10)*  
> *PFE 2026 • Simulation-based system without IoT hardware dependencies*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20Python%203.10-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014%20TypeScript-000000?logo=next.js)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet%20Maps-199900?logo=leaflet)](https://leafletjs.com)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost%20v2.0-eb5424?logo=xgboost)](https://xgboost.readthedocs.io)
[![NASA FIRMS](https://img.shields.io/badge/Satellite-NASA%20FIRMS-E03C31?logo=nasa)](https://firms.modaps.eosdis.nasa.gov)
[![Open-Meteo](https://img.shields.io/badge/Weather-Open--Meteo%20API-4A90E2)](https://open-meteo.com)

---

## 1. What is IN9AD?

**IN9AD** (*إنقاذ* — Arabic for *Rescue / Salvation*) is an AI-powered wildfire risk prediction and spatial fire spread simulation system designed specifically for the vulnerable Mediterranean mountain massifs of **Northern Algeria (Kabylie Corridor: Tizi Ouzou, Bejaia, Bouira)**.

In recent summers, Northern Algeria has experienced devastating mega-fires driven by the **Sirocco (*Chergui*)**—a hyper-dry, gale-force desert wind blowing from the Sahara across the Tell Atlas that drives temperatures above 45°C and relative humidity below 15%.

### Why Zero-IoT?
Physical IoT sensors deployed in remote mountain forests suffer from:
- Total hardware destruction during initial flash-over
- High maintenance, vandalism, and battery decay across rugged topography
- Limited spatial coverage across tens of thousands of hectares

**IN9AD eliminates physical sensors entirely.** Instead, it combines:
1. **NASA FIRMS (VIIRS 375m & MODIS)** open satellite thermal anomaly detection feeds
2. **Open-Meteo** free real-time numerical weather prediction (temperature, wind speed, wind direction, humidity, precipitation)
3. **Calibrated Machine Learning (XGBoost)** coupled with the **Canadian Forest Fire Weather Index (FWI)**
4. **Huygens Principle Elliptical Fire Propagation Engine** (Rothermel Rate of Spread model)

### The Flagship Feature (End-to-End)
One finished, rock-solid feature built to perfection:
- **User clicks anywhere on the Northern Algeria map** (or chooses strategic hotspots like Yakouren Forest, Akfadou Massif, or Tikjda / Djurdjura National Park).
- The system fetches **live atmospheric conditions** from Open-Meteo for that precise latitude and longitude.
- The **FastAPI XGBoost backend** calculates the wildfire danger score (0–100%), determines the risk level (*Low*, *Moderate*, *High*, *Very High*, *Extreme*), and assesses Sirocco anomalies.
- The **Huygens propagation engine** calculates the exact fire perimeter expansion over **1h, 3h, 6h, and 12h** horizons, projecting burned area (hectares), flame length, and evacuation radii directly on an interactive Leaflet map.

---

## 2. Team Roles & Responsibilities

| Team Member | Role | Key Contributions |
| :--- | :--- | :--- |
| **Lead ML Engineer & Data Scientist** | ML Pipeline & FWI Calibration | Formulated Canadian FWI system (FFMC, ISI, BUI), trained XGBoost Regressor on Northern Algeria summer conditions, and integrated Sirocco wind anomaly detection. |
| **Fullstack GIS & Frontend Engineer** | Next.js 14 & Leaflet UI | Built dynamic Leaflet map centered on Kabylie, designed command-center glassmorphism UI, interactive timeline scrubber, and "What-If" weather simulation lab. |
| **Backend & Systems Architect** | FastAPI & API Integrations | Developed FastAPI endpoints (`/predict`, `/weather`, `/firms`, `/simulate`), created Open-Meteo and NASA FIRMS connectors, and configured Render / Vercel deployment blueprints. |

---

## 3. System Architecture

```text
               +-------------------------------------------------+
               |              Leaflet Web Client                 |
               |       (Next.js 14 + TypeScript + Tailwind)      |
               +-----------------------+-------------------------+
                                       |
                     Map Click (lat, lon) / Preset Selection
                                       |
                                       v
               +-------------------------------------------------+
               |              IN9AD FastAPI Backend              |
               |                    (Python)                     |
               +-------+-----------------------+---------------+--+
                       |                       |               |
                       v                       v               v
            +--------------------+   +-------------------+  +------------------+
            |   Open-Meteo API   |   |  NASA FIRMS API   |  | XGBoost Regressor|
            | (Free Weather API) |   | (Satellite VIIRS) |  |   + FWI Engine   |
            +--------------------+   +-------------------+  +------------------+
                       |                       |                       |
            Temp, Wind, Humidity, Rain         Thermal Hotspots        Risk Score (0-100%)
                       |                       |                       |
                       +-----------------------+-----------------------+
                                       |
                                       v
               +-------------------------------------------------+
               |     Huygens Elliptical Spread Simulation        |
               | (Calculates 1h, 3h, 6h, 12h expansion polygons) |
               +-----------------------+-------------------------+
                                       |
                                       v
               +-------------------------------------------------+
               | Leaflet Map Overlay + Civil Protection Advisory |
               +-------------------------------------------------+
```

---

## 4. Repository Structure

```
forest-fire-project/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app with /predict, /weather, /firms, /simulate
│   │   ├── model.py             # XGBoost model loader + Canadian FWI physics engine
│   │   ├── weather.py           # Open-Meteo live weather client
│   │   ├── firms.py             # NASA FIRMS satellite thermal anomalies
│   │   └── simulation.py        # Huygens elliptical fire propagation engine
│   ├── data/
│   │   └── train_model.py       # Training script creating calibrated XGBoost model
│   ├── models/                  # Model weights & metadata
│   ├── requirements.txt         # Python dependencies
│   ├── render.yaml              # Render 1-click cloud deployment blueprint
│   └── Procfile                 # Production web server process definition
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css      # Dark command-center theme + radar pulse animations
│   │   │   ├── layout.tsx       # Root layout, Google Fonts & Leaflet styling
│   │   │   └── page.tsx         # Main app dashboard
│   │   ├── components/
│   │   │   ├── Header.tsx       # Brand, live badges & Protection Civile hotline
│   │   │   ├── Map.tsx          # Leaflet map with satellite, dark & OSM base layers
│   │   │   ├── QuickPresets.tsx # Instant jump to Yakouren, Akfadou, Tikjda, Gouraya
│   │   │   ├── RiskPanel.tsx    # Risk score gauge, FWI metrics, What-If weather lab
│   │   │   └── SimulationControls.tsx # 1h-12h fire propagation timeline scrubber
│   │   ├── lib/
│   │   │   └── api.ts           # Backend connectors + offline fallback resilience
│   │   └── types/
│   │       └── index.ts         # TypeScript interfaces
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
├── .gitignore
└── README.md
```

---

## 5. How to Run Locally

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: v18 or higher (v20+ recommended)
- **Git**

---

### Step 1: Start the Backend (FastAPI)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Train / generate the calibrated XGBoost model:
   ```bash
   python data/train_model.py
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

6. Open your browser to test the interactive API documentation:
   - **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### Step 2: Start the Frontend (Next.js 14)

1. Open a second terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open your browser at [http://localhost:3000](http://localhost:3000).

---

## 6. Live Cloud Deployment

### Deploy Backend on Render (Free)
1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Blueprint**.
3. Select your repository. Render automatically reads `backend/render.yaml`:
   - **Build Command**: `pip install -r requirements.txt && python data/train_model.py`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Once deployed, copy your Render service URL (e.g. `https://in9ad-backend.onrender.com`).

### Deploy Frontend on Vercel (Free)
1. In [Vercel Dashboard](https://vercel.com/new), import your GitHub repository.
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://in9ad-backend.onrender.com` (your Render backend URL)
4. Click **Deploy**. Your app is live with SSL!

---

## 7. API Reference

### `POST /predict`
Takes latitude, longitude, and weather observations, returning the AI risk score, FWI breakdown, and spatial fire spread polygons.

**Request Body:**
```json
{
  "lat": 36.7350,
  "lon": 4.4350,
  "temp": 39.5,
  "wind": 28.0,
  "humidity": 18.0,
  "rain": 0.0,
  "wind_direction": 180.0
}
```

**Response:**
```json
{
  "risk_score": 88.4,
  "risk_level": "Extreme (Crisis Alert)",
  "risk_level_fr": "Extrême / Alerte Rouge",
  "theme_color": "#7f1d1d",
  "fwi_metrics": {
    "ffmc": 94.2,
    "isi": 22.8,
    "bui": 72.1,
    "fwi": 46.5
  },
  "is_sirocco": true,
  "contributing_factors": [
    "💨 Sirocco (Chergui) desert wind active: extreme heat + desiccation.",
    "🔥 Severe heatwave anomaly: 39.5°C accelerates moisture vaporization.",
    "🌵 Critical dry air: 18% relative humidity leaves dead fuel hyper-flammable."
  ],
  "civil_protection_advisory": "CRITICAL ALERT: Activate Algerian Civil Protection emergency dispatch protocol. Prohibit agricultural burning, prepare water bombing aircraft (Be-200 / AT-802), and maintain evacuation corridors.",
  "simulation": {
    "spread_azimuth_deg": 0.0,
    "estimated_flame_height_m": 3.2,
    "recommended_evacuation_radius_km": 4.8,
    "timesteps": [
      {
        "hours": 1.0,
        "burned_area_hectares": 42.6,
        "rate_of_spread_m_h": 1280.0,
        "polygon": [[36.735, 4.435], "..."]
      }
    ]
  }
}
```

---

## 8. License & Acknowledgements
- Developed for **PFE 2026** — Artificial Intelligence applied to Civil Security & Forestry Conservation.
- Special acknowledgment to **Direction Générale de la Protection Civile (DGPC)** and **Direction Générale des Forêts (DGF)** for public operational guidelines.
- Meteorological data provided courtesy of [Open-Meteo](https://open-meteo.com).
- Satellite active fire anomaly data courtesy of [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov).
