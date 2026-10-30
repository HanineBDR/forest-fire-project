# INKAD (إنقاذ) Machine Learning Engine

> **AI-Based Wildfire Risk Prediction & Spread Simulation for Northern Algeria**  
> Priority Target Zone: **Bejaia, Tizi Ouzou, Bouira, Jijel, Setif, Bordj Bou Arreridj**

---

## 1. Overview & Architecture

INKAD's Machine Learning core replaces expensive physical IoT deployments with a high-speed, physics-calibrated machine learning and mathematical cellular automaton simulation engine deployable on **Render's Free Tier** (< 10MB memory footprint, zero GPU requirements, < 5ms inference latency).

```
/backend/ml/
│
├── data_collector.py     # Fetches NASA FIRMS + Open-Meteo or synthesizes calibrated Algerian data
├── train.py              # XGBoost training pipeline with 80/20 stratified split & metrics
├── predictor.py          # Real-time inference engine (predict_risk) loading model.pkl
├── simulation.py         # 2D Cellular Automaton fire spread engine over 6-hour horizons
├── visualize.py          # Generates pitch-deck diagrams and interactive burn map
├── model.pkl             # Compressed trained XGBoost Classifier (< 1.5MB)
├── requirements.txt      # Lightweight dependencies (xgboost, scikit-learn, pandas, numpy)
├── data/
│   └── algeria_wildfire_dataset.csv
└── outputs/
    ├── model_performance.png   # Confusion Matrix, Classification Report, ROC Curve
    ├── feature_importance.png  # Feature importance explaining why wildfires ignite
    ├── algeria_burn_map.html   # Interactive Folium satellite detection map
    ├── algeria_burn_map.png    # High-resolution static map of Algerian burn density
    └── burn_stats.csv          # Total satellite burn detections per Wilaya
```

---

## 2. Key Features Used

The model uses 6 primary features that govern wildfire ignition physics in Mediterranean mountain forest massifs:

| Feature | Unit | Physical Significance |
|---|---|---|
| `temp` | °C | Air temperature; dries fuel bed and accelerates pyrolysis |
| `humidity` | % | Relative humidity; sub-20% causes fine fuel desiccation |
| `wind_speed` | km/h | Forward flame propagation velocity and ember spotting |
| `precipitation`| mm | Drought index; rain dampens ignition probability |
| `vegetation_index` | NDVI (0-1) | Forest canopy fuel density (Cork Oak, Atlas Cedar, Aleppo Pine) |
| `month` | 1 - 12 | Seasonal window (July & August represent peak Algerian wildfire hazard) |

---

## 3. How to Retrain the Model

To retrain the model with fresh data or updated hyperparameters:

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Collect or Update Historical Data
```bash
python data_collector.py
```
This queries the NASA FIRMS VIIRS/MODIS API and Open-Meteo Archive for Northern Algeria (`lat: 35.5 - 37.5, lon: 3.0 - 6.5`), and builds `data/algeria_wildfire_dataset.csv`. If NASA API key is absent, it executes calibrated physics synthesis based on historical Algerian wildfire records.

### Step 3: Run Training Pipeline
```bash
python train.py
```
Outputs:
- Model checkpoint: `model.pkl` (compressed, ~1.2 MB)
- Model metadata: `model_metadata.json` (accuracy, precision, recall, F1, ROC-AUC)
- Feature importance visualization: `outputs/feature_importance.png`

### Step 4: Generate All Pitch Deck Visualizations & Burn Map
```bash
python visualize.py
```
Generates:
1. `outputs/model_performance.png` (Confusion Matrix, ROC Curve, Classification Metrics)
2. `outputs/feature_importance.png` (Gini gain feature ranking)
3. `outputs/algeria_burn_map.html` (Interactive Leaflet map showing all Algeria detections)
4. `outputs/algeria_burn_map.png` (Static tactical map highlighting Kabylie density)
5. `outputs/burn_stats.csv` (Wilaya-by-wilaya burned point breakdown)

---

## 4. Real-Time Inference API

```python
from backend.ml.predictor import predict_risk

result = predict_risk(
    lat=36.7350,       # Yakouren Forest, Tizi Ouzou
    lon=4.4350,
    temp=41.5,         # Heatwave
    humidity=15.0,     # Extreme dry air
    wind=38.0,         # Sirocco (Chergui) gust
    precip=0.0
)

# Output:
# {
#   "risk_score": 88.5,
#   "risk_level": "Very High",
#   "risk_level_fr": "Très Élevé / Alerte Rouge",
#   "risk_level_ar": "شديد الخطورة",
#   "factors": [
#      "Sirocco (Chergui) Desert Wind: Hot, hyper-dry gusts blowing from the Sahara.",
#      "Critical Heatwave: Ambient temperature of 41.5°C exceeds critical ignition thresholds.",
#      "Severe Fuel Desiccation: Relative humidity at 15.0% leaves forest litter hyper-combustible."
#   ],
#   ...
# }
```

---

## 5. Cellular Automaton Spread Simulation

```python
from backend.ml.simulation import simulate_fire_spread

simulation = simulate_fire_spread(
    start_point=(36.7350, 4.4350),
    wind_direction=180.0,  # Sirocco from South blowing North
    risk_score=88.5,
    wind_speed=38.0,
    hours=6
)

# Returns hourly polygon perimeters and cell coordinates for Leaflet map animation.
```

---

## 6. Deployment Compliance for Render Free Tier

- **Model size**: ~1.2 MB (well under the 10 MB constraint)
- **Memory footprint**: < 120 MB RAM at runtime
- **No Heavy Libraries**: Pure scikit-learn, XGBoost, pandas, numpy (no PyTorch, TensorFlow, or CUDA overhead)
- **Zero IoT requirement**: Standalone algorithmic simulation engine

---

## 7. Persistent History & Live Refresh System (`inkad_history.db`)

All training runs, satellite burn snapshots, active alerts, and status changes are permanently tracked in SQLite at `/backend/inkad_history.db`.

To refresh live data via command line:
```bash
# Refresh NASA FIRMS points, diagrams, and history snapshot
curl -X POST http://localhost:8000/api/refresh/all

# Re-train XGBoost model on demand
curl -X POST http://localhost:8000/api/refresh/model

# Query history and model drift
curl -X GET http://localhost:8000/api/history/model-runs
curl -X GET http://localhost:8000/api/history/model-drift
```

