/**
 * INKAD Notification and Alert Types & Constants (Client-Safe)
 * Can be imported by React client components without pulling in server database libraries.
 */

export interface NotificationRecord {
  id: number;
  alert_id?: string | null;
  sender_role: "ai_model" | "protection_civile" | "admin_centrale" | "mohafadat_ghabat" | string;
  recipient_role: "protection_civile" | "admin_centrale" | "mohafadat_ghabat" | "all" | string;
  recipient_user_id?: string | null;
  title: string;
  message: string;
  risk_level: string;
  risk_score?: number | null;
  massif?: string | null;
  wilaya?: string | null;
  lat?: number | null;
  lon?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface AlertAcknowledgmentRecord {
  id: number;
  alert_id: string;
  user_role: string;
  action: "acknowledged" | "escalated" | "resolved" | "alerted_other" | string;
  comment?: string | null;
  target_role?: string | null;
  created_at: string;
}

// Default Latin text must be in English
export const ROLE_LABELS: Record<string, string> = {
  protection_civile: "Civil Protection (CODIS)",
  admin_centrale: "Central Administration",
  mohafadat_ghabat: "Forest Conservation (DGF)",
  ai_model: "INKAD AI System",
  iot_vigie_network: "IoT Watchtower Network",
  all: "All Operational Commands",
};

export function getLocalizedRole(role: string, lang: string = "en"): string {
  if (!role) return "";
  const r = role.trim();
  if (lang === "ar") {
    switch (r) {
      case "protection_civile":
      case "Protection Civile (CODIS)":
      case "Protection Civile":
      case "Civil Protection (CODIS)":
      case "Civil Protection":
        return "الحماية المدنية (CODIS)";
      case "admin_centrale":
      case "Administration Centrale":
      case "Central Administration":
        return "الإدارة المركزية";
      case "mohafadat_ghabat":
      case "Conservation des Forêts (DGF)":
      case "Conservation des Forêts":
      case "Forest Conservation (DGF)":
      case "Forest Conservation":
        return "محافظة الغابات (DGF)";
      case "ai_model":
      case "Système IA INKAD":
      case "INKAD AI System":
        return "نظام الذكاء الاصطناعي إنقاذ";
      case "iot_vigie_network":
      case "Réseau Vigies IoT":
      case "IoT Watchtower Network":
        return "شبكة مستشعرات ومراقبة IoT";
      case "all":
      case "Tous les Commandements":
      case "All Operational Commands":
        return "كافة مراكز القيادة";
      default:
        return r;
    }
  }
  if (lang === "fr") {
    switch (r) {
      case "protection_civile":
      case "Civil Protection (CODIS)":
      case "الحماية المدنية (CODIS)":
        return "Protection Civile (CODIS)";
      case "admin_centrale":
      case "Central Administration":
      case "الإدارة المركزية":
        return "Administration Centrale";
      case "mohafadat_ghabat":
      case "Forest Conservation (DGF)":
      case "محافظة الغابات (DGF)":
        return "Conservation des Forêts (DGF)";
      case "ai_model":
      case "INKAD AI System":
      case "نظام الذكاء الاصطناعي إنقاذ":
        return "Système IA INKAD";
      case "iot_vigie_network":
      case "IoT Watchtower Network":
      case "شبكة مستشعرات ومراقبة IoT":
        return "Réseau Vigies IoT";
      case "all":
      case "All Operational Commands":
      case "كافة مراكز القيادة":
        return "Tous les Commandements";
      default:
        return r;
    }
  }
  // Default English
  switch (r) {
    case "protection_civile":
    case "Protection Civile (CODIS)":
    case "Protection Civile":
    case "الحماية المدنية (CODIS)":
      return "Civil Protection (CODIS)";
    case "admin_centrale":
    case "Administration Centrale":
    case "الإدارة المركزية":
      return "Central Administration";
    case "mohafadat_ghabat":
    case "Conservation des Forêts (DGF)":
    case "Conservation des Forêts":
    case "محافظة الغابات (DGF)":
      return "Forest Conservation (DGF)";
    case "ai_model":
    case "Système IA INKAD":
    case "نظام الذكاء الاصطناعي إنقاذ":
      return "INKAD AI System";
    case "iot_vigie_network":
    case "Réseau Vigies IoT":
    case "شبكة مستشعرات ومراقبة IoT":
      return "IoT Watchtower Network";
    case "all":
    case "Tous les Commandements":
    case "كافة مراكز القيادة":
      return "All Operational Commands";
    default:
      return r;
  }
}

export function getLocalizedMassifName(name: string | undefined | null, lang: string = "en"): string {
  if (!name) return "";
  const n = name.trim();
  const lower = n.toLowerCase();

  if (lower.includes("akfadou") || n.includes("أكفادو")) {
    return lang === "ar" ? "كتلة أكفادو" : lang === "en" ? "Akfadou Massif" : "Massif d'Akfadou";
  }
  if (lower.includes("yakouren") || n.includes("يعكورن")) {
    return lang === "ar" ? "كتلة يعكورن" : lang === "en" ? "Yakouren Massif" : "Massif de Yakouren";
  }
  if (lower.includes("chréa") || lower.includes("chrea") || n.includes("الشريعة")) {
    return lang === "ar" ? "كتلة الشريعة" : lang === "en" ? "Chrea Massif" : "Massif de Chréa";
  }
  if (lower.includes("djurdjura") || lower.includes("tikjda") || n.includes("جرجرة") || n.includes("تيكجدة")) {
    return lang === "ar" ? "كتلة جرجرة (تيكجدة)" : lang === "en" ? "Djurdjura Massif" : "Massif du Djurdjura";
  }
  if (lower.includes("babor") || n.includes("البابور")) {
    return lang === "ar" ? "كتلة البابور - طابابور" : lang === "en" ? "Babors Massif" : "Massif des Babors";
  }
  if (lower.includes("edough") || lower.includes("séraïdi") || lower.includes("seraidi") || n.includes("الإيدوغ")) {
    return lang === "ar" ? "كتلة سرايدي - الإيدوغ" : lang === "en" ? "Edough Massif" : "Massif de l'Edough";
  }
  if (lower.includes("aurès") || lower.includes("aures") || lower.includes("ichmoul") || n.includes("الأوراس")) {
    return lang === "ar" ? "كتلة الأوراس - إشمول" : lang === "en" ? "Aures Massif" : "Massif des Aurès";
  }
  if (lower.includes("gouraya") || n.includes("قورايا")) {
    return lang === "ar" ? "كتلة قورايا" : lang === "en" ? "Gouraya Massif" : "Massif de Gouraya";
  }
  if (lower.includes("tlemcen") || lower.includes("hafroun") || n.includes("تلمسان")) {
    return lang === "ar" ? "كتلة تلمسان - الحركات" : lang === "en" ? "Tlemcen Massif" : "Massif de Tlemcen";
  }
  if (lower.includes("collo") || n.includes("القل")) {
    return lang === "ar" ? "كتلة القل - سكيكدة" : lang === "en" ? "Collo Massif" : "Massif de Collo";
  }
  if (lower.includes("kala") || lower.includes("brabantia") || n.includes("القالة")) {
    return lang === "ar" ? "كتلة القالة - الطارف" : lang === "en" ? "El Kala Massif" : "Massif d'El Kala";
  }
  if (lower.includes("bouhmama") || n.includes("بوحمامة")) {
    return lang === "ar" ? "كتلة بوحمامة" : lang === "en" ? "Bouhmama Massif" : "Massif de Bouhmama";
  }
  if (lower.includes("chelia") || lower.includes("chélia") || n.includes("شيلية")) {
    return lang === "ar" ? "كتلة جبل شيلية" : lang === "en" ? "Chelia Massif" : "Massif de Chelia";
  }
  if (lower.includes("theniet") || lower.includes("théniet") || n.includes("ثنية الحد")) {
    return lang === "ar" ? "كتلة ثنية الحد" : lang === "en" ? "Theniet El Had Massif" : "Massif de Theniet El Had";
  }
  if (lower.includes("mizrana") || n.includes("مزرانة")) {
    return lang === "ar" ? "غابة مزرانة" : lang === "en" ? "Mizrana Forest" : "Forêt de Mizrana";
  }
  if (lower.includes("baie des tourelles") || n.includes("باي توفوت")) {
    return lang === "ar" ? "باي توفوت" : lang === "en" ? "Bay of Tourelles" : "Baie des Tourelles";
  }
  if (lower.includes("dréan") || lower.includes("drean") || n.includes("الذريعات")) {
    return lang === "ar" ? "الذريعات" : lang === "en" ? "Drean Sector" : "Secteur Dréan";
  }
  if (lower.includes("sidi ammar") || n.includes("سيدي عمار")) {
    return lang === "ar" ? "سيدي عمار" : lang === "en" ? "Sidi Ammar" : "Sidi Ammar";
  }
  if (lower.includes("guerrouch") || n.includes("قروش")) {
    return lang === "ar" ? "قروش وتارة" : lang === "en" ? "Guerrouch-Texenna" : "Guerrouch & Texenna";
  }
  return n;
}

export function getLocalizedWilayaName(name: string | undefined | null, lang: string = "en"): string {
  if (!name) return "";
  const n = name.trim();
  const lower = n.toLowerCase();

  if (lower.includes("tizi") || n.includes("تيزي")) return lang === "ar" ? "تيزي وزو" : "Tizi Ouzou";
  if (lower.includes("bejaia") || lower.includes("béjaïa") || n.includes("بجاية")) return lang === "ar" ? "بجاية" : lang === "en" ? "Bejaia" : "Béjaïa";
  if (lower.includes("blida") || n.includes("البليدة")) return lang === "ar" ? "البليدة" : "Blida";
  if (lower.includes("bouira") || n.includes("البويرة")) return lang === "ar" ? "البويرة" : "Bouira";
  if (lower.includes("setif") || lower.includes("sétif") || n.includes("سطيف")) return lang === "ar" ? "سطيف" : lang === "en" ? "Setif" : "Sétif";
  if (lower.includes("annaba") || n.includes("عنابة")) return lang === "ar" ? "عنابة" : "Annaba";
  if (lower.includes("batna") || n.includes("باتنة")) return lang === "ar" ? "باتنة" : "Batna";
  if (lower.includes("khenchela") || n.includes("خنشلة")) return lang === "ar" ? "خنشلة" : "Khenchela";
  if (lower.includes("tlemcen") || n.includes("تلمسان")) return lang === "ar" ? "تلمسان" : "Tlemcen";
  if (lower.includes("skikda") || n.includes("سكيكدة")) return lang === "ar" ? "سكيكدة" : "Skikda";
  if (lower.includes("tarf") || lower.includes("taref") || n.includes("الطارف")) return lang === "ar" ? "الطارف" : "El Tarf";
  if (lower.includes("tissemsilt") || n.includes("تيسمسيلت")) return lang === "ar" ? "تيسمسيلت" : "Tissemsilt";
  if (lower.includes("jijel") || n.includes("جيجل")) return lang === "ar" ? "جيجل" : "Jijel";
  if (lower.includes("alger") || lower.includes("algiers") || n.includes("الجزائر")) return lang === "ar" ? "الجزائر" : lang === "en" ? "Algiers" : "Alger";
  return n;
}

export function getLocalizedWindDirection(dir: string | undefined | null, lang: string = "en"): string {
  if (!dir) return "";
  const d = dir.trim();
  const lower = d.toLowerCase();

  if (lower.includes("sud-est") || lower.includes("south-east") || lower === "se" || d.includes("جنوب-شرقي") || d.includes("جنوب شرقي")) {
    return lang === "ar" ? "جنوب-شرقي" : lang === "en" ? "South-East" : "Sud-Est";
  }
  if (lower.includes("nord-est") || lower.includes("north-east") || lower === "ne" || d.includes("شمال-شرقي") || d.includes("شمال شرقي")) {
    return lang === "ar" ? "شمال-شرقي" : lang === "en" ? "North-East" : "Nord-Est";
  }
  if (lower.includes("nord-ouest") || lower.includes("north-west") || lower === "nw" || lower === "no" || d.includes("شمال-غربي") || d.includes("شمال غربي")) {
    return lang === "ar" ? "شمال-غربي" : lang === "en" ? "North-West" : "Nord-Ouest";
  }
  if (lower.includes("sud-ouest") || lower.includes("south-west") || lower === "sw" || lower === "so" || d.includes("جنوب-غربي") || d.includes("جنوب غربي")) {
    return lang === "ar" ? "جنوب-غربي" : lang === "en" ? "South-West" : "Sud-Ouest";
  }
  if (lower.includes("sirocco") || d.includes("سيروكو") || d.includes("الشهيلي")) {
    return lang === "ar" ? "جنوب (الشهيلي)" : lang === "en" ? "South (Sirocco)" : "Sud (Sirocco)";
  }
  if (lower.includes("sud") || lower.includes("south") || lower === "s" || d.includes("جنوب")) {
    return lang === "ar" ? "جنوب" : lang === "en" ? "South" : "Sud";
  }
  if (lower.includes("nord") || lower.includes("north") || lower === "n" || d.includes("شمال")) {
    return lang === "ar" ? "شمال" : lang === "en" ? "North" : "Nord";
  }
  if (lower.includes("est") || lower.includes("east") || lower === "e" || d.includes("شرق")) {
    return lang === "ar" ? "شرق" : lang === "en" ? "East" : "Est";
  }
  if (lower.includes("ouest") || lower.includes("west") || lower === "w" || lower === "o" || d.includes("غرب")) {
    return lang === "ar" ? "غرب" : lang === "en" ? "West" : "Ouest";
  }
  return d;
}

export function translateNotificationRisk(level: string | undefined | null, lang: string = "en"): string {
  if (!level) return "";
  const l = level.trim().toLowerCase();
  if (l.includes("très") || l.includes("tres") || l.includes("critical") || l.includes("very high") || level.includes("مرتفع جدا")) {
    return lang === "ar" ? "مرتفع جداً" : lang === "en" ? "Very High" : "Très Élevé";
  }
  if (l.includes("elevé") || l.includes("eleve") || l.includes("high") || level.includes("مرتفع")) {
    return lang === "ar" ? "مرتفع" : lang === "en" ? "High" : "Élevé";
  }
  if (l.includes("modéré") || l.includes("modere") || l.includes("moderate") || level.includes("معتدل")) {
    return lang === "ar" ? "معتدل" : lang === "en" ? "Moderate" : "Modéré";
  }
  if (l.includes("faible") || l.includes("low") || level.includes("منخفض")) {
    return lang === "ar" ? "منخفض" : lang === "en" ? "Low" : "Faible";
  }
  return level;
}

export function translateNotificationTitle(title: string | undefined | null, lang: string = "en"): string {
  if (!title) return "";
  const t = title.trim();

  // Pattern 1: Moderate Vigilance: Massif (Wilaya)
  // e.g. "Vigilance Modérée : Massif d'Akfadou (W. 06)"
  const modMatch = t.match(/^(?:Vigilance Modérée|Moderate Vigilance|يقظة معتدلة)\s*:\s*(.+?)(?:\s*\(([^)]+)\))?$/i);
  if (modMatch) {
    const rawMassif = modMatch[1].trim();
    const wilayaCode = modMatch[2] ? ` (${modMatch[2].trim()})` : "";
    const locMassif = getLocalizedMassifName(rawMassif, lang);
    if (lang === "ar") return `يقظة معتدلة : ${locMassif}${wilayaCode}`;
    if (lang === "fr") return `Vigilance Modérée : ${locMassif}${wilayaCode}`;
    return `Moderate Vigilance: ${locMassif}${wilayaCode}`;
  }

