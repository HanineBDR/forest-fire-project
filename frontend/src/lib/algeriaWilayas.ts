/**
 * Algerian 58 Wilayas Dataset with Trilingual Localization and Coordinates
 */

export interface AlgeriaWilaya {
  code: string;
  nameFr: string;
  nameEn: string;
  nameAr: string;
  lat: number;
  lon: number;
  isHighFireRisk?: boolean;
}

export const ALGERIA_WILAYAS: AlgeriaWilaya[] = [
  // High fire risk Mediterranean & Tell Atlas forestry belt
  { code: "15", nameFr: "Tizi Ouzou", nameEn: "Tizi Ouzou", nameAr: "تيزي وزو", lat: 36.7169, lon: 4.0497, isHighFireRisk: true },
  { code: "06", nameFr: "Béjaïa", nameEn: "Bejaia", nameAr: "بجاية", lat: 36.7559, lon: 5.0843, isHighFireRisk: true },
  { code: "10", nameFr: "Bouira", nameEn: "Bouira", nameAr: "البويرة", lat: 36.3749, lon: 3.902, isHighFireRisk: true },
  { code: "18", nameFr: "Jijel", nameEn: "Jijel", nameAr: "جيجل", lat: 36.8206, lon: 5.7667, isHighFireRisk: true },
  { code: "09", nameFr: "Blida", nameEn: "Blida", nameAr: "البليدة", lat: 36.4722, lon: 2.8278, isHighFireRisk: true },
  { code: "36", nameFr: "El Tarf", nameEn: "El Tarf", nameAr: "الطارف", lat: 36.7672, lon: 8.3138, isHighFireRisk: true },
  { code: "21", nameFr: "Skikda", nameEn: "Skikda", nameAr: "سكيكدة", lat: 36.8787, lon: 6.9063, isHighFireRisk: true },
  { code: "42", nameFr: "Tipaza", nameEn: "Tipaza", nameAr: "تيبازة", lat: 36.5897, lon: 2.4475, isHighFireRisk: true },
  { code: "40", nameFr: "Khenchela", nameEn: "Khenchela", nameAr: "خنشلة", lat: 35.432, lon: 7.143, isHighFireRisk: true },
  { code: "05", nameFr: "Batna", nameEn: "Batna", nameAr: "باتنة", lat: 35.5558, lon: 6.1741, isHighFireRisk: true },
  { code: "19", nameFr: "Sétif", nameEn: "Setif", nameAr: "سطيف", lat: 36.1911, lon: 5.4137, isHighFireRisk: true },
  { code: "26", nameFr: "Médéa", nameEn: "Medea", nameAr: "المدية", lat: 36.2642, lon: 2.7539, isHighFireRisk: true },
  { code: "35", nameFr: "Boumerdès", nameEn: "Boumerdes", nameAr: "بومرداس", lat: 36.7664, lon: 3.4772, isHighFireRisk: true },
  { code: "44", nameFr: "Aïn Defla", nameEn: "Ain Defla", nameAr: "عين الدفلى", lat: 36.2644, lon: 1.9678, isHighFireRisk: true },
  { code: "02", nameFr: "Chlef", nameEn: "Chlef", nameAr: "الشلف", lat: 36.1653, lon: 1.3344, isHighFireRisk: true },
  { code: "13", nameFr: "Tlemcen", nameEn: "Tlemcen", nameAr: "تلمسان", lat: 34.8783, lon: -1.315, isHighFireRisk: true },
  { code: "24", nameFr: "Guelma", nameEn: "Guelma", nameAr: "قالمة", lat: 36.4622, lon: 7.4261, isHighFireRisk: true },
  { code: "41", nameFr: "Souk Ahras", nameEn: "Souk Ahras", nameAr: "سوق أهراس", lat: 36.2864, lon: 7.9511, isHighFireRisk: true },
  { code: "23", nameFr: "Annaba", nameEn: "Annaba", nameAr: "عنابة", lat: 36.9, lon: 7.7667, isHighFireRisk: true },
  { code: "16", nameFr: "Alger", nameEn: "Algiers", nameAr: "الجزائر", lat: 36.7538, lon: 3.0588, isHighFireRisk: false },
  { code: "31", nameFr: "Oran", nameEn: "Oran", nameAr: "وهران", lat: 35.6976, lon: -0.6337, isHighFireRisk: false },
  { code: "25", nameFr: "Constantine", nameEn: "Constantine", nameAr: "قسنطينة", lat: 36.365, lon: 6.6147, isHighFireRisk: false },
  { code: "43", nameFr: "Mila", nameEn: "Mila", nameAr: "ميلة", lat: 36.4503, lon: 6.2644, isHighFireRisk: true },
  { code: "38", nameFr: "Tissemsilt", nameEn: "Tissemsilt", nameAr: "تيسمسيلت", lat: 35.6072, lon: 1.8108, isHighFireRisk: true },
  { code: "29", nameFr: "Mascara", nameEn: "Mascara", nameAr: "معسكر", lat: 35.3969, lon: 0.1403, isHighFireRisk: true },
  { code: "27", nameFr: "Mostaganem", nameEn: "Mostaganem", nameAr: "مستغانم", lat: 35.9312, lon: 0.0892, isHighFireRisk: false },
  { code: "22", nameFr: "Sidi Bel Abbès", nameEn: "Sidi Bel Abbes", nameAr: "سيدي بلعباس", lat: 35.1903, lon: -0.6308, isHighFireRisk: true },
  { code: "14", nameFr: "Tiaret", nameEn: "Tiaret", nameAr: "تيارت", lat: 35.3711, lon: 1.3169, isHighFireRisk: true },
  { code: "20", nameFr: "Saïda", nameEn: "Saida", nameAr: "سعيدة", lat: 34.8303, lon: 0.1517, isHighFireRisk: true },
  { code: "46", nameFr: "Aïn Témouchent", nameEn: "Ain Temouchent", nameAr: "عين تموشنت", lat: 35.2975, lon: -1.1403, isHighFireRisk: false },
  { code: "48", nameFr: "Relizane", nameEn: "Relizane", nameAr: "غليزان", lat: 35.7372, lon: 0.5558, isHighFireRisk: false },
  { code: "34", nameFr: "Bordj Bou Arreridj", nameEn: "Bordj Bou Arreridj", nameAr: "برج بوعريريج", lat: 36.0731, lon: 4.7611, isHighFireRisk: true },
  { code: "28", nameFr: "M'Sila", nameEn: "M'Sila", nameAr: "المسيلة", lat: 35.7058, lon: 4.5419, isHighFireRisk: false },
  { code: "17", nameFr: "Djelfa", nameEn: "Djelfa", nameAr: "الجلفة", lat: 34.6728, lon: 3.2631, isHighFireRisk: false },
  { code: "04", nameFr: "Oum El Bouaghi", nameEn: "Oum El Bouaghi", nameAr: "أم البواقي", lat: 35.8756, lon: 7.1136, isHighFireRisk: false },
  { code: "12", nameFr: "Tébessa", nameEn: "Tebessa", nameAr: "تبسة", lat: 35.4042, lon: 8.1242, isHighFireRisk: false },
  { code: "07", nameFr: "Biskra", nameEn: "Biskra", nameAr: "بسكرة", lat: 34.8517, lon: 5.7281, isHighFireRisk: false },
  { code: "03", nameFr: "Laghouat", nameEn: "Laghouat", nameAr: "الأغواط", lat: 33.8, lon: 2.865, isHighFireRisk: false },
  { code: "32", nameFr: "El Bayadh", nameEn: "El Bayadh", nameAr: "البيض", lat: 33.6831, lon: 1.0192, isHighFireRisk: false },
  { code: "45", nameFr: "Naâma", nameEn: "Naama", nameAr: "النعامة", lat: 33.2667, lon: -0.3167, isHighFireRisk: false },
  { code: "39", nameFr: "El Oued", nameEn: "El Oued", nameAr: "الوادي", lat: 33.3683, lon: 6.8675, isHighFireRisk: false },
  { code: "47", nameFr: "Ghardaïa", nameEn: "Ghardaia", nameAr: "غرداية", lat: 32.4914, lon: 3.6736, isHighFireRisk: false },
  { code: "30", nameFr: "Ouargla", nameEn: "Ouargla", nameAr: "ورقلة", lat: 31.9539, lon: 5.3303, isHighFireRisk: false },
  { code: "08", nameFr: "Béchar", nameEn: "Bechar", nameAr: "بشار", lat: 31.6167, lon: -2.2167, isHighFireRisk: false },
  { code: "01", nameFr: "Adrar", nameEn: "Adrar", nameAr: "أدرار", lat: 27.8742, lon: -0.2939, isHighFireRisk: false },
  { code: "11", nameFr: "Tamanrasset", nameEn: "Tamanrasset", nameAr: "تمنراست", lat: 22.785, lon: 5.5228, isHighFireRisk: false },
  { code: "33", nameFr: "Illizi", nameEn: "Illizi", nameAr: "إليزي", lat: 26.4833, lon: 8.4667, isHighFireRisk: false },
  { code: "37", nameFr: "Tindouf", nameEn: "Tindouf", nameAr: "تندوف", lat: 27.6711, lon: -8.1478, isHighFireRisk: false },
  { code: "49", nameFr: "Timimoun", nameEn: "Timimoun", nameAr: "تيميمون", lat: 29.2639, lon: 0.2311, isHighFireRisk: false },
  { code: "50", nameFr: "Bordj Badji Mokhtar", nameEn: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", lat: 21.3283, lon: 0.9547, isHighFireRisk: false },
  { code: "51", nameFr: "Ouled Djellal", nameEn: "Ouled Djellal", nameAr: "أولاد جلال", lat: 34.4333, lon: 5.0667, isHighFireRisk: false },
  { code: "52", nameFr: "Béni Abbès", nameEn: "Beni Abbes", nameAr: "بني عباس", lat: 30.1333, lon: -2.1667, isHighFireRisk: false },
  { code: "53", nameFr: "In Salah", nameEn: "In Salah", nameAr: "عين صالح", lat: 27.1936, lon: 2.4608, isHighFireRisk: false },
  { code: "54", nameFr: "In Guezzam", nameEn: "In Guezzam", nameAr: "عين قزام", lat: 19.5683, lon: 5.7667, isHighFireRisk: false },
  { code: "55", nameFr: "Touggourt", nameEn: "Touggourt", nameAr: "تقرت", lat: 33.1056, lon: 6.0583, isHighFireRisk: false },
  { code: "56", nameFr: "Djanet", nameEn: "Djanet", nameAr: "جانت", lat: 24.5539, lon: 9.4847, isHighFireRisk: false },
  { code: "57", nameFr: "El M'Ghair", nameEn: "El M'Ghair", nameAr: "المغير", lat: 33.95, lon: 5.9167, isHighFireRisk: false },
  { code: "58", nameFr: "El Meniaa", nameEn: "El Meniaa", nameAr: "المنيعة", lat: 30.5833, lon: 2.8833, isHighFireRisk: false },
];

export function getWilayaByCode(code: string): AlgeriaWilaya | undefined {
  return ALGERIA_WILAYAS.find((w) => w.code === code);
}

export function getWilayaByName(name: string): AlgeriaWilaya | undefined {
  if (!name) return undefined;
  const n = name.toLowerCase().trim();
  return ALGERIA_WILAYAS.find(
    (w) =>
      w.nameFr.toLowerCase().includes(n) ||
      w.nameEn.toLowerCase().includes(n) ||
      w.nameAr.includes(name.trim()) ||
      n.includes(w.nameFr.toLowerCase()) ||
      n.includes(w.nameEn.toLowerCase())
  );
}

export function formatWilayaLabel(w: AlgeriaWilaya, lang: string = "fr"): string {
  if (lang === "ar") {
    return `${w.nameAr} (${w.code})`;
  }
  if (lang === "en") {
    return `${w.nameEn} (${w.code})`;
  }
  return `${w.nameFr} (${w.code})`;
}

