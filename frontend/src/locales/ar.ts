export const ar = {
  // Common & Branding
  platform_name: "إنقاذ (IN9AD)",
  platform_sub: "المنظومة الوطنية للرصد والتنبؤ الاستباقي بحرائق الغابات",
  version: "v3.0 النسخة النهائية",
  loading: "جاري التحميل...",
  verifying_security: "التحقق من بيانات الاعتماد والتصريح الأمني...",
  logout: "تسجيل الخروج",
  last_updated: "آخر تحديث:",
  just_now: "الآن",
  seconds_ago: "منذ ثوانٍ قليلة",
  minutes_ago: "منذ {n} دقيقة",

  // Navigation
  nav_tactical_map: "الخريطة التكتيكية",
  nav_alerts: "التنبيهات النشطة",
  nav_history: "السجل والتدقيق",
  nav_analytics: "تحليلات الذكاء الاصطناعي",
  nav_model_health: "جاهزية النموذج والنظام",
  nav_roadmap: "خارطة الطريق 2026",
  nav_users: "إدارة الحسابات",

  // Roles
  role_admin: "مسؤول النظام (ADMIN)",
  role_civil_protection: "الحماية المدنية الجزائرية",
  role_forest_guard: "محافظة الغابات (DGF)",

  // Risk Levels
  risk_low: "منخفض",
  risk_moderate: "معتدل",
  risk_high: "مرتفع",
  risk_very_high: "مرتفع جداً",
  risk_extreme: "حرج جداً (إنذار أحمر)",

  // Feature 1: Alerts Lifecycle
  alerts_title: "مركز العمليات وإدارة تنبيهات الحرائق",
  alerts_subtitle: "رصد فضائي متواصل عبر أقمار ناسا الصناعية ونموذج الذكاء الاصطناعي XGBoost v2.1-LIVE.",
  refresh_alerts: "تحديث التنبيهات",
  auto_refresh: "تحديث تلقائي (30 ثا)",
  filter_level: "مستوى الخطر",
  filter_status: "الحالة العملياتية",
  all_levels: "جميع المستويات",
  all_statuses: "جميع الحالات",
  status_detected: "DETECTED (تم الرصد)",
  status_acknowledged: "PRISE_EN_COMPTE (قيد المعالجة)",
  status_deployed: "UNITES_DEPLOYEES (انتشار الوحدات)",
  status_controlled: "MAITRISE (تمت السيطرة)",
  status_extinguished: "ETEINT (إخماد تام)",
  status_false_alarm: "FAUSSE_ALERTE (إنذار خاطئ)",
  status_history_title: "سجل الانتقالات والمسار الزمني",
  change_status: "تعديل الحالة",
  update_status_modal_title: "تحديث الحالة العملياتية للتنبيه",
  operation_note: "ملاحظة / أمر تدخلي (مثال: نشر الرتل المتنقل رقم 1)",
  save_status: "حفظ الانتقال",
  cancel: "إلغاء",
  export_pv: "استخراج محضر رسمي (PV)",

  // Feature 2: Explainability
  explainability_title: "العوامل الرئيسية لتقدير الخطر (شفافية الذكاء الاصطناعي)",
  explainability_tooltip: "تفسير لوغاريتمات الذكاء الاصطناعي لشرح الأسباب الدقيقة وراء تحديد مستوى الخطر.",
  factor_temp_high: "ارتفاع حاد في درجات الحرارة (+{val}%)",
  factor_humidity_low: "جفاف الهواء وانخفاض الرطوبة (+{val}%)",
  factor_wind_high: "رياح قوية مساعدة على الانتشار (+{val}%)",
  factor_sirocco: "هبوب رياح الشهيلي الصحراوية الجافة (+{val}%)",
  factor_temp_cool: "اعتدال نسبي في درجات الحرارة (-{val}%)",
  factor_humidity_high: "رطوبة جوية ملائمة ومخففة للخطر (-{val}%)",

  // Feature 3: PDF Reports
  export_zone_report: "استخراج تقرير المنطقة",
  generating_pdf: "جاري إنشاء المحضر الرسمي المعتمد...",
  report_ready: "تم تحميل المحضر الرسمي بنجاح",

  // Feature 4: Simulation
  simulate_spread: "محاكاة انتشار الحريق (6 ساعات)",
  simulating: "جاري حساب انتشار النيران عبر النموذج الخلوي...",
  sim_step: "المرحلة",
  sim_hour: "الأفق الزمني",
  sim_burned_area: "المساحة المقدر احتراقها:",
  sim_play: "تشغيل",
  sim_pause: "إيقاف مؤقت",
  sim_reset: "إعادة تعيين",

  // Feature 5: Wind Particles
  wind_layer: "الرياح المتحركة",
  wind_on: "مفعل",
  wind_off: "معطل",

  // Feature 6: History & Audit
  audit_title: "السجل العملياتي والتدقيق الرقابي",
  audit_subtitle: "توثيق شامل وغير قابل للتعديل لجميع القرارات الميدانية وتحركات الوحدات وتنبيهات الخوارزميات.",
  export_csv: "تصدير ملف CSV",
  export_journal_pdf: "تصدير السجل الرسمي PDF",
  total_actions_today: "الإجراءات الميدانية اليوم",
  alerts_created_count: "تنبيهات صادرة",
  status_changes_count: "تحديثات الحالات العملياتية",
  col_datetime: "التاريخ والوقت (UTC)",
  col_action_type: "نوع الحدث",
  col_wilaya: "الولاية / القطاع الغابي",
  col_user_role: "المسؤول / الرتبة",
  col_details: "تفاصيل الإجراء والملاحظات",

  // Feature 7: Citizen Reporting
  citizen_report_btn: "بلاغ مواطن",
  citizen_report_modal_title: "إرسال بلاغ مواطن عن تصاعد دخان أو حريق",
  citizen_report_desc: "يتيح للمواطنين إبلاغ مركز قيادة العمليات للحماية المدنية فوراً.",
  citizen_wilaya: "الولاية المعنية",
  citizen_phone: "رقم الهاتف (للتحقق والتأكيد)",
  citizen_coords: "إحداثيات الموقع GPS (تلقائية)",
  citizen_notes: "وصف الدخان الملاحظ / لون الدخان / المعالم القريبة",
  citizen_submit: "إرسال البلاغ العاجل",
  citizen_success: "تم إرسال البلاغ بنجاح إلى مركز التنسيق والعمليات للحماية المدنية.",

  // Feature 8: Offline Map Download
  offline_map_btn: "الخريطة بدون إنترنت",
  offline_map_title: "تحميل الخريطة التكتيكية للاستخدام دون شبكة",
  offline_map_desc: "ضروري لأرتال الحماية المدنية وحراس الغابات في المناطق الجبلية الوعرة المنعدمة التغطية.",
  offline_zone_yakouren: "المنطقة 1: غابة إعكوران الوطنية (45 ميغابايت تقريباً)",
  offline_zone_akfadou: "Zone 2: مرتفعات أكفادو وغابة ميزرانة (58 ميغابايت تقريباً)",
  offline_zone_kabylie: "المنطقة 3: كامل الشريط الغابي لمنطقة القبائل (125 ميغابايت تقريباً)",
  offline_downloading: "جاري حفظ وتخزين الخرائط الفضائية وبيانات التضاريس محلياً...",
  offline_ready: "تم تحميل خريطة {zone} بنجاح ({size}) - جاهزة للعمل دون اتصال بالإنترنت !",

  // Feature 10: Roadmap
  roadmap_title: "خارطة الطريق الاستراتيجية لمشروع إنقاذ (What Happens Next)",
  roadmap_subtitle: "خطة التوسع والتطبيق الميداني الوطني المشترك بين الحماية المدنية ومحافظة الغابات.",
  phase1_title: "الشهران 1 - 2 : الربط المباشر مع محافظة الغابات وتجربة ولاية تيزي وزو",
  phase1_desc: "الربط الفوري مع أبراج مراقبة الغابات وتثبيت النظام في قاعة العمليات الرئيسية للولاية.",
  phase2_title: "الشهر 3 : الرسائل النصية القصيرة التكتيكية وتطبيق الهواتف PWA",
  phase2_desc: "إرسال تنبيهات لحظية عبر الرسائل الموجهة جغرافياً للأرتال المتنقلة ورؤساء البلديات الغابية.",
  phase3_title: "الشهر 6 : إعادة التدريب على بيانات موسم الحرائق 2025-2026",
  phase3_desc: "إدخال بيانات التغير المناخي والحرائق الأخيرة لتقليص زمن الاستجابة والتحقق من 45 دقيقة إلى 15 دقيقة.",
  phase4_title: "المدى الطويل : التغطية الوطنية الشاملة وإدماج الطائرات المسيرة (الدرونز)",
  phase4_desc: "تعميم المنظومة على كافة الولايات الغابية الـ 14 شمال الوطن وربطها المباشر بطائرات الرصد الحراري.",

  // Feature 11: Weather, Telemetry & What-If
  temperature: "درجة الحرارة",
  humidity: "الرطوبة",
  relative_humidity: "الرطوبة النسبية",
  wind_speed: "سرعة الرياح",
  wind_direction: "الاتجاه",
  weather_observations: "الأرصاد الجوية (Open-Meteo)",
  simulated_scenario: "سيناريو محاكى",
  live_satellite: "قمر صناعي مباشر",
  risk_index: "مؤشر خطر الحرائق",
  sirocco_alert: "إنذار الشهيلي",
  target_coordinates: "الإحداثيات المستهدفة",
  model_accuracy: "دقة النموذج",
  no_point_selected: "لم يتم تحديد موقع",
  click_map_prompt: "انقر على الخريطة أو اختر كتلة غابية لبدء التحليل.",
  loading_telemetry: "جلب التدفقات الجوية وحساب مؤشر الخطر عبر نموذج XGBoost.",
  simulation_6h_title: "محاكاة انتشار الحريق (6 ساعات)",
  recalculate: "إعادة الحساب",
  what_if_simulator: "محاكي الفرضيات الجوية",
  hide_what_if: "إخفاء محاكي الطقس",
  reset_to_live: "إعادة ضبط للمباشر",
  apply_crisis_conditions: "تطبيق ظروف الأزمة",

  // Feature 12: Strategic Presets & Legend
  strategic_massifs_title: "الكتل الغابية الاستراتيجية (شمال الجزائر)",
  legend_title: "دليل الرموز:",
  legend_wilaya_code: "رمز الولاية",
  click_to_inspect: "(انقر للفحص)",

  // Feature 13: Map Controls & Layers
  scope_northern_algeria: "شمال الجزائر",
  scope_national_view: "نظرة وطنية شاملة",
  map_satellite: "قمر صناعي",
  map_dark: "ليلي داكن",
  map_streets: "طرق وخريطة",
  layer_wind: "الرياح",
  layer_vigies: "أبراج المراقبة",
  layer_sirocco: "الشهيلي",
  layer_drones: "طائرات الدرون",
  offline_zones_title: "المناطق المتاحة للتدخل دون إنترنت",
  map_processing: "المعالجة الفضائية ومحاكاة الذكاء الاصطناعي...",

  // Feature 14: Tactical Ribbon & Dashboard
  operational_watch_active: "نظام اليقظة العملياتية نشط",
  coverage_corridor: "التغطية: الكتل الغابية لمنطقة القبائل والشمال الشرقي الجزائري",
  pilot_tizi_active: "مشروع تيزي وزو النموذجي نشط",
  sms_gateway_active: "بوابة الرسائل القصيرة 24/7 نشطة",
  hotspots_count_label: "بؤر حرارية",
  connected: "متصل",
  accuracy: "الدقة",
  loading_cartography: "جاري تحميل المنظومة الخرائطية العملياتية...",
  admin_system: "إدارة النظام",

  // Feature 15: Simulation Controls (Huygens)
  sim_huygens_title: "محاكاة الانتشار البيضاوي وفق مبدأ هيغنز",
  sim_horizons_count: "{n} آفاق زمنية",
  sim_wind_aligned: "إسقاط محيط الحريق موجّه حسب اتجاه الرياح ({deg}°)",
  sim_burned_area_label: "المساحة المحترقة المتوقعة",
  sim_rate_of_spread: "سرعة انتشار جبهة اللهب",
  sim_flame_length: "الارتفاع التقديري للهب",
  sim_evacuation_radius: "نطاق الإخلاء الموصى به",

  // Feature 16: Public Header & Shared Labels
  national_corridor: "الرواق الوطني ذو الأولوية:",
  model_analytics: "تحليلات النموذج",
  secure_portal: "البوابة الآمنة",
  emergency_hotline: "الحماية المدنية: 14",
  filter_all_levels: "جميع المستويات",
  filter_all_statuses: "جميع الحالات",
  last_check: "آخر فحص:"
};

