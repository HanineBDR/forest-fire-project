"""
INKAD - XGBoost Wildfire Risk Model Training
Trains a gradient boosted decision tree classifier calibrated for Northern Algeria.
Features: [temp, humidity, wind_speed, precipitation, vegetation_index, month]
Target: fire_occurred (0 or 1)
Evaluates accuracy, precision, recall, F1-score, and ROC-AUC.
Saves model to /backend/ml/model.pkl (<10MB for Render free tier deployment)
and generates feature importance plot to /backend/ml/outputs/feature_importance.png.
"""

import os
import sys
import json
import logging
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Headless backend for server environments
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix
)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("inkad-train")

from sklearn.ensemble import GradientBoostingClassifier

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    logger.info("XGBoost package not yet present, using scikit-learn GradientBoostingClassifier.")

# Import data collector if dataset needs generation
from data_collector import collect_and_build_dataset, DATA_DIR

# Define paths
ML_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUTS_DIR = os.path.join(ML_DIR, "outputs")
os.makedirs(OUTPUTS_DIR, exist_ok=True)

DATASET_PATH = os.path.join(DATA_DIR, "algeria_wildfire_dataset.csv")
MODEL_PATH = os.path.join(ML_DIR, "model.pkl")
FEATURE_IMPORTANCE_PATH = os.path.join(OUTPUTS_DIR, "feature_importance.png")
METADATA_PATH = os.path.join(ML_DIR, "model_metadata.json")

# Model Feature Definition
FEATURES = ["temp", "humidity", "wind_speed", "precipitation", "vegetation_index", "month"]
TARGET = "fire_occurred"


def train_model():
    """
    Executes end-to-end model training, evaluation, and artifact generation.
    """
    logger.info("=" * 60)
    logger.info("INKAD - Northern Algeria Wildfire Risk Model Training (XGBoost)")
    logger.info("=" * 60)

    # 1. Load or collect dataset
    if not os.path.exists(DATASET_PATH):
        logger.info(f"Dataset not found at {DATASET_PATH}. Running data collector...")
        df = collect_and_build_dataset(DATASET_PATH)
    else:
        logger.info(f"Loading dataset from: {DATASET_PATH}")
        df = pd.read_csv(DATASET_PATH)

    logger.info(f"Dataset loaded: {len(df)} records, {len(FEATURES)} features.")

    # 2. Extract features & target
    X = df[FEATURES]
    y = df[TARGET]

    # 3. Stratified 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    logger.info(f"Training set: {len(X_train)} samples | Test set: {len(X_test)} samples")
    logger.info(f"Class ratio (fire / no-fire): {y_train.mean():.2%} train, {y_test.mean():.2%} test")

    # 4. Initialize and fit Gradient Boosted Decision Tree Classifier
    # Tuned for high interpretability, low latency, and low memory footprint (< 10MB)
    if HAS_XGB:
        clf = xgb.XGBClassifier(
            n_estimators=120,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            eval_metric="logloss",
            random_state=42
        )
        logger.info("Training XGBoost Classifier...")
    else:
        clf = GradientBoostingClassifier(
            n_estimators=120,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            random_state=42
        )
        logger.info("Training GradientBoosting Classifier (GBDT)...")

    clf.fit(X_train, y_train)

    # 5. Evaluate predictions
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred)

    logger.info("-" * 40)
    logger.info("EVALUATION METRICS:")
    logger.info(f"Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
    logger.info(f"Precision: {prec:.4f} ({prec*100:.2f}%)")
    logger.info(f"Recall:    {rec:.4f} ({rec*100:.2f}%)")
    logger.info(f"F1 Score:  {f1:.4f}")
    logger.info(f"ROC-AUC:   {roc_auc:.4f}")
    logger.info("-" * 40)
    logger.info(f"Confusion Matrix:\n{cm}")
    logger.info(f"\nClassification Report:\n{classification_report(y_test, y_pred, digits=4)}")

    # 6. Save Model to /backend/ml/model.pkl
    # Use compress=3 for compact size (<10MB)
    joblib.dump(clf, MODEL_PATH, compress=3)
    model_size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
    logger.info(f"Model saved to {MODEL_PATH} (Size: {model_size_mb:.2f} MB - Render free tier compliant)")

    # 7. Generate Feature Importance Plot
    generate_feature_importance_plot(clf, FEATURES)

    # 8. Save model metadata
    metadata = {
        "model_type": "XGBoost Classifier",
        "features": FEATURES,
        "n_estimators": 120,
        "max_depth": 4,
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc), 4),
        "feature_importances": {
            feat: round(float(clf.feature_importances_[i]), 4)
            for i, feat in enumerate(FEATURES)
        },
        "target_region": "Northern Algeria (Bejaia, Tizi Ouzou, Bouira, Jijel, Setif, Bordj Bou Arreridj)"
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Metadata saved to: {METADATA_PATH}")
    return clf, metadata


def generate_feature_importance_plot(clf, feature_names):
    """
    Generates high-contrast, presentation-ready feature importance diagram.
    Explains WHY wildfires happen in Northern Algeria.
    """
    importances = clf.feature_importances_
    indices = np.argsort(importances)[::-1]
    sorted_features = [feature_names[i] for i in indices]
    sorted_importances = importances[indices]

    # Human-friendly labels explaining the physics
    label_map = {
        "temp": "Air Temperature (°C)\n[Desiccates Fuel]",
        "humidity": "Relative Humidity (%)\n[Moisture Depletion]",
        "wind_speed": "Wind Speed (km/h)\n[Flame Front Velocity]",
        "precipitation": "Precipitation (mm)\n[Drought Severity]",
        "vegetation_index": "Vegetation / NDVI (0-1)\n[Canopy Fuel Load]",
        "month": "Seasonal Month\n[Summer Peak Window]"
    }
    display_labels = [label_map.get(f, f) for f in sorted_features]

    plt.figure(figsize=(10, 6), dpi=300)
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")

    # Dark amber/crimson color palette for wildfire theme
    colors = ["#dc2626", "#ea580c", "#f59e0b", "#d97706", "#65a30d", "#2563eb"]
    bar_colors = [colors[i % len(colors)] for i in range(len(sorted_features))]

    bars = plt.barh(range(len(sorted_features)), sorted_importances[::-1], color=bar_colors[::-1], edgecolor="#1e293b", height=0.65)

    plt.yticks(range(len(sorted_features)), display_labels[::-1], fontsize=11, fontweight="semibold")
    plt.xlabel("XGBoost Relative Importance (Gini Gain)", fontsize=12, fontweight="bold", labelpad=10)
    plt.title("INKAD - Why Wildfires Ignite in Northern Algeria\nFeature Importance Analysis (Kabylie & Babors Massifs)", fontsize=14, fontweight="bold", pad=15)

    # Add numeric labels to bars
    for bar in bars:
        width = bar.get_width()
        plt.text(
            width + 0.008,
            bar.get_y() + bar.get_height() / 2,
            f"{width*100:.1f}%",
            va="center",
            ha="left",
            fontsize=11,
            fontweight="bold",
            color="#0f172a"
        )

    plt.xlim(0, max(sorted_importances) * 1.18)
    plt.tight_layout()
    plt.savefig(FEATURE_IMPORTANCE_PATH, dpi=300)
    plt.close()
    logger.info(f"Feature importance diagram saved to: {FEATURE_IMPORTANCE_PATH}")


if __name__ == "__main__":
    train_model()
