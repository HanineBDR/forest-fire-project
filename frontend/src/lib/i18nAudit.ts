/**
 * Unified I18n Helper for Audit Events, Statuses, and Operational Details
 * Enforces the rule: Latin text must always be in ENGLISH, never French.
 */

export function getLocalizedStatusName(status: string, lang: string): string {
  if (!status) return status;
  const upper = status.toUpperCase().trim();

  if (lang === "ar") {
    switch (upper) {
      case "PRISE_EN_COMPTE":
      case "ACKNOWLEDGED":
        return "تم استلام البلاغ";
      case "UNITES_DEPLOYEES":
      case "UNITS_DEPLOYED":
        return "تم نشر الوحدات";
      case "MAITRISE":
      case "CONTAINED":
        return "تمت السيطرة";
      case "ETEINT":
      case "EXTINGUISHED":
        return "تم الإخماد";
      case "DETECTED":
        return "تم الرصد";
      case "NONE":
        return "لا يوجد";
      case "SOUS_SURVEILLANCE":
      case "UNDER_SURVEILLANCE":
        return "تحت المراقبة";
      case "ACTIF":
      case "ACTIVE":
        return "نشط";
      case "BROADCAST_SMS":
        return "بث إنذار SMS";
      case "SMS_ENVOYE":
      case "SMS_SENT":
        return "تم إرسال الرسالة";
      default:
        return status;
    }
  }

  if (lang === "fr") {
    switch (upper) {
      case "PRISE_EN_COMPTE":
      case "ACKNOWLEDGED":
        return "PRISE EN COMPTE";
      case "UNITES_DEPLOYEES":
      case "UNITS_DEPLOYED":
        return "UNITÉS DÉPLOYÉES";
      case "MAITRISE":
      case "CONTAINED":
        return "MAÎTRISÉ";
      case "ETEINT":
      case "EXTINGUISHED":
        return "ÉTEINT";
      case "DETECTED":
        return "DÉTECTÉ";
      case "NONE":
        return "AUCUN";
      case "SOUS_SURVEILLANCE":
      case "UNDER_SURVEILLANCE":
        return "SOUS SURVEILLANCE";
      case "ACTIF":
      case "ACTIVE":
        return "ACTIF";
      case "SMS_SENT":
      case "SMS_ENVOYE":
        return "SMS ENVOYÉ";
      case "BROADCAST_SMS":
        return "DIFFUSION SMS";
      default:
        return status;
    }
  }

  // Default English (Latin text MUST be English, never French)
  switch (upper) {
    case "PRISE_EN_COMPTE":
    case "ACKNOWLEDGED":
      return "ACKNOWLEDGED";
    case "UNITES_DEPLOYEES":
    case "UNITS_DEPLOYED":
      return "UNITS_DEPLOYED";
    case "MAITRISE":
    case "CONTAINED":
      return "CONTAINED";
    case "ETEINT":
    case "EXTINGUISHED":
      return "EXTINGUISHED";
    case "DETECTED":
      return "DETECTED";
    case "NONE":
      return "NONE";
    case "SOUS_SURVEILLANCE":
    case "UNDER_SURVEILLANCE":
      return "UNDER_SURVEILLANCE";
    case "ACTIF":
    case "ACTIVE":
      return "ACTIVE";
    case "SMS_ENVOYE":
    case "SMS_SENT":
      return "SMS_SENT";
    case "BROADCAST_SMS":
      return "BROADCAST_SMS";
    default:
      return status;
  }
}

export function getLocalizedOperatorName(operator: string, lang: string): string {
  if (!operator) return operator;

  if (lang === "ar") {
    if (operator.includes("Super Admin") || operator.includes("Administrateur") || operator.includes("Direction Générale")) {
      return "مدير النظام (المديرية العامة - المشرف الرئيسي)";
    }
    if (operator.includes("Système IA") || operator.includes("XGBoost") || operator.includes("IA")) {
      return "نظام الذكاء الاصطناعي إنقاذ (XGBoost)";
    }
    if (operator.includes("Officier CODIS") || operator.includes("CODIS")) {
      return "ضابط مركز التنسيق الولائي (CODIS)";
    }
    if (operator.includes("Commandant Protection Civile") || operator.includes("Protection Civile")) {
      return "قائد الحماية المدنية";
    }
    if (operator.includes("Garde") || operator.includes("Forêts") || operator.includes("Inspecteur")) {
      return "المفتش الرئيسي للغابات";
    }
    if (operator.includes("Citoyen")) {
      return "مواطن راصد";
    }
    return operator;
  }

  if (lang === "fr") {
    return operator;
  }

  // Default English (Latin text MUST be English, never French)
  if (operator.includes("Super Admin") || operator.includes("Administrateur") || operator.includes("Direction Générale")) {
    return "System Administrator (General Directorate - Super Admin)";
  }
  if (operator.includes("Système IA") || operator.includes("XGBoost") || operator.includes("IA")) {
    return "IN9AD AI Autonomous System (XGBoost)";
  }
  if (operator.includes("Officier CODIS") || operator.includes("CODIS")) {
    return "Central CODIS Officer";
  }
  if (operator.includes("Commandant Protection Civile") || operator.includes("Protection Civile")) {
    return "Civil Protection Commander";
  }
  if (operator.includes("Garde") || operator.includes("Forêts") || operator.includes("Inspecteur")) {
    return "Chief Forestry Inspector";
  }
  if (operator.includes("Citoyen")) {
    return "Citizen Watch Sentinel";
  }
  return operator;
}