  // Pattern 2: [RAPPORT INCENDIE] Détection Foyer Actif : Massif (Wilaya)
  const fireReportMatch = t.match(/^(?:\[(?:RAPPORT INCENDIE|FIRE REPORT|تقرير حريق)\]\s*(?:Détection Foyer Actif|Active Outbreak Detected|رصد بؤرة نشطة)\s*:\s*)(.+?)(?:\s*\(([^)]+)\))?$/i);
  if (fireReportMatch) {
    const rawMassif = fireReportMatch[1].trim();
    const wilayaCode = fireReportMatch[2] ? ` (${fireReportMatch[2].trim()})` : "";
    const locMassif = getLocalizedMassifName(rawMassif, lang);
    if (lang === "ar") return `[تقرير حريق] رصد بؤرة نشطة : ${locMassif}${wilayaCode}`;
    if (lang === "fr") return `[RAPPORT INCENDIE] Détection Foyer Actif : ${locMassif}${wilayaCode}`;
    return `[FIRE REPORT] Active Outbreak Detected: ${locMassif}${wilayaCode}`;
  }

  // Pattern 3: [URGENT ÉVACUATION] Population Civile Menacée : 4500 Habitants (Massif)
  const evacMatch = t.match(/^(?:\[(?:URGENT ÉVACUATION|URGENT EVACUATION|إخلاء عاجل)\]\s*(?:Population Civile Menacée|Threatened Civilian Population|سكان مدنيون مهددون|سكان مهددون)\s*:\s*)(\d+[\s,0-9]*)\s*(?:Habitants|Inhabitants|نسمة|ساكن|Residents|résidents)?\s*\((.+?)\)/i);
  if (evacMatch) {
    const count = evacMatch[1].trim();
    const rawMassif = evacMatch[2].trim();
    const locMassif = getLocalizedMassifName(rawMassif, lang);
    if (lang === "ar") return `[إخلاء عاجل] سكان مهددون : ${count} نسمة (${locMassif})`;
    if (lang === "fr") return `[URGENT ÉVACUATION] Population Civile Menacée : ${count} Habitants (${locMassif})`;
    return `[URGENT EVACUATION] Threatened Civilian Population: ${count} Inhabitants (${locMassif})`;
  }

  // Pattern 4: Risk [Level] detected at [Massif] ([Wilaya])
  // e.g. "Risque Elevé détecté à Massif de Yakouren (Tizi Ouzou)"
  const riskMatch = t.match(/^(?:Risque|Risk|رصد خطر|خطر)\s+([A-Za-zÀ-ÿء-ي\s]+?)\s+(?:détecté à|detected at|في|تم رصده في)\s+(.+?)(?:\s*\(([^)]+)\))?$/i);
  if (riskMatch) {
    const rawLevel = riskMatch[1].trim();
    const rawMassif = riskMatch[2].trim();
    const rawWilaya = riskMatch[3]?.trim();
    const locLevel = translateNotificationRisk(rawLevel, lang);
    const locMassif = getLocalizedMassifName(rawMassif, lang);
    const locWilaya = rawWilaya ? getLocalizedWilayaName(rawWilaya, lang) : "";
    const wilayaSuffix = locWilaya ? ` (${locWilaya})` : "";
    if (lang === "ar") return `رصد خطر ${locLevel} في ${locMassif}${wilayaSuffix}`;
    if (lang === "fr") return `Risque ${locLevel} détecté à ${locMassif}${wilayaSuffix}`;
    return `Risk ${locLevel} detected at ${locMassif}${wilayaSuffix}`;
  }

  // Pattern 5: Signalement Terrain (Massif) - Sender
  const fieldMatch = t.match(/^(?:Signalement Terrain|Field Alert|بلاغ ميداني)\s*\((.+?)\)\s*-\s*(.+)$/i);
  if (fieldMatch) {
    const locMassif = getLocalizedMassifName(fieldMatch[1].trim(), lang);
    const locSender = getLocalizedRole(fieldMatch[2].trim(), lang);
    if (lang === "ar") return `بلاغ ميداني (${locMassif}) - ${locSender}`;
    if (lang === "fr") return `Signalement Terrain (${locMassif}) - ${locSender}`;
    return `Field Alert (${locMassif}) - ${locSender}`;
  }

  // Pattern 6: Message Opérationnel de Sender
  const opMatch = t.match(/^(?:Message Opérationnel de|Operational Transmission from|Operational Message from|رسالة عملياتية من)\s*(.+)$/i);
  if (opMatch) {
    const locSender = getLocalizedRole(opMatch[1].trim(), lang);
    if (lang === "ar") return `رسالة عملياتية من ${locSender}`;
    if (lang === "fr") return `Message Opérationnel de ${locSender}`;
    return `Operational Transmission from ${locSender}`;
  }

  // Pattern 7: Acknowledged / Escalated actions
  const ackMatch = t.match(/^(.+?)\s*(acknowledged|escalated|marked|prise en compte|تصعيد)\s*(?:alert|alerte|الإنذار)?\s*(ALT-[A-Za-z0-9-]+)?/i);
  if (ackMatch) {
    const locSender = getLocalizedRole(ackMatch[1].trim(), lang);
    const alertCode = ackMatch[3] ? ` ${ackMatch[3]}` : "";
    const action = ackMatch[2].toLowerCase();
    if (action.includes("escalat") || action.includes("تصعيد")) {
      if (lang === "ar") return `تصعيد الإنذار${alertCode} بواسطة ${locSender}`;
      if (lang === "fr") return `Escalade de l'alerte${alertCode} par ${locSender}`;
      return `${locSender} escalated alert${alertCode}`;
    }
    if (lang === "ar") return `تمت معاينة الإنذار${alertCode} بواسطة ${locSender}`;
    if (lang === "fr") return `Alerte${alertCode} prise en compte par ${locSender}`;
    return `${locSender} acknowledged alert${alertCode}`;
  }

  return t;
}

