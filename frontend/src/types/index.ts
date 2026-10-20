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

export interface WilayaBurnStat {
  wilaya_code: number;
  wilaya_name: string;
  region: string;
  total_burned_points: number;
  estimated_burned_area_ha: number;
  risk_category: string;
  top_vegetation_type: string;
}

export interface AnalyticsDiagramInfo {
  title: string;
  description: string;
  static_url: string;
  interactive_url?: string;
  file_path: string;
}

export interface AnalyticsResponse {
  title: string;
  model_architecture: string;
  diagrams: {
    model_performance: AnalyticsDiagramInfo;
    feature_importance: AnalyticsDiagramInfo;
    algeria_burn_map: AnalyticsDiagramInfo;
  };
  stats_csv_path: string;
  top_wilayas: WilayaBurnStat[];
}

export interface ModelRun {
  id: number;
  run_id: string;
  timestamp: string;
  accuracy: number;
  roc_auc: number;
  f1: number;
  precision: number;
  recall: number;
  dataset_size: number;
  model_version: string;
  notes: string;
}

export interface BurnSnapshot {
  id: number;
  snapshot_id: string;
  timestamp: string;
  total_points: number;
  total_ha: number;
  source: string;
  bbox: string;
  wilaya_stats?: Record<string, number>;
}

export interface ModelDrift {
  status: "healthy" | "warning" | "degraded";
  latest_accuracy: number;
  average_accuracy: number;
  min_accuracy: number;
  runs_analyzed: number;
  drift_detected: boolean;
  needs_retraining: boolean;
  message: string;
}

export interface AlertRecord {
  id: number;
  alert_id: string;
  lat: number;
  lon: number;
  wilaya: string;
  forest_name: string;
  risk_score: number;
  risk_level: "CRITIQUE" | "VERY_HIGH" | "HIGH" | "MODERATE";
  temp: number;
  humidity: number;
  wind: number;
  wind_dir: string;
  status: "DETECTED" | "PRISE_EN_COMPTE" | "UNITES_DEPLOYEES" | "MAITRISE" | "ETEINT" | "FAUSSE_ALERTE";
  created_at: string;
  updated_at: string;
}

export interface AlertStatusHistory {
  id: number;
  alert_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
  note: string;
  forest_name?: string;
  wilaya?: string;
}

export interface RefreshAllResponse {
  success: boolean;
  generated_at: string;
  duration_ms: number;
  nasa_cache_used: boolean;
  nasa_message: string;
  diff_from_last: {
    new_points: number;
    new_ha: number;
    previous_total: number;
    new_total: number;
  };
  new_stats: {
    total_points: number;
    total_ha: number;
    top_wilayas: {
      name: string;
      total_burned_points: number;
      estimated_burned_area_ha: number;
    }[];
    snapshot_id?: string;
  };
}


