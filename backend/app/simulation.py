"""
INKAD - Spatial Fire Spread Simulation Engine
Simulates wildfire propagation perimeters based on Huygens' Elliptical Principle
and Rothermel Rate of Spread (ROS) formulas adapted for Northern Algerian topography and winds.
"""

import math
from typing import List, Dict, Any

# Earth radius in meters
EARTH_RADIUS_M = 6371000.0

def calculate_fire_ellipse(
    lat: float,
    lon: float,
    wind_speed_kmh: float,
    wind_direction_deg: float,
    risk_score: float,
    hours: float
) -> Dict[str, Any]:
    """
    Computes the predicted fire perimeter polygon at elapsed time `hours`.
    Wind direction is meteorological (direction wind comes from).
    The fire advances towards (wind_direction_deg + 180) % 360.
    """
    # Direction fire spreads towards (radians, 0 = North, pi/2 = East)
    spread_azimuth_deg = (wind_direction_deg + 180.0) % 360.0
    spread_rad = math.radians(spread_azimuth_deg)
    
    # Effective Rate of Spread (meters per hour)
    # Higher risk score and wind drastically accelerate head spread
    base_ros_mph = max(80.0, (risk_score / 100.0) * 650.0)
    wind_multiplier = 1.0 + (wind_speed_kmh / 25.0) ** 1.4
    r_head_mph = base_ros_mph * wind_multiplier
    
    # Distance head of fire travels in `hours` (meters)
    d_head = r_head_mph * hours
    
    # Length-to-breadth ratio (Alexander, 1985)
    # At 0 wind, fire is circular (LB = 1.0); at high wind, elongated ellipse (LB up to 4.5)
    lb_ratio = 1.0 + 0.18 * (wind_speed_kmh ** 0.8)
    lb_ratio = min(5.0, max(1.0, lb_ratio))
    
    # Backing spread (rear) is much slower than head spread
    d_rear = d_head / (2.5 * lb_ratio)
    
    # Semi-major axis a (half total length) and semi-minor axis b (half breadth)
    total_length = d_head + d_rear
    a = total_length / 2.0
    b = total_length / (2.0 * lb_ratio)
    
    # Center offset of the ellipse from ignition point along spread azimuth
    c_offset = (d_head - d_rear) / 2.0
    
    # Approximate burned area in hectares (1 ha = 10,000 m^2)
    area_hectares = round((math.pi * a * b) / 10000.0, 1)
    
    # Center of the ellipse in lat/lon
    d_lat_center = (c_offset * math.cos(spread_rad)) / 111139.0
    d_lon_center = (c_offset * math.sin(spread_rad)) / (111139.0 * math.cos(math.radians(lat)))
    center_lat = lat + d_lat_center
    center_lon = lon + d_lon_center
    
    # Generate perimeter polygon coordinates (32 points for smooth curve)
    points: List[List[float]] = []
    num_points = 32
    
    for i in range(num_points):
        # Angle around ellipse
        theta = 2.0 * math.pi * i / num_points
        
        # Local unrotated ellipse coordinates (x along semi-minor, y along semi-major)
        x_local = b * math.cos(theta)
        y_local = a * math.sin(theta)
        
        # Rotate by spread azimuth (angle from North clockwise)
        # Note: In standard Cartesian, angle 0 is +X (East).
        # For azimuth where 0 is North (+Y) and 90 is East (+X):
        # x_rot = x_local * cos(az) + y_local * sin(az)
        # y_rot = -x_local * sin(az) + y_local * cos(az)
        dx_m = x_local * math.cos(spread_rad) + y_local * math.sin(spread_rad)
        dy_m = -x_local * math.sin(spread_rad) + y_local * math.cos(spread_rad)
        
        # Convert meters to lat/lon offsets
        p_lat = center_lat + (dy_m / 111139.0)
        p_lon = center_lon + (dx_m / (111139.0 * math.cos(math.radians(center_lat))))
        
        # GeoJSON expects [longitude, latitude] or Leaflet [latitude, longitude]
        points.append([round(p_lat, 6), round(p_lon, 6)])
        
    # Close polygon
    points.append(points[0])
    
    return {
        "hours": hours,
        "burned_area_hectares": area_hectares,
        "head_distance_meters": round(d_head, 0),
        "rate_of_spread_m_h": round(r_head_mph, 1),
        "lb_ratio": round(lb_ratio, 2),
        "polygon": points
    }

def run_multi_horizon_simulation(
    lat: float,
    lon: float,
    wind_speed: float,
    wind_direction: float,
    risk_score: float
) -> Dict[str, Any]:
    """
    Generates multi-temporal fire propagation perimeters:
    1 hour (immediate response), 3 hours, 6 hours, 12 hours.
    """
    horizons = [1.0, 3.0, 6.0, 12.0]
    timesteps = []
    
    for h in horizons:
        step = calculate_fire_ellipse(
            lat=lat,
            lon=lon,
            wind_speed_kmh=wind_speed,
            wind_direction_deg=wind_direction,
            risk_score=risk_score,
            hours=h
        )
        timesteps.append(step)
        
    # Overall summary
    flame_height_m = round(0.0775 * (timesteps[0]["rate_of_spread_m_h"] ** 0.46), 2)
    evacuation_radius_km = round((timesteps[1]["head_distance_meters"] * 1.5) / 1000.0, 2)
    
    return {
        "ignition_point": {"lat": lat, "lon": lon},
        "wind_speed_kmh": wind_speed,
        "wind_direction_deg": wind_direction,
        "spread_azimuth_deg": round((wind_direction + 180.0) % 360.0, 1),
        "estimated_flame_height_m": max(0.5, flame_height_m),
        "recommended_evacuation_radius_km": max(0.8, evacuation_radius_km),
        "timesteps": timesteps
    }
