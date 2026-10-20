export const fr = {
  // Common & Branding
  platform_name: "IN9AD (إنقاذ)",
  platform_sub: "Système National de Veille & Simulation Prédictive",
  version: "v3.0 TOP 3",
  loading: "Chargement en cours...",
  verifying_security: "Vérification des accréditations de sécurité...",
  logout: "Déconnexion",
  last_updated: "Dernière mise à jour :",
  just_now: "À l'instant",
  seconds_ago: "Il y a quelques secondes",
  minutes_ago: "Il y a {n} min",
  
  // Navigation
  nav_tactical_map: "Carte Tactique",
  nav_alerts: "Alertes Actives",
  nav_history: "Historique & Audit",
  nav_analytics: "Analytics ML",
  nav_model_health: "Santé Modèle & API",
  nav_roadmap: "Feuille de Route 2026",
  nav_users: "Gestion Comptes",

  // Roles
  role_admin: "ADMINISTRATEUR SYSTÈME",
  role_civil_protection: "PROTECTION CIVILE (الحماية المدنية)",
  role_forest_guard: "CONSERVATION DES FORÊTS (محافظة الغابات)",

  // Risk Levels
  risk_low: "Faible",
  risk_moderate: "Modéré",
  risk_high: "Élevé",
  risk_very_high: "Très Élevé",
  risk_extreme: "Extrême (Alerte Rouge)",

  // Feature 1: Alerts Lifecycle
  alerts_title: "Centre Opérationnel des Alertes Incendie",
  alerts_subtitle: "Détection prédictive continue par satellite NASA FIRMS et modèle IA XGBoost v2.1-LIVE.",
  refresh_alerts: "Rafraîchir Alertes",
  auto_refresh: "Auto-refresh (30s)",
  filter_level: "Niveau de Risque",
  filter_status: "Statut Opérationnel",
  all_levels: "Tous les niveaux",
  all_statuses: "Tous les statuts",
  status_detected: "DETECTED (Détecté)",
  status_acknowledged: "PRISE_EN_COMPTE (Prise en compte)",
  status_deployed: "UNITES_DEPLOYEES (Unités déployées)",
  status_controlled: "MAITRISE (Maîtrisé)",
  status_extinguished: "ETEINT (Éteint)",
  status_false_alarm: "FAUSSE_ALERTE (Fausse alerte)",
  status_history_title: "Historique du statut & Traçabilité",
  change_status: "Modifier le statut",
  update_status_modal_title: "Mettre à jour le statut opérationnel",
  operation_note: "Note d'opération / directive (ex: Colonne Mobile n°1 déployée)",
  save_status: "Enregistrer la transition",
  cancel: "Annuler",
  export_pv: "Générer PV Officiel",

  // Feature 2: Explainability
  explainability_title: "Facteurs Clés d'Explication IA",
  explainability_tooltip: "Explication IA (SHAP / Gini) pour une transparence opérationnelle totale auprès du commandement.",
  factor_temp_high: "Température critique (+{val}%)",
  factor_humidity_low: "Sécheresse de l'air / Humidité faible (+{val}%)",
  factor_wind_high: "Vent violent accélérateur (+{val}%)",
  factor_sirocco: "Vent de Sirocco saharien (+{val}%)",
  factor_temp_cool: "Température modérée (-{val}%)",
  factor_humidity_high: "Humidité protectrice (-{val}%)",

  // Feature 3: PDF Reports
  export_zone_report: "Export Rapport Zone",
  generating_pdf: "Génération du PV officiel...",
  report_ready: "Rapport PDF téléchargé avec succès",

  // Feature 4: Simulation
  simulate_spread: "Simuler Propagation 6h",
  simulating: "Calcul propagation CA...",
  sim_step: "Étape",
  sim_hour: "Horizon",
  sim_burned_area: "Propagation estimée :",
  sim_play: "Lecture",
  sim_pause: "Pause",
  sim_reset: "Réinitialiser",

  // Feature 5: Wind Particles
  wind_layer: "Vent Animé",
  wind_on: "ON",
  wind_off: "OFF",

  // Feature 6: History & Audit
  audit_title: "Historique & Audit Opérationnel",
  audit_subtitle: "Traçabilité intégrale des décisions, déploiements d'unités et inférences algorithmiques.",
  export_csv: "Export CSV",
  export_journal_pdf: "Export Journal PDF",
  total_actions_today: "Actions Opérationnelles Aujourd'hui",
  alerts_created_count: "Alertes Générées",
  status_changes_count: "Transitions de Statut",
  col_datetime: "Date / Heure (UTC)",
  col_action_type: "Type d'Événement",
  col_wilaya: "Wilaya / Secteur",
  col_user_role: "Intervenant / Accréditation",
  col_details: "Détails & Directives",

  // Feature 7: Citizen Reporting
  citizen_report_btn: "Signalement Citoyen",
  citizen_report_modal_title: "Signalement Citoyen de Fumée ou Incendie",
  citizen_report_desc: "Permet aux citoyens d'alerter instantanément le CODIS de la Protection Civile.",
  citizen_wilaya: "Wilaya concernée",
  citizen_phone: "Numéro de téléphone (pour vérification)",
  citizen_coords: "Coordonnées GPS (automatiques)",
  citizen_notes: "Description de la fumée observée / localisation",
  citizen_submit: "Envoyer le signalement d'urgence",
  citizen_success: "Signalement transmis au centre d'opérations de la Protection Civile.",

  // Feature 8: Offline Map Download
  offline_map_btn: "Carte Hors-Ligne",
  offline_map_title: "Téléchargement Cartographique Hors-Ligne",
  offline_map_desc: "Essentiel pour les colonnes mobiles et gardes forestiers en zones blanches sans réseau 4G.",
  offline_zone_yakouren: "Zone 1: Massif de Yakouren (Forêt domaniale) — ~45 Mo",
  offline_zone_akfadou: "Zone 2: Crête de l'Akfadou & Forêt de Mizrana — ~58 Mo",
  offline_zone_kabylie: "Zone 3: Tout le massif de Grande Kabylie — ~125 Mo",
  offline_downloading: "Mise en cache des tuiles satellites et thermiques...",
  offline_ready: "Carte {zone} téléchargée ({size}) - Prête pour intervention hors-ligne !",

  // Feature 10: Roadmap
  roadmap_title: "Feuille de Route Stratégique IN9AD (What Happens Next)",
  roadmap_subtitle: "Plan de déploiement opérationnel national pour la Protection Civile et la DGF.",
  phase1_title: "Mois 1 - 2 : Intégration Données DGF & Pilote Tizi Ouzou",
  phase1_desc: "Raccordement direct aux vigies de la Conservation des Forêts. Déploiement en salle opérationnelle du CODIS Tizi Ouzou.",
  phase2_title: "Mois 3 : Alertes SMS Tactiques & Application Mobile PWA",
  phase2_desc: "Diffusion des alertes instantanées par SMS géociblés aux colonnes mobiles et maires de communes forestières.",
  phase3_title: "Mois 6 : Calibrage Haute Résolution Saison 2025-2026",
  phase3_desc: "Réentraînement sur les microclimats 2025. Réduction du temps de réaction opérationnel de 45 min à 15 min.",
  phase4_title: "Long Terme : Couverture Nationale & Flotte de Drones de Reconnaissance",
  phase4_desc: "Extension aux 14 wilayas forestières du Tell algérien et intégration des flux télémétriques de drones thermiques."
};
