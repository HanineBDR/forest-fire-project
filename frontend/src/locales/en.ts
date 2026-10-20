export const en = {
  // Common & Branding
  platform_name: "IN9AD (إنقاذ)",
  platform_sub: "National Wildfire Early Warning & Predictive Simulation System",
  version: "v3.0 TOP 3",
  loading: "Loading in progress...",
  verifying_security: "Verifying security credentials...",
  logout: "Sign Out",
  last_updated: "Last updated:",
  just_now: "Just now",
  seconds_ago: "A few seconds ago",
  minutes_ago: "{n} min ago",

  // Navigation
  nav_tactical_map: "Tactical Map",
  nav_alerts: "Active Alerts",
  nav_history: "History & Audit",
  nav_analytics: "ML Analytics",
  nav_model_health: "Model Health & API",
  nav_roadmap: "Roadmap 2026",
  nav_users: "User Accounts",

  // Roles
  role_admin: "SYSTEM ADMINISTRATOR",
  role_civil_protection: "CIVIL PROTECTION (الحماية المدنية)",
  role_forest_guard: "FOREST CONSERVANCY (محافظة الغابات)",

  // Risk Levels
  risk_low: "Low",
  risk_moderate: "Moderate",
  risk_high: "High",
  risk_very_high: "Very High",
  risk_extreme: "Extreme (Crisis Alert)",

  // Feature 1: Alerts Lifecycle
  alerts_title: "Wildfire Incident Operations Command",
  alerts_subtitle: "Continuous predictive satellite surveillance via NASA FIRMS & XGBoost v2.1-LIVE AI model.",
  refresh_alerts: "Refresh Alerts",
  auto_refresh: "Auto-refresh (30s)",
  filter_level: "Risk Level",
  filter_status: "Operational Status",
  all_levels: "All Levels",
  all_statuses: "All Statuses",
  status_detected: "DETECTED",
  status_acknowledged: "PRISE_EN_COMPTE (Acknowledged)",
  status_deployed: "UNITES_DEPLOYEES (Units Deployed)",
  status_controlled: "MAITRISE (Controlled)",
  status_extinguished: "ETEINT (Extinguished)",
  status_false_alarm: "FAUSSE_ALERTE (False Alarm)",
  status_history_title: "Status Transition Audit History",
  change_status: "Change Status",
  update_status_modal_title: "Update Operational Incident Status",
  operation_note: "Operational note / order (e.g., Mobile Column #1 deployed)",
  save_status: "Save Status Transition",
  cancel: "Cancel",
  export_pv: "Export Official PV",

  // Feature 2: Explainability
  explainability_title: "Key AI Risk Drivers (Explainability)",
  explainability_tooltip: "AI transparency explanation (SHAP / Feature weights) explaining why this specific risk score was reached.",
  factor_temp_high: "Critical Heat Spike (+{val}%)",
  factor_humidity_low: "Severe Atmospheric Dryness (+{val}%)",
  factor_wind_high: "Strong Sustained Wind (+{val}%)",
  factor_sirocco: "Saharan Sirocco Wind Push (+{val}%)",
  factor_temp_cool: "Mild Temperature (-{val}%)",
  factor_humidity_high: "Protective Ambient Moisture (-{val}%)",

  // Feature 3: PDF Reports
  export_zone_report: "Export Zone Report",
  generating_pdf: "Generating official government PDF...",
  report_ready: "Official PDF report downloaded successfully",

  // Feature 4: Simulation
  simulate_spread: "Simulate Spread 6h",
  simulating: "Calculating cellular automaton spread...",
  sim_step: "Step",
  sim_hour: "Horizon",
  sim_burned_area: "Estimated burned area:",
  sim_play: "Play",
  sim_pause: "Pause",
  sim_reset: "Reset",

  // Feature 5: Wind Particles
  wind_layer: "Animated Wind",
  wind_on: "ON",
  wind_off: "OFF",

  // Feature 6: History & Audit
  audit_title: "Operational History & Governance Audit",
  audit_subtitle: "Immutable audit trail of tactical decisions, team deployments, and AI predictions.",
  export_csv: "Export CSV",
  export_journal_pdf: "Export Journal PDF",
  total_actions_today: "Operational Actions Today",
  alerts_created_count: "Alerts Triggered",
  status_changes_count: "Status Transitions",
  col_datetime: "Date / Time (UTC)",
  col_action_type: "Event Type",
  col_wilaya: "Wilaya / Sector",
  col_user_role: "Operator / Authority",
  col_details: "Action Details & Notes",

  // Feature 7: Citizen Reporting
  citizen_report_btn: "Citizen Report",
  citizen_report_modal_title: "Citizen Smoke / Fire Hazard Report",
  citizen_report_desc: "Allows verified citizens to notify Civil Protection dispatch directly.",
  citizen_wilaya: "Affected Wilaya",
  citizen_phone: "Phone Number (for verification)",
  citizen_coords: "GPS Coordinates (Automatic)",
  citizen_notes: "Observation description / smoke color / location details",
  citizen_submit: "Submit Emergency Report",
  citizen_success: "Report dispatched to Civil Protection Operations Center.",

  // Feature 8: Offline Map Download
  offline_map_btn: "Offline Map",
  offline_map_title: "Offline Tactical Map Download",
  offline_map_desc: "Crucial for fire crews operating in deep forest canyons with no cellular coverage.",
  offline_zone_yakouren: "Zone 1: Yakouren State Forest — ~45 MB",
  offline_zone_akfadou: "Zone 2: Akfadou Ridge & Mizrana — ~58 MB",
  offline_zone_kabylie: "Zone 3: Greater Kabylie Forest Corridors — ~125 MB",
  offline_downloading: "Caching satellite tiles and elevation grids...",
  offline_ready: "Map for {zone} downloaded ({size}) - Ready for offline tactical use!",

  // Feature 10: Roadmap
  roadmap_title: "IN9AD Strategic Roadmap (What Happens Next)",
  roadmap_subtitle: "National rollout strategy for Civil Protection and General Directorate of Forests.",
  phase1_title: "Months 1 - 2: DGF Integration & Tizi Ouzou Pilot",
  phase1_desc: "Direct link to forest fire watchtowers. Live dispatch in Tizi Ouzou emergency command room.",
  phase2_title: "Month 3: SMS Early Warning & Mobile Field PWA",
  phase2_desc: "Geotargeted SMS alert delivery to frontline rapid intervention teams and local forest mayors.",
  phase3_title: "Month 6: High-Resolution 2025-2026 Season Model Retraining",
  phase3_desc: "Incorporate latest 2025 burn scars. Reduce operational alert verification lag from 45 min to 15 min.",
  phase4_title: "Long Term: Full National Coverage & Autonomous Thermal Drones",
  phase4_desc: "Scale to all 14 forested Mediterranean wilayas and stream real-time drone telemetry."
};
