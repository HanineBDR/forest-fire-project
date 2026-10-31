"""
INKAD - Cellular Automaton Fire Spread Simulation
Simulates wildfire propagation over a 6-hour horizon using a 2D cellular automaton model
driven by wind direction, wind speed, and ML risk score.
Outputs hourly burning coordinates and bounding polygons formatted for Leaflet animation.
Pure mathematical simulation - no IoT hardware or external dependencies required.
"""

import math
import numpy as np
from typing import Dict, Any, List, Tuple, Optional


def simulate_fire_spread(
    start_point: Tuple[float, float],
    wind_direction: float = 180.0,
    risk_score: float = 70.0,
    wind_speed: float = 25.0,
    hours: int = 6,
    random_seed: Optional[int] = 42
) -> Dict[str, Any]:
    """
    Simulates cellular automaton wildfire spread.

    Parameters:
    - start_point: (lat, lon) ignition point
    - wind_direction: Degrees (0-360), direction FROM which wind blows (e.g. 180 = South wind blowing North)
    - risk_score: ML Wildfire risk score (0-100)
    - wind_speed: Wind speed in km/h
    - hours: Duration of simulation (default 6 hours)
    - random_seed: Seed for reproducible simulation demos

    Returns:
    - Dictionary with 'timesteps', 'coordinates_by_hour', 'all_coordinates', and metadata.
    """
    if random_seed is not None:
        np.random.seed(random_seed)

    center_lat, center_lon = float(start_point[0]), float(start_point[1])
    
    # Geographic scaling for Northern Algeria (~36.7° N)
    # 1 deg latitude ≈ 110,950 meters
    # 1 deg longitude ≈ 111,320 * cos(lat) ≈ 89,150 meters
    lat_deg_to_m = 110950.0
    lon_deg_to_m = 111320.0 * math.cos(math.radians(center_lat))

    # Grid dimensions: 61 x 61 cells, origin at center (30, 30)
    # Each cell represents ~150 meters of terrain
    grid_size = 61
    origin_r, origin_c = grid_size // 2, grid_size // 2
    cell_size_m = 260.0

    # Grid states: 0 = unburned, 1 = burning front, 2 = burned out
    grid = np.zeros((grid_size, grid_size), dtype=np.int8)
    burned_at_hour = np.zeros((grid_size, grid_size), dtype=np.int8)

    # Ignite center origin cell
    grid[origin_r, origin_c] = 1
    burned_at_hour[origin_r, origin_c] = 1

    # Propagation azimuth: direction TOWARDS which the fire is driven
    # If wind blows from 180° (South), fire propagates towards 0° (North)
    spread_azimuth_deg = (wind_direction + 180.0) % 360.0
    spread_rad = math.radians(spread_azimuth_deg)

    # Unit vector of wind push:
    # 0 deg = North (+lat / -row), 90 deg = East (+lon / +col), 180 deg = South, 270 deg = West
    wind_vec_y = math.cos(spread_rad)  # +North
    wind_vec_x = math.sin(spread_rad)  # +East

    # Base spread rate driven by risk score and wind speed
    # Average Mediterranean wildfire spreads between 200m/h (moderate) to 1800m/h (extreme Sirocco)
    normalized_risk = max(0.1, min(1.0, risk_score / 100.0))
    base_spread = (350.0 + (wind_speed * 28.0) + (normalized_risk * 650.0))

    # ROADMAP IDEA 3: Sirocco Mountain Pass Aerological Coupling
    sirocco_corridor = _detect_sirocco_corridor(center_lat, center_lon, wind_direction)
    sirocco_multiplier = sirocco_corridor["multiplier"] if sirocco_corridor else 1.0
    rate_of_spread_m_h = base_spread * sirocco_multiplier

    # Cellular Automaton simulation over 6 hours
    timesteps = []
    all_coordinates = []

    # 8-neighborhood offsets: (dr, dc)
    # row index increases South (-North), col index increases East (+East)
    neighbors = [
        (-1, 0, 1.0, 0.0),    # North: dr=-1 (lat+), dc=0
        (1, 0, -1.0, 0.0),    # South: dr=+1 (lat-), dc=0
        (0, 1, 0.0, 1.0),     # East:  dr=0, dc=+1 (lon+)
        (0, -1, 0.0, -1.0),   # West:  dr=0, dc=-1 (lon-)
        (-1, 1, 0.707, 0.707),   # NE
        (-1, -1, 0.707, -0.707), # NW
        (1, 1, -0.707, 0.707),   # SE
        (1, -1, -0.707, -0.707)  # SW
    ]

    for h in range(1, hours + 1):
        hourly_coords = []
        newly_ignited = []

        # Find currently burning cells
        burning_cells = np.argwhere(grid == 1)

        # Number of cellular pulses per hour proportional to rate of spread
        pulses = max(1, min(4, int(rate_of_spread_m_h / 400.0)))

        for _ in range(pulses):
            for r, c in burning_cells:
                for dr, dc, ny, nx in neighbors:
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < grid_size and 0 <= nc < grid_size:
                        if grid[nr, nc] == 0:
                            # Dot product between neighbor direction and wind push vector
                            alignment = (ny * wind_vec_y) + (nx * wind_vec_x)
                            
                            # Wind amplification factor
                            # High alignment -> forward propagation boost
                            wind_boost = math.exp(0.9 * alignment * (wind_speed / 25.0))
                            
                            # Base transition probability
                            p_ignite = 0.22 * normalized_risk * wind_boost
                            p_ignite = min(0.95, max(0.04, p_ignite))

                            if np.random.rand() < p_ignite:
                                newly_ignited.append((nr, nc))

            # Apply new ignitions
            for nr, nc in newly_ignited:
                grid[nr, nc] = 1
                if burned_at_hour[nr, nc] == 0:
                    burned_at_hour[nr, nc] = h

        # Transition older burning cells to burned-out embers
        for r, c in burning_cells:
            if np.random.rand() < 0.65:
                grid[r, c] = 2

        # Convert all cells burned up to this hour into geographic coordinates
        burned_indices = np.argwhere((burned_at_hour > 0) & (burned_at_hour <= h))
        for r, c in burned_indices:
            # Offset in meters from origin
            dy_m = (origin_r - r) * cell_size_m  # +North
            dx_m = (c - origin_c) * cell_size_m  # +East

            cell_lat = round(center_lat + (dy_m / lat_deg_to_m), 5)
            cell_lon = round(center_lon + (dx_m / lon_deg_to_m), 5)
            hourly_coords.append([cell_lat, cell_lon])

        # Compute convex hull / boundary polygon perimeter for Leaflet polygon layer
        polygon = _generate_boundary_polygon(hourly_coords, center_lat, center_lon)
        
        # Area in hectares (1 cell ≈ (150 * 150) / 10,000 ≈ 2.25 ha)
        burned_ha = round(len(hourly_coords) * 2.25, 1)

        timesteps.append({
            "hour": h,
            "hours": h,  # Dual key for API backwards-compatibility
            "burned_cells": len(hourly_coords),
            "burned_area_hectares": burned_ha,
            "rate_of_spread_m_h": round(rate_of_spread_m_h * (0.9 + 0.05 * h), 1),
            "coordinates": hourly_coords,
            "polygon": polygon
        })

    # Flatten coordinates for quick Leaflet consumption
    all_coordinates = timesteps[-1]["coordinates"] if timesteps else [[center_lat, center_lon]]

    return {
        "simulation_type": "cellular_automaton",
        "ignition_point": {"lat": center_lat, "lon": center_lon},
        "wind_direction": wind_direction,
        "wind_speed": wind_speed,
        "spread_azimuth_deg": spread_azimuth_deg,
        "risk_score": risk_score,
        "total_hours": hours,
        "total_burned_area_ha": timesteps[-1]["burned_area_hectares"] if timesteps else 0.0,
        "sirocco_corridor_active": sirocco_corridor is not None,
        "sirocco_corridor": sirocco_corridor,
        "all_coordinates": all_coordinates,
        "timesteps": timesteps
    }