export function translateNotificationMessage(message: string | undefined | null, lang: string = "en"): string {
  if (!message) return "";
  const m = message.trim();

  // Pattern A: Drought conditions detected by IoT sensor
  if (
    m.includes("Conditions de sécheresse") ||
    m.includes("Drought conditions") ||
    m.includes("ظروف جفاف") ||
    m.includes("Surveillance de routine") ||
    m.includes("Routine monitoring") ||
    m.includes("استمرار المراقبة الروتينية")
  ) {
    const tempMatch = m.match(/(?:Temp|حرارة)\s*([0-9.]+)/i);
    const humMatch = m.match(/(?:Humidit[ée]|رطوبة|Humidity)\s*([0-9.]+)/i);
    const windMatch = m.match(/(?:Vent|Wind|رياح)\s*([0-9.]+)\s*km\/h(?:\s*\(([^)]+)\))?/i);
    const riskMatch = m.match(/(?:Risque.*?|risk.*?|الخطر.*?)([0-9.]+)%/i);

    const temp = tempMatch ? tempMatch[1] : "34.0";
    const humidity = humMatch ? humMatch[1] : null;
    const wind = windMatch ? windMatch[1] : "36";
    const rawDir = windMatch && windMatch[2] ? windMatch[2] : "Sud-Est";
    const windDir = getLocalizedWindDirection(rawDir, lang);
    const risk = riskMatch ? riskMatch[1] : "57.8";

    if (lang === "ar") {
      const humPart = humidity ? `، رطوبة ${humidity}%` : "";
      return `ظروف جفاف تم رصدها بواسطة مستشعر IoT : حرارة ${temp}°م${humPart}، رياح ${wind} كم/س (${windDir}). الخطر التقديري ${risk}%. استمرار المراقبة الروتينية.`;
    }
    if (lang === "fr") {
      const humPart = humidity ? `, Humidité ${humidity}%` : "";
      return `Conditions de sécheresse détectées par capteur IoT : Temp ${temp}°C${humPart}, Vent ${wind} km/h (${windDir}). Risque IA estimé à ${risk}%. Surveillance de routine maintenue.`;
    }
    const humPart = humidity ? `, Humidity ${humidity}%` : "";
    return `Drought conditions detected by IoT sensor: Temp ${temp}°C${humPart}, Wind ${wind} km/h (${windDir}). Estimated AI risk ${risk}%. Routine monitoring maintained.`;
  }

  // Pattern B: Active Wildfire Alert / Rapport Incendie
  if (
    m.includes("ALERTE INCENDIE ACTIVE") ||
    m.includes("ACTIVE WILDFIRE ALERT") ||
    m.includes("إنذار حريق نشط") ||
    m.includes("Foyer détecté à") ||
    m.includes("Fire outbreak detected at") ||
    m.includes("Procès-verbal officiel")
  ) {
    const locMassifMatch = m.match(/(?:détecté à|detected at|بؤرة في)\s+([^.(]+)(?:\s*\(([^)]+)\))?/i);
    const rawMassif = locMassifMatch ? locMassifMatch[1].trim() : "";
    const wilayaCode = locMassifMatch && locMassifMatch[2] ? ` (${locMassifMatch[2].trim()})` : "";
    const locMassif = getLocalizedMassifName(rawMassif, lang);

    const gpsMatch = m.match(/GPS\s*:\s*([0-9.]+)\s*N,\s*([0-9.]+)\s*E(?:\s*\(Alt\s*([0-9]+)m\))?/i);
    const tempMatch = m.match(/Temp\s*([0-9.]+)/i);
    const humMatch = m.match(/Humidit[ée]\s*([0-9.]+)/i);
    const windMatch = m.match(/Vent\s*([0-9.]+)\s*km\/h(?:\s*\(([^)]+)\))?/i);
    const co2Match = m.match(/CO2\s*([0-9]+)/i);
    const rosMatch = m.match(/([0-9.]+)\s*m\/min(?:\s*\(([0-9.]+)\s*km\/h\))?/i);
    const area1Match = m.match(/\+1h\s*:\s*([0-9.]+)\s*ha/i);
    const area3Match = m.match(/\+3h\s*:\s*([0-9.]+)\s*ha/i);

    const lat = gpsMatch ? gpsMatch[1] : "36.7350";
    const lon = gpsMatch ? gpsMatch[2] : "4.4350";
    const alt = gpsMatch && gpsMatch[3] ? gpsMatch[3] : "850";
    const temp = tempMatch ? tempMatch[1] : "38.5";
    const hum = humMatch ? humMatch[1] : "18";
    const wind = windMatch ? windMatch[1] : "45";
    const windDir = windMatch && windMatch[2] ? getLocalizedWindDirection(windMatch[2], lang) : getLocalizedWindDirection("Sud-Est", lang);
    const co2 = co2Match ? co2Match[1] : "650";
    const rosM = rosMatch ? rosMatch[1] : "14.2";
    const rosKm = rosMatch && rosMatch[2] ? rosMatch[2] : "0.85";
    const a1 = area1Match ? area1Match[1] : "4.5";
    const a3 = area3Match ? area3Match[1] : "18.2";

    if (lang === "ar") {
      return `إنذار حريق نشط : تم رصد بؤرة في ${locMassif}${wilayaCode}. إحداثيات : ${lat} N, ${lon} E (ارتفاع ${alt}م). القياسات : حرارة ${temp}°م، رطوبة ${hum}%، رياح ${wind} كم/س (${windDir})، CO2 ${co2} ppm. سرعة الانتشار التقديرية : ${rosM} م/دقيقة (${rosKm} كم/س). المساحة المتوقعة : +1س: ${a1} هكتار، +3س: ${a3} هكتار. التقرير الرسمي متاح للتحميل.`;
    }
    if (lang === "fr") {
      return `ALERTE INCENDIE ACTIVE : Foyer détecté à ${locMassif}${wilayaCode}. GPS : ${lat} N, ${lon} E (Alt ${alt}m). Télémétrie : Temp ${temp}°C, Humidité ${hum}%, Vent ${wind} km/h (${windDir}), CO2 ${co2} ppm. Vitesse de propagation estimée : ${rosM} m/min (${rosKm} km/h). Surfaces projetées : +1h: ${a1} ha, +3h: ${a3} ha. Procès-verbal officiel disponible au téléchargement.`;
    }
    return `ACTIVE WILDFIRE ALERT: Fire outbreak detected at ${locMassif}${wilayaCode}. GPS: ${lat} N, ${lon} E (Elevation ${alt}m). Telemetry: Temp ${temp}°C, Humidity ${hum}%, Wind ${wind} km/h (${windDir}), CO2 ${co2} ppm. Estimated spread rate: ${rosM} m/min (${rosKm} km/h). Projected surfaces: +1h: ${a1} ha, +3h: ${a3} ha. Official protocol available for download.`;
  }

  // Pattern C: Evacuation order
  if (
    m.includes("ORDRE MINISTÈRE") ||
    m.includes("MINISTRY / WILAYA ORDER") ||
    m.includes("أمر الوزارة") ||
    m.includes("évacuation préventive") ||
    m.includes("preventive evacuation") ||
    m.includes("الإخلاء الوقائي")
  ) {
    const secMatch = m.match(/(?:secteur|sector|قطاع|منطقة)\s+([^.]+?)(?:\.|$)/i);
    const riskMatch = m.match(/([0-9.]+)%/);
    const countMatch = m.match(/(\d+[\s,0-9]*)\s*(?:résidents|residents|Habitants|Inhabitants|ساكن|نسمة)/i);
    const rawSector = secMatch ? secMatch[1].trim() : "";
    const locSector = getLocalizedMassifName(rawSector, lang);
    const risk = riskMatch ? riskMatch[1] : "85.0";
    const count = countMatch ? countMatch[1].trim() : "4 500";

    if (lang === "ar") {
      return `أمر الوزارة / الولاية : ${count} ساكن مهددون. بدء الإخلاء الوقائي الفوري لقطاع ${locSector}. خطر الانتشار نحو التجمعات السكنية مقدر بـ ${risk}%. استنفار الأرتال المتنقلة ووحدات الإنقاذ في المنطقة.`;
    }
    if (lang === "fr") {
      return `ORDRE MINISTÈRE / WILAYA : ${count} résidents menacés. Déclenchement évacuation préventive immédiate du secteur ${locSector}. Risque propagation vers habitations évalué à ${risk}%. Colonnes mobiles et unités de secours requises sur zone.`;
    }
    return `MINISTRY / WILAYA ORDER: ${count} residents threatened. Immediate preventive evacuation initiated for ${locSector} sector. Hazard propagation towards residences estimated at ${risk}%. Mobile columns and emergency units deployed on site.`;
  }

  // Pattern D: AI Hazard Signal
  if (
    m.includes("XGBoost") ||
    m.includes("FWI") ||
    m.includes("Le modèle IA") ||
    m.includes("AI model") ||
    m.includes("نموذج الذكاء الاصطناعي")
  ) {
    const riskMatch = m.match(/([0-9.]+)%/);
    const tempMatch = m.match(/([0-9.]+)°C|([0-9.]+)°م/);
    const humMatch = m.match(/([0-9.]+)%\s*(?:HR|RH|رطوبة)/i);
    const windMatch = m.match(/([0-9.]+)\s*km\/h/i);

    const risk = riskMatch ? riskMatch[1] : "75.0";
    const temp = tempMatch ? (tempMatch[1] || tempMatch[2]) : "38.0";
    const hum = humMatch ? humMatch[1] : "18";
    const wind = windMatch ? windMatch[1] : "42";

    let actionText = "";
    if (m.includes("Protection Civile") || m.includes("colonnes mobiles") || m.includes("Civil Protection")) {
      actionText = lang === "ar"
        ? "إنذار عملياتي: رصد خطر حريق عبر الذكاء الاصطناعي. يُرجى تحريك الأرتال المتنقلة وتجهيز الإمكانيات."
        : lang === "fr"
        ? "Alerte Opérationnelle: Risque d'incendie détecté par l'IA. Pré-positionner les colonnes mobiles."
        : "Operational Alert: Wildfire risk detected by AI. Pre-position mobile columns.";
    } else if (m.includes("Administration Centrale") || m.includes("Central Admin") || m.includes("الإدارة المركزية")) {
      actionText = lang === "ar"
        ? "إنذار استراتيجي: خطر حرائق غابات مرتفع. تفعيل التنسيق بين الولايات."
        : lang === "fr"
        ? "Alerte Stratégique: Risque feu de forêt élevé. Coordination inter-wilayas activée."
        : "Strategic Alert: High wildfire risk. Inter-wilaya coordination activated.";
    } else if (m.includes("Conservation des Forêts") || m.includes("DGF") || m.includes("محافظة الغابات")) {
      actionText = lang === "ar"
        ? "إنذار ميداني: تكثيف مراقبة أبراج DGF وتسيير دوريات استطلاعية."
        : lang === "fr"
        ? "Alerte Terrain: Surveillance accrue des vigies DGF et rondes de patrouille requises."
        : "Field Alert: Increased surveillance of DGF watchtowers and patrol rounds required.";
    } else {
      actionText = lang === "ar"
        ? "تم إرسال الإنذار للوحدات الميدانية."
        : lang === "fr"
        ? "Alerte transmise aux unités opérationnelles."
        : "Alert transmitted to operational units.";
    }

    if (lang === "ar") {
      return `يشير نموذج الذكاء الاصطناعي (XGBoost + FWI) إلى مؤشر خطر قدره ${risk}% (حرارة ${temp}°م، رطوبة ${hum}%، رياح ${wind} كم/س). ${actionText}`;
    }
    if (lang === "fr") {
      return `Le modèle IA (XGBoost + FWI) signale un indice de danger à ${risk}% (${temp}°C, ${hum}% HR, ${wind} km/h). ${actionText}`;
    }
    return `AI model (XGBoost + FWI) signals a hazard of ${risk}% (${temp}°C, ${hum}% RH, ${wind} km/h). ${actionText}`;
  }

  // Pattern E: Operational acknowledgment comment
  if (
    m.includes("Prise en compte opérationnelle immédiate") ||
    m.includes("Immediate operational acknowledgment") ||
    m.includes("تمت المعاينة والتكفل الفوري")
  ) {
    const roleMatch = m.match(/(?:par|by|من قِبل|بواسطة)\s+(.+)$/i);
    const locRole = roleMatch ? getLocalizedRole(roleMatch[1].trim(), lang) : getLocalizedRole("protection_civile", lang);
    if (lang === "ar") return `تمت المعاينة والتكفل الفوري من قِبل ${locRole}.`;
    if (lang === "fr") return `Prise en compte opérationnelle immédiate par ${locRole}.`;
    return `Immediate operational acknowledgment by ${locRole}.`;
  }

  // Pattern F: Escalation comment
  if (
    m.includes("Escalade d'intervention") ||
    m.includes("Intervention escalation") ||
    m.includes("تصعيد التدخل")
  ) {
    const roleMatch = m.match(/(?:par|by|من قِبل|بواسطة)\s+(.+)$/i);
    const locRole = roleMatch ? getLocalizedRole(roleMatch[1].trim(), lang) : getLocalizedRole("protection_civile", lang);
    if (lang === "ar") return `تصعيد التدخل: استنفار التعزيزات بين الولايات من قِبل ${locRole}.`;
    if (lang === "fr") return `Escalade d'intervention: Mobilisation de renforts inter-wilayas par ${locRole}.`;
    return `Intervention escalation: Cross-wilaya reinforcements requested by ${locRole}.`;
  }

  return m;
}

export function getNeonRealtimeConfig() {
  return {
    url: process.env.NEXT_PUBLIC_NEON_REALTIME_URL || null,
    hasSecret: false,
  };
}
