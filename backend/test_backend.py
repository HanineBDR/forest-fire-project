"""
IN9AD Backend Verification Script
Runs end-to-end tests on FastAPI endpoints and prediction logic.
"""

import sys
import json
from app.model import predictor
from app.simulation import run_multi_horizon_simulation
from app.weather import fetch_live_weather
from app.firms import fetch_nasa_firms_hotspots

def run_tests():
    print("=" * 60)
    print("IN9AD Backend Self-Test Suite")
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
    print("\n[5/5] Testing FastAPI App Route Structure...")
    from app.main import app
    routes = [route.path for route in app.routes]
    expected_routes = ["/", "/health", "/predict", "/weather", "/firms", "/simulate", "/regions"]
    for r in expected_routes:
        assert r in routes, f"Missing route {r}"
        print(f"  Found route: {r}")
    print("  --> FastAPI Route Architecture PASSED")
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY! BACKEND IS READY FOR PRODUCTION.")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