def _detect_sirocco_corridor(lat: float, lon: float, wind_dir: float) -> Optional[Dict[str, Any]]:
    """
    Detects if coordinates fall within known Northern Algeria mountain pass Sirocco corridors
    and if wind blows from the southern quadrant (120° - 240°).
    """
    # Check if wind is coming from Southern/Sirocco quadrant
    normalized_dir = wind_dir % 360.0
    if not (115.0 <= normalized_dir <= 245.0):
        return None

    corridors = [
        {
            "id": "corridor_sebaou",
            "name": "Couloir Vallée du Sebaou - Yakouren",
            "center": (36.735, 4.435),
            "max_dist_deg": 0.22,
            "multiplier": 1.45,
            "label": "+45% vitesse de propagation vers la crête",
            "wilaya": "Tizi Ouzou"
        },
        {
            "id": "corridor_soummam",
            "name": "Couloir Venturi Soummam - Akfadou",
            "center": (36.671, 4.582),
            "max_dist_deg": 0.25,
            "multiplier": 1.60,
            "label": "+60% effet venturi de crête",
            "wilaya": "Bejaia"
        },
        {
            "id": "corridor_djurdjura",
            "name": "Couloir Orographique Tizi N'Kouilal - Tikjda",
            "center": (36.452, 4.132),
            "max_dist_deg": 0.20,
            "multiplier": 1.40,
            "label": "+40% turbulence ascendante de versant",
            "wilaya": "Bouira"
        }
    ]

    for c in corridors:
        clat, clon = c["center"]
        dist = math.hypot(lat - clat, lon - clon)
        if dist <= c["max_dist_deg"]:
            return {
                "id": c["id"],
                "name": c["name"],
                "multiplier": c["multiplier"],
                "label": c["label"],
                "wilaya": c["wilaya"]
            }

    return None


