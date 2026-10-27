# IN9AD (إنقاذ): Thirduni Cohort 1 Official Submission

## 1. Project name and one-line summary

IN9AD (إنقاذ): An AI wildfire risk prediction and early warning system for vulnerable Algerian forest ecosystems.

## 2. Project description

Seasonal wildfires across Northern Algeria destroy tens of thousands of forest hectares annually, endangering rural communities, biodiversity, and critical mountain massifs. Emergency response is often reactive, mobilizing resources only after fires are visible and spreading out of control.

IN9AD provides predictive early warning and spatial risk intelligence across eight strategic Algerian forest zones, including Yakouren, Akfadou, and Chréa. By analyzing real-time atmospheric conditions, thermal satellite anomalies, and Sirocco wind dynamics, the platform predicts ignition risk levels and simulates fire spread contours before outbreaks escalate.

Built for Algerian Civil Protection dispatchers, forestry conservation officers, and regional crisis teams, IN9AD shifts wildland fire management from reactive suppression to proactive operational readiness, safeguarding human life and preserving natural heritage.

## 3. Team members and roles

- **Ouissal Hadji**: Built the interactive Next.js frontend UI, integrated live API endpoints and CORS configuration, fixed critical TypeScript build errors, configured Vercel production deployment, and established automated backend keep-alive monitoring with cron-job.org.
- **Hanine Boudour**: Built the FastAPI backend services, gathered the Algerian wildfire dataset, trained and exported the XGBoost prediction model, deployed the API to Render, and developed operational analytics endpoints.

## 4. Tech stack

- **Languages and runtimes**: TypeScript, Python 3.11, Node.js
- **Frontend framework and UI**: Next.js 14 (App Router), React 18, Tailwind CSS, Leaflet, Lucide React
- **Backend framework**: FastAPI, Uvicorn, Pydantic, SQLite
- **Machine learning and scientific computing**: XGBoost, Scikit-learn, Pandas, NumPy, Joblib, Canadian Fire Weather Index equations, Huygens elliptical fire propagation modeling
- **External data sources and services**: NASA FIRMS API (MODIS and VIIRS thermal anomaly hotspots), Open-Meteo API (live weather, relative humidity, wind speed, wind direction)
- **Deployment and infrastructure**: Vercel (frontend hosting), Render (backend web service hosting), cron-job.org (10-minute automated health check and keep-alive ping)
- **AI development tools**: Heavy AI utilization throughout the project lifecycle, using Cursor and Claude Code for rapid full-stack scaffolding, component architecture, algorithmic translation of fire weather indices, and build troubleshooting.