export function getLocalizedAuditNote(note: string, lang: string): string {
  if (!note) return note;
  let res = note;

  // 1. Massifs and Forests translations
  res = res
    .replace(/Massif de l'Akfadou\s*\(Crête Soummam\)/gi, lang === "ar" ? "كتلة غابات أكفادو (مرتفعات الصومام)" : lang === "en" ? "Akfadou Forest Massif (Soummam Ridge)" : "Massif de l'Akfadou (Crête Soummam)")
    .replace(/Massif de l'Akfadou/gi, lang === "ar" ? "كتلة غابات أكفادو" : lang === "en" ? "Akfadou Forest Massif" : "Massif de l'Akfadou")
    .replace(/Forêt d'Akfadou/gi, lang === "ar" ? "غابة أكفادو" : lang === "en" ? "Akfadou Forest" : "Forêt d'Akfadou")
    .replace(/Mont Zaccar & Massif du Dahra/gi, lang === "ar" ? "جبل زكار وكتلة الظهرة" : lang === "en" ? "Mt. Zaccar & Dahra Massif" : "Mont Zaccar & Massif du Dahra")
    .replace(/Mont Zaccar/gi, lang === "ar" ? "جبل زكار" : lang === "en" ? "Mt. Zaccar" : "Mont Zaccar")
    .replace(/Forêt des Cèdres de Theniet El Had/gi, lang === "ar" ? "غابة أرز ثنية الحد" : lang === "en" ? "Theniet El Had Cedar Forest" : "Forêt des Cèdres de Theniet El Had")
    .replace(/Forêt des Cèdres du Djebel Lazreg/gi, lang === "ar" ? "غابة أرز جبل الأزرق" : lang === "en" ? "Djebel Lazreg Cedar Forest" : "Forêt des Cèdres du Djebel Lazreg")
    .replace(/Forêt domaniale des Zarifet/gi, lang === "ar" ? "غابة الظريفات" : lang === "en" ? "Zarifet Forest" : "Forêt domaniale des Zarifet")
    .replace(/Parc National de Chréa/gi, lang === "ar" ? "الحظيرة الوطنية للشريعة" : lang === "en" ? "Chréa National Park" : "Parc National de Chréa")
    .replace(/Parc National du Djurdjura\s*\(Tikjda\)/gi, lang === "ar" ? "الحظيرة الوطنية لجرجرة (تيكجدة)" : lang === "en" ? "Djurdjura National Park (Tikjda)" : "Parc National du Djurdjura (Tikjda)")
    .replace(/Parc National du Djurdjura/gi, lang === "ar" ? "الحظيرة الوطنية لجرجرة" : lang === "en" ? "Djurdjura National Park" : "Parc National du Djurdjura")
    .replace(/Parc National de Gouraya/gi, lang === "ar" ? "الحظيرة الوطنية لقورايا" : lang === "en" ? "Gouraya National Park" : "Parc National de Gouraya")
    .replace(/Parc National d'El Kala/gi, lang === "ar" ? "الحظيرة الوطنية بالقالة" : lang === "en" ? "El Kala National Park" : "Parc National d'El Kala")
    .replace(/Massif de Yakouren/gi, lang === "ar" ? "كتلة غابات يعكورن" : lang === "en" ? "Yakouren Forest Massif" : "Massif de Yakouren")
    .replace(/Forêt de Yakouren/gi, lang === "ar" ? "غابة يعكورن" : lang === "en" ? "Yakouren Forest" : "Forêt de Yakouren")
    .replace(/Massif de Guerrouche & Taza/gi, lang === "ar" ? "كتلة قروش وتازة" : lang === "en" ? "Guerrouche & Taza Massif" : "Massif de Guerrouche & Taza")
    .replace(/Massif des Babors - Tababor/gi, lang === "ar" ? "كتلة البابور وطابابور" : lang === "en" ? "Babor - Tababor Massif" : "Massif des Babors - Tababor")
    .replace(/Mont Chélia & Forêt des Aurès/gi, lang === "ar" ? "جبل شيلية وغابات الأوراس" : lang === "en" ? "Mt. Chélia & Aurès Forest" : "Mont Chélia & Forêt des Aurès")
    .replace(/Mont Chélia/gi, lang === "ar" ? "جبل شيلية" : lang === "en" ? "Mt. Chélia" : "Mont Chélia")
    .replace(/Massif de Beni Toufout/gi, lang === "ar" ? "كتلة غابات بني توفوت" : lang === "en" ? "Beni Toufout Massif" : "Massif de Beni Toufout")
    .replace(/Monts de Sidi Amar & Gouraya/gi, lang === "ar" ? "جبال سيدي عمار وقورايا" : lang === "en" ? "Sidi Amar & Gouraya Mountains" : "Monts de Sidi Amar & Gouraya")
    .replace(/Massif de Mizrana/gi, lang === "ar" ? "كتلة غابات مزرانة" : lang === "en" ? "Mizrana Forest Massif" : "Massif de Mizrana");

  // 2. Action explanations per language
  if (lang === "ar") {
    res = res
      .replace(/Protection Civile\s*:\s*Bejaia/gi, "الحماية المدنية : بجاية")
      .replace(/Protection Civile\s*:\s*Tizi Ouzou/gi, "الحماية المدنية : تيزي وزو")
      .replace(/Protection Civile\s*:\s*Bouira/gi, "الحماية المدنية : البويرة")
      .replace(/Protection Civile\s*:\s*Blida/gi, "الحماية المدنية : البليدة")
      .replace(/Protection Civile/gi, "الحماية المدنية")
      .replace(/Création automatique suite à dépassement du seuil critique\s*\(Risk > 85%\)/gi, "إنشاء تلقائي للإنذار لتجاوز عتبة الخطر الحرج (خطر > 85%)")
      .replace(/Création automatique suite à dépassement du seuil critique/gi, "إنشاء تلقائي للإنذار لتجاوز عتبة الخطر الحرج")
      .replace(/Changement de statut opérationnel vers PRISE_EN_COMPTE/gi, "تغيير الحالة العملياتية نحو تم استلام البلاغ")
      .replace(/Changement de statut opérationnel vers UNITES_DEPLOYEES/gi, "تغيير الحالة العملياتية نحو تم نشر الوحدات")
      .replace(/Changement de statut opérationnel vers MAITRISE/gi, "تغيير الحالة العملياتية نحو تمت السيطرة")
      .replace(/Changement de statut opérationnel vers ETEINT/gi, "تغيير الحالة العملياتية نحو تم الإخماد")
      .replace(/Changement de statut opérationnel vers/gi, "تغيير الحالة العملياتية نحو")
      .replace(/Diffusion SMS d'urgence à (\d+) personnes/gi, "بث رسالة نصية عاجلة إلى $1 مواطن")
      .replace(/ALERTE INCENDIE FORÊT\s*\(Protection Civile\)/gi, "إنذار حريق غابات عاجل (الحماية المدنية)")
      .replace(/Alerte automatique générée/gi, "إنذار تلقائي صادر عن خوارزمية الذكاء الاصطناعي")
      .replace(/Nouveau signalement citoyen vérifié/gi, "بلاغ ميداني مؤكد من مواطن راصد")
      .replace(/Synchronisation globale NASA FIRMS/gi, "مزامنة شاملة لبيانات أقمار ناسا (FIRMS)")
      .replace(/Archivage et mise à jour de la carte thermique/gi, "أرشفة وتحديث الخريطة الحرارية للبؤر")
      .replace(/Synchronisation complète FIRMS:\s*\+(\d+)\s*points,\s*total\s*(\d+)\.\s*Carte archivée/gi, "مزامنة كاملة لفيرمز: +$1 نقطة، الإجمالي $2. تم أرشفة الخريطة")
      .replace(/NONE\s*->\s*DETECTED/gi, "لا يوجد ← تم الرصد")
      .replace(/DETECTED\s*->\s*PRISE_EN_COMPTE/gi, "تم الرصد ← تم استلام البلاغ")
      .replace(/PRISE_EN_COMPTE\s*->\s*UNITES_DEPLOYEES/gi, "تم استلام البلاغ ← تم نشر الوحدات")
      .replace(/UNITES_DEPLOYEES\s*->\s*MAITRISE/gi, "تم نشر الوحدات ← تمت السيطرة")
      .replace(/MAITRISE\s*->\s*ETEINT/gi, "تمت السيطرة ← تم الإخماد")
      .replace(/BROADCAST_SMS\s*->\s*SMS_ENVOYE/gi, "بث إنذار SMS ← تم إرسال الرسالة")
      .replace(/SOUS_SURVEILLANCE\s*->\s*ACTIF/gi, "تحت المراقبة ← نشط")
      .replace(/PRISE_EN_COMPTE/gi, "تم استلام البلاغ")
      .replace(/UNITES_DEPLOYEES/gi, "تم نشر الوحدات")
      .replace(/MAITRISE/gi, "تمت السيطرة")
      .replace(/ETEINT/gi, "تم الإخماد")
      .replace(/SMS_ENVOYE/gi, "تم إرسال الرسالة")
      .replace(/SOUS_SURVEILLANCE/gi, "تحت المراقبة")
      .replace(/ACTIF/gi, "نشط");
    return res;
  }

  if (lang === "en") {
    res = res
      .replace(/Protection Civile\s*:\s*Bejaia/gi, "Civil Protection: Bejaia")
      .replace(/Protection Civile\s*:\s*Tizi Ouzou/gi, "Civil Protection: Tizi Ouzou")
      .replace(/Protection Civile\s*:\s*Bouira/gi, "Civil Protection: Bouira")
      .replace(/Protection Civile\s*:\s*Blida/gi, "Civil Protection: Blida")
      .replace(/Protection Civile/gi, "Civil Protection")
      .replace(/Création automatique suite à dépassement du seuil critique\s*\(Risk > 85%\)/gi, "Automated alert creation: critical threshold exceeded (Risk > 85%)")
      .replace(/Création automatique suite à dépassement du seuil critique/gi, "Automated alert creation: critical threshold exceeded")
      .replace(/Changement de statut opérationnel vers PRISE_EN_COMPTE/gi, "Operational status updated to ACKNOWLEDGED")
      .replace(/Changement de statut opérationnel vers UNITES_DEPLOYEES/gi, "Operational status updated to UNITS_DEPLOYED")
      .replace(/Changement de statut opérationnel vers MAITRISE/gi, "Operational status updated to CONTAINED")
      .replace(/Changement de statut opérationnel vers ETEINT/gi, "Operational status updated to EXTINGUISHED")
      .replace(/Changement de statut opérationnel vers/gi, "Operational status updated to")
      .replace(/Diffusion SMS d'urgence à (\d+) personnes/gi, "Emergency SMS broadcast dispatched to $1 residents")
      .replace(/ALERTE INCENDIE FORÊT\s*\(Protection Civile\)/gi, "WILDFIRE EMERGENCY ALERT (Civil Protection)")
      .replace(/Alerte automatique générée/gi, "Automated wildfire alert generated")
      .replace(/Nouveau signalement citoyen vérifié/gi, "Field citizen wildfire observation verified")
      .replace(/Synchronisation globale NASA FIRMS/gi, "NASA FIRMS global satellite telemetry sync")
      .replace(/Archivage et mise à jour de la carte thermique/gi, "Thermal burn map updated and archived")
      .replace(/Synchronisation complète FIRMS:\s*\+(\d+)\s*points,\s*total\s*(\d+)\.\s*Carte archivée/gi, "Complete FIRMS sync: +$1 points, total $2. Map archived")
      .replace(/PRISE_EN_COMPTE/gi, "ACKNOWLEDGED")
      .replace(/UNITES_DEPLOYEES/gi, "UNITS_DEPLOYED")
      .replace(/MAITRISE/gi, "CONTAINED")
      .replace(/ETEINT/gi, "EXTINGUISHED")
      .replace(/SMS_ENVOYE/gi, "SMS_SENT")
      .replace(/SOUS_SURVEILLANCE/gi, "UNDER_SURVEILLANCE")
      .replace(/ACTIF/gi, "ACTIVE");
    return res;
  }

  // French: ensure consistent French wording
  res = res
    .replace(/ACKNOWLEDGED/gi, "PRISE_EN_COMPTE")
    .replace(/UNITS_DEPLOYED/gi, "UNITES_DEPLOYEES")
    .replace(/CONTAINED/gi, "MAITRISE")
    .replace(/EXTINGUISHED/gi, "ETEINT")
    .replace(/SMS_SENT/gi, "SMS_ENVOYE");

  return res;
}

export function getLocalizedWilaya(wilaya: string, lang: string): string {
  if (!wilaya) return wilaya;
  if (lang === "ar") {
    switch (wilaya.trim()) {
      case "Tizi Ouzou": return "تيزي وزو";
      case "Bejaia": return "بجاية";
      case "Bouira": return "البويرة";
      case "Blida": return "البليدة";
      case "Ain Defla": return "عين الدفلى";
      case "Tissemsilt": return "تيسمسيلت";
      case "Jijel": return "جيجل";
      case "Batna": return "باتنة";
      case "El Tarf": return "الطارف";
      case "Nord": 
      case "Nord Algérie": return "شمال الجزائر";
      default: return wilaya;
    }
  }
  if (lang === "en") {
    if (wilaya === "Nord" || wilaya === "Nord Algérie") return "Northern Algeria";
    return wilaya;
  }
  return wilaya;
}

