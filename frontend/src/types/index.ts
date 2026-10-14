export interface WeatherData {
  source: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  wind_gusts?: number;
  precipitation: number;
  apparent_temperature?: number;
  is_live: boolean;
}

export interface FWIMetrics {
  ffmc: number;
  isi: number;
  bui: number;
  fwi: number;
}

export interface SimulationStep {
  hours: number;
  burned_area_hectares: number;
  head_distance_meters: number;
  rate_of_spread_m_h: number;
  lb_ratio: number;
  polygon: [number, number][]; // [lat, lon]
}

export interface SimulationResult {
  ignition_point: { lat: number; lon: number };
  wind_speed_kmh: number;
  wind_direction_deg: number;
  spread_azimuth_deg: number;
  estimated_flame_height_m: number;
  recommended_evacuation_radius_km: number;
  timesteps: SimulationStep[];
}

export interface PredictionResult {
  input: {
    lat: number;
    lon: number;
    temp: number;
    wind: number;
    humidity: number;
    rain?: number;
    wind_direction?: number;
  };
  risk_score: number;
  risk_level: string;
  risk_level_fr: string;
  risk_level_ar: string;
  theme_color: string;
  engine: string;
  fwi_metrics: FWIMetrics;
  is_sirocco: boolean;
  in_forest_reserve: boolean;
  contributing_factors: string[];
  civil_protection_advisory: string;
  simulation: SimulationResult;
}

export interface FIRMSHotspot {
  id: string;
  latitude: number;
  longitude: number;
  location_name: string;
  brightness_kelvin: number;
  confidence: string;
  satellite: string;
  frp_mw: number;
  acq_date: string;
  acq_time: string;
  daynight: string;
  status: string;
}

export interface RegionPreset {
  id: string;
  name: string;
  wilaya: string;
  lat: number;
  lon: number;
  elevation_m: number;
  canopy_type: string;
  description: string;
}
