"""
INKAD Backend Verification Script
Runs end-to-end tests on FastAPI endpoints and prediction logic.
"""

import sys
import os
os.environ["TESTING"] = "1"
import json
from app.model import predictor
from app.simulation import run_multi_horizon_simulation
from app.weather import fetch_live_weather
from app.firms import fetch_nasa_firms_hotspots

def run_tests():
    print("=" * 60)
    print("INKAD Backend Self-Test Suite")
    print("=" * 60)
    
    # Test 1: Weather Service (Open-Meteo)
    print("\n[1/5] Testing Open-Meteo Integration for Tizi Ouzou (Yakouren)...")
    weather = fetch_live_weather(lat=36.7350, lon=4.4350)
    print(f"  Source: {weather.get('source')}")
    print(f"  Temp: {weather.get('temperature')}°C | Humidity: {weather.get('humidity')}% | Wind: {weather.get('wind_speed')} km/h")
    assert "temperature" in weather, "Weather response missing temperature"
    print("  --> Weather Service PASSED")
    
    # Test 2: NASA FIRMS Satellite Hotspots
    print("\n[2/5] Testing NASA FIRMS Hotspots for Northern Algeria...")
    hotspots = fetch_nasa_firms_hotspots()
    print(f"  Retrieved {len(hotspots)} thermal anomalies")
    assert len(hotspots) > 0, "No FIRMS hotspots returned"
    sample = hotspots[0]
    print(f"  Sample: {sample.get('location_name')} ({sample.get('satellite')}) - FRP: {sample.get('frp_mw')} MW")
    print("  --> NASA FIRMS Service PASSED")
    
    # Test 3: Wildfire Risk Prediction (XGBoost / FWI Engine)
    print("\n[3/5] Testing Wildfire Risk Prediction...")
    # Severe Sirocco heatwave scenario in Bejaia (Akfadou)
    pred_extreme = predictor.predict(
        lat=36.6710,
        lon=4.5820,
        temp=42.0,
        wind=45.0,
        humidity=14.0,
        rain=0.0,
        wind_direction=180.0 # Southerly Sirocco
    )
    print(f"  [Extreme Scenario] Risk: {pred_extreme['risk_score']}% ({pred_extreme['risk_level']})")
    print(f"  Sirocco Detected: {pred_extreme['is_sirocco']}")
    print(f"  FWI Composite: {pred_extreme['fwi_metrics']['fwi']}")
    assert pred_extreme['risk_score'] >= 70.0, "Extreme scenario should yield high/extreme risk"
    
    # Cool spring condition in Bouira (Tikjda)
    pred_low = predictor.predict(
        lat=36.4520,
        lon=4.1320,
        temp=16.0,
        wind=12.0,
        humidity=75.0,
        rain=5.0,
        wind_direction=0.0
    )
    print(f"  [Low Scenario] Risk: {pred_low['risk_score']}% ({pred_low['risk_level']})")
    assert pred_low['risk_score'] < 45.0, "Cool moist scenario should yield low/moderate risk"
    print("  --> Risk Prediction Engine PASSED")
    
    # Test 4: Huygens Elliptical Spread Simulation
    print("\n[4/5] Testing Huygens Elliptical Fire Spread Simulation...")
    sim = run_multi_horizon_simulation(
        lat=36.7350,
        lon=4.4350,
        wind_speed=30.0,
        wind_direction=180.0, # Wind from South, spreading North
        risk_score=85.0
    )
    print(f"  Ignition: {sim['ignition_point']}")
    print(f"  Spread Azimuth: {sim['spread_azimuth_deg']}° (Towards North)")
    print(f"  Recommended Evacuation Radius: {sim['recommended_evacuation_radius_km']} km")
    print(f"  Timesteps: {len(sim['timesteps'])}")
    for step in sim['timesteps']:
        print(f"    +{step['hours']}h: {step['burned_area_hectares']} ha | Rate of Spread: {step['rate_of_spread_m_h']} m/h | Points: {len(step['polygon'])}")
    assert len(sim['timesteps']) == 4, "Should have 4 simulation horizons"
    assert sim['timesteps'][3]['burned_area_hectares'] > sim['timesteps'][0]['burned_area_hectares'], "Area must expand over time"
    print("  --> Fire Spread Simulation PASSED")
    
    # Test 5: End-to-End FastAPI App Route Definitions
    print("\n[5/10] Testing FastAPI App Route Structure...")
    from app.main import app as app_main
    from main import app as root_main

    def get_paths(app_instance):
        paths = []
        for r in app_instance.routes:
            if hasattr(r, "path"):
                paths.append(r.path)
            elif hasattr(r, "routes"):
                for sub_r in r.routes:
                    if hasattr(sub_r, "path"):
                        paths.append(sub_r.path)
        return paths

    routes = get_paths(app_main)
    expected_routes = ["/", "/health", "/predict", "/weather", "/firms", "/simulate", "/regions", "/analytics", "/burn-map"]
    for r in expected_routes:
        assert r in routes, f"Missing route {r} in app.main"
        print(f"  Found route in app.main: {r}")

    root_routes = get_paths(root_main)
    for r in expected_routes:
        assert r in root_routes, f"Missing route {r} in root main"
        print(f"  Found route in main.py: {r}")
    print("  --> FastAPI Route Architecture PASSED")

    # Test 6: ML predictor and cellular automaton
    print("\n[6/7] Testing ML Package (predictor.py & simulation.py)...")
    from ml.predictor import predict_risk as ml_pred
    from ml.simulation import simulate_fire_spread as ml_sim

    ml_res = ml_pred(lat=36.7350, lon=4.4350, temp=42.0, humidity=14.0, wind=45.0, precip=0.0, month=7)
    print(f"  ML Risk Score: {ml_res['risk_score']} / 100 ({ml_res['risk_level']})")
    print(f"  ML Factors: {len(ml_res['factors'])} factors identified")
    assert ml_res["risk_score"] >= 65.0, "Summer heatwave scenario should yield high/very high risk"

    sim_res = ml_sim(start_point=(36.7350, 4.4350), wind_direction=180.0, risk_score=85.0, hours=6)
    print(f"  Cellular Automaton 6h burned area: {sim_res['total_burned_area_ha']} ha | Timesteps: {len(sim_res['timesteps'])}")
    assert len(sim_res["timesteps"]) == 6, "Cellular automaton should output 6 hourly timesteps"
    print("  --> ML Package PASSED")

    # Test 7: Analytics deliverables verification
    print("\n[7/10] Verifying Judge Deliverables & Visualization Outputs...")
    import os
    outputs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml", "outputs")
    required_files = [
        "model_performance.png",
        "feature_importance.png",
        "algeria_burn_map.html",
        "algeria_burn_map.png",
        "burn_stats.csv"
    ]
    for rf in required_files:
        fpath = os.path.join(outputs_dir, rf)
        assert os.path.exists(fpath), f"Missing deliverable: {fpath}"
        size_kb = os.path.getsize(fpath) / 1024
        print(f"  Verified {rf} ({size_kb:.1f} KB)")
    print("  --> Deliverables Verification PASSED")

    # Test 8: Authentication Engine & 3 Demo Accounts
    print("\n[8/10] Testing Authentication & RBAC Engine...")
    from auth.service import authenticate_user, create_access_token, verify_token, ROLE_ADMIN, ROLE_CIVIL_PROTECTION, ROLE_FOREST_GUARD

    demo_creds = [
        ("admin@inkad.dz", "Admin123!", ROLE_ADMIN),
        ("protection@inkad.dz", "Protect123!", ROLE_CIVIL_PROTECTION),
        ("foret@inkad.dz", "Foret123!", ROLE_FOREST_GUARD)
    ]
    for email, pwd, expected_role in demo_creds:
        u = authenticate_user(email, pwd)
        assert u is not None, f"Failed to authenticate demo user: {email}"
        assert u["role"] == expected_role, f"Role mismatch for {email}: {u['role']} != {expected_role}"
        token = create_access_token(u)
        decoded = verify_token(token)
        assert decoded is not None and decoded["sub"] == email, f"Token decode failed for {email}"
        print(f"  Authenticated {email} -> Role: {u['role']} (Token generated & verified)")

    # Test invalid password rejection
    invalid_u = authenticate_user("admin@inkad.dz", "WrongPassword!")
    assert invalid_u is None, "Authentication must reject invalid password"
    print("  Invalid password rejected as expected")
    print("  --> Authentication Engine PASSED")

    # Test 9: Model & API Health Monitoring
    print("\n[9/10] Testing Model & API Health Monitoring Service...")
    from monitoring.service import get_full_system_health, run_test_model_inference
    health = get_full_system_health()
    print(f"  Platform Status: {health['status'].upper()} | Uptime: {health['uptime_formatted']}")
    print(f"  Model Accuracy: {health['model_accuracy'] * 100:.1f}% (Threshold: {health['accuracy_threshold'] * 100:.0f}%)")
    assert health["model_accuracy"] >= 0.80, "Model accuracy must exceed 80% threshold"
    assert len(health["checks"]) == 4, "Must contain 4 service health checks"
    for c in health["checks"]:
        print(f"    Check: {c['service']} -> Status: {c['status']} ({c['latency_ms']} ms)")
    
    test_bench = run_test_model_inference()
    print(f"  Test Model Benchmark: {test_bench['benchmark_target']} -> Score: {test_bench['model_risk_score']}% ({test_bench['latency_ms']} ms)")
    assert test_bench["status"] == "success", "Test model inference failed"
    print("  --> Monitoring Service PASSED")

    # Test 10: Protected Endpoints & Audit Logging
    print("\n[10/10] Testing Protected Endpoints & Civil Protection Audit Logging...")
    from monitoring.service import get_audit_logs
    from main import predict_risk_post, PredictRequest
    from auth.service import authenticate_user

    # 1. Direct authentication test
    user = authenticate_user("protection@inkad.dz", "Protect123!")
    assert user is not None, "Authentication failed"
    print("  Authenticated protection@inkad.dz -> User identity verified")

    # 2. Execute protected prediction endpoint
    pred_req = PredictRequest(lat=36.735, lon=4.435, temp=38.0, wind=30.0, humidity=20.0)
    pred_data = predict_risk_post(pred_req, current_user=user)
    print(f"  Authenticated /predict succeeded: Risk {pred_data['risk_score']}% by {pred_data['operator']['name']}")

    # 3. Verify audit trail recorded
    recent_logs = get_audit_logs(limit=5)
    assert len(recent_logs) > 0, "Audit log should have recorded the prediction"
    latest = recent_logs[0]
    print(f"  Audit Verified: {latest['user_email']} ({latest['user_role']}) -> {latest['wilaya']} (Risk: {latest['risk_score']}%)")
    print("  --> Protected Endpoints & Audit Trail PASSED")

    print("\n" + "=" * 60)
    print("ALL 10 VERIFICATION PHASES PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