def _generate_boundary_polygon(
    coords: List[List[float]],
    center_lat: float,
    center_lon: float,
    num_angles: int = 32
) -> List[List[float]]:
    """
    Generates a smooth perimeter bounding polygon by ray-casting radially from center.
    Perfect for Leaflet L.polygon rendering without requiring scipy.spatial.ConvexHull.
    """
    if not coords:
        return [[center_lat, center_lon]]

    # Map max radial distance for 32 angular sectors
    angles = np.linspace(0, 2 * math.pi, num_angles, endpoint=False)
    max_dists = [0.001] * num_angles

    for lat, lon in coords:
        dlat = lat - center_lat
        dlon = lon - center_lon
        dist = math.hypot(dlat, dlon)
        if dist < 1e-6:
            continue
        angle = math.atan2(dlat, dlon) % (2 * math.pi)
        sector_idx = int((angle / (2 * math.pi)) * num_angles) % num_angles
        if dist > max_dists[sector_idx]:
            max_dists[sector_idx] = dist

    polygon = []
    for i, angle in enumerate(angles):
        r = max_dists[i]
        plat = round(center_lat + r * math.sin(angle), 5)
        plon = round(center_lon + r * math.cos(angle), 5)
        polygon.append([plat, plon])

    # Close polygon loop
    if polygon:
        polygon.append(polygon[0])

    return polygon


if __name__ == "__main__":
    # Test simulation run
    sim = simulate_fire_spread(
        start_point=(36.7350, 4.4350),  # Yakouren Forest
        wind_direction=180.0,            # Sirocco from South
        risk_score=85.0,
        wind_speed=35.0,
        hours=6
    )
    print("\n--- INKAD Cellular Automaton Simulation ---")
    print(f"Ignition Point: {sim['ignition_point']}")
    print(f"Wind Direction: {sim['wind_direction']}° | Spread Azimuth: {sim['spread_azimuth_deg']}°")
    print(f"Total Burned Area (6 Hours): {sim['total_burned_area_ha']} hectares")
    print(f"Total Burn Coordinates: {len(sim['all_coordinates'])}")
    for step in sim["timesteps"]:
        print(f"Hour +{step['hour']}h -> {step['burned_cells']} cells burned ({step['burned_area_hectares']} ha)")
