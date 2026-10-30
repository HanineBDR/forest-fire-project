"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Cpu,
  Radio,
  Thermometer,
  Wind,
  Battery,
  Droplets,
  AlertTriangle,
  WifiOff,
  Signal,
  MapPin,
  Clock,
  Layers,
  CheckCircle2,
  Activity,
  Flame,
  CloudFog,
  Send,
  Zap,
  Users,
  Trees,
  Compass,
  FileText,
  Download,
  ShieldAlert,
  X,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import type { TacticalReportData } from "@/lib/pdfReportGenerator";
import { useLanguage } from "@/context/LanguageContext";
import {
  getLocalizedMassifName,
  getLocalizedWilayaName,
  getLocalizedWindDirection,
} from "@/lib/notificationTypes";

interface SensorNode {
  id: string;
  name: string;
  wilaya: string;
  wilayaCode: string;
  lat: number;
  lon: number;
  elevation: number;
  type: string;
  temp: number;
  humidity: number;
  wind: number;
  windDir: string;
  co2: number;
  battery: number;
  hasHumanPopulation: boolean;
  populationCount: number;
  populationDetails: string;
  faunaSpecies: string;
  canopyDensityPercent: number;
  canopyDensityText: string;
  topography: string;
  spreadAxis: string;
}

const INITIAL_NODES: SensorNode[] = [
  {
    id: "IOT-YAK-01",
    name: "Massif de Yakouren",
    wilaya: "Tizi Ouzou",
    wilayaCode: "W. 15",
    lat: 36.735,
    lon: 4.435,
    elevation: 850,
    type: "Vigie Haute Crête",
    temp: 38.5,
    humidity: 17,
    wind: 44,
    windDir: "Sud (Sirocco)",
    co2: 685,
    battery: 92,
    hasHumanPopulation: true,
    populationCount: 14500,
    populationDetails: "14 500 habitants : Villages Ait Bouhini, Tablabalt et habitations le long du CW 150",
    faunaSpecies: "Macaque de Barbarie (Macaca sylvanus), Cerf de Barbarie, rapaces nicheurs, cheptels caprins",
    canopyDensityPercent: 88,
    canopyDensityText: "Densité Très Forte (88%) : Chêne-liège séculaire, chêne zéen et sous-bois dense à forte charge combustible",
    topography: "Relief montagneux accidenté, crêtes rocheuses et vallons encaissés créant un effet venturi",
    spreadAxis: "Axe Nord-Nord-Est vers cuvette de Yakouren Centre et lisière de la forêt domaniale d'Akfadou",
  },
  {
    id: "IOT-AKF-02",
    name: "Massif d'Akfadou",
    wilaya: "Bejaia",
    wilayaCode: "W. 06",
    lat: 36.65,
    lon: 4.55,
    elevation: 1200,
    type: "Poste Forestier Sommet",
    temp: 34.0,
    humidity: 24,
    wind: 36,
    windDir: "Sud-Est",
    co2: 520,
    battery: 88,
    hasHumanPopulation: true,
    populationCount: 8200,
    populationDetails: "8 200 habitants : Communes d'Adekar, Taourirt Ighil et hameaux forestiers isolés",
    faunaSpecies: "Singe magot, Sanglier d'Afrique du Nord, Aigle botté, Chacal doré",
    canopyDensityPercent: 92,
    canopyDensityText: "Densité Maximale (92%) : Forêt humide mixte à haute densité de biomasse et litière épaisse",
    topography: "Hauts plateaux et ravins profonds, zone humide d'altitude du Lac Noir",
    spreadAxis: "Axe Est-Nord-Est vers les versants surplombant la vallée de la Soummam",
  },
  {
    id: "IOT-TKJ-03",
    name: "Djurdjura - Tikjda",
    wilaya: "Bouira",
    wilayaCode: "W. 10",
    lat: 36.45,
    lon: 4.12,
    elevation: 1600,
    type: "Station Météo Alpine",
    temp: 29.5,
    humidity: 32,
    wind: 28,
    windDir: "Sud-Ouest",
    co2: 430,
    battery: 95,
    hasHumanPopulation: true,
    populationCount: 1800,
    populationDetails: "1 800 personnes : Chalets du Centre National de Sports, bergers saisonniers et personnel hôtelier",
    faunaSpecies: "Gypaète barbu, Vautour percnoptère, Macaque de Barbarie, genette d'Europe",
    canopyDensityPercent: 65,
    canopyDensityText: "Densité Moyenne (65%) : Cédraie d'altitude clairsemée sur pelouses calcaires combustibles",
    topography: "Falaises abruptes et crêtes calcaires au-dessus de 1 500m",
    spreadAxis: "Axe Sud-Ouest vers le col de Tizi N'Koulal et la lisière inférieure",
  },
  {
    id: "IOT-GRY-04",
    name: "Parc National de Gouraya",
    wilaya: "Bejaia",
    wilayaCode: "W. 06",
    lat: 36.76,
    lon: 5.06,
    elevation: 660,
    type: "Capteur Falaise Côtière",
    temp: 33.2,
    humidity: 48,
    wind: 32,
    windDir: "Nord-Ouest",
    co2: 445,
    battery: 84,
    hasHumanPopulation: true,
    populationCount: 22000,
    populationDetails: "22 000 habitants : Quartiers périurbains hauts de Bejaia, route touristique du Cap Carbon",
    faunaSpecies: "Macaque de Barbarie (colonie majeure protégée), Faucon pèlerin, Goéland d'Audouin",
    canopyDensityPercent: 75,
    canopyDensityText: "Densité Forte (75%) : Pin d'Alep résineux et garrigue méditerranéenne très inflammable",
    topography: "Corniche maritime rocheuse à forte pente plongeant directement dans la mer",
    spreadAxis: "Axe Sud-Sud-Est vers les habitations surplombant le port de Bejaia",
  },
  {
    id: "IOT-MIZ-05",
    name: "Forêt de Mizrana",
    wilaya: "Tizi Ouzou",
    wilayaCode: "W. 15",
    lat: 36.78,
    lon: 4.08,
    elevation: 450,
    type: "Interface Forêt-Village",
    temp: 36.8,
    humidity: 21,
    wind: 38,
    windDir: "Sud (Sirocco)",
    co2: 610,
    battery: 90,
    hasHumanPopulation: true,
    populationCount: 9600,
    populationDetails: "9 600 habitants : Villages Mizrana, lisière ouest de Tigzirt, exploitations agricoles familiales",
    faunaSpecies: "Renard roux, Lièvre d'Afrique, rapaces nocturnes, élevages bovins et ovins",
    canopyDensityPercent: 82,
    canopyDensityText: "Densité Forte (82%) : Chêne-liège avec sous-bois buissonnant ininterrompu",
    topography: "Collines ondulées côtières traversées par des pistes pastorales étroites",
    spreadAxis: "Axe Nord vers les zones d'habitations de la corniche de Tigzirt",
  },
  {
    id: "IOT-BAB-06",
    name: "Massif des Babors",
    wilaya: "Setif / Jijel",
    wilayaCode: "W. 19/18",
    lat: 36.55,
    lon: 5.48,
    elevation: 2004,
    type: "Station Sommet Nuageux",
    temp: 28.0,
    humidity: 42,
    wind: 30,
    windDir: "Nord-Est",
    co2: 418,
    battery: 79,
    hasHumanPopulation: false,
    populationCount: 0,
    populationDetails: "Zone sanctuarisée inhabitée : Aucun village permanent dans le périmètre direct de la réserve",
    faunaSpecies: "Sittelle kabyle (Sitta ledanti, espèce endémique mondiale), Léopard de Barbarie historique",
    canopyDensityPercent: 94,
    canopyDensityText: "Densité Exceptionnelle (94%) : Forêt relique de Sapin de Numidie et Chêne afares",
    topography: "Sommet pyramidal isolé entouré d'abrupts rocheux et de vallons humides",
    spreadAxis: "Axe Nord-Est vers les forêts profondes de Jijel sans menace d'agglomération directe",
  },
  {
    id: "IOT-CHR-07",
    name: "Parc National de Chréa",
    wilaya: "Blida",
    wilayaCode: "W. 09",
    lat: 36.416,
    lon: 2.833,
    elevation: 1500,
    type: "Vigie Crête Tellienne",
    temp: 35.5,
    humidity: 19,
    wind: 41,
    windDir: "Sud (Sirocco)",
    co2: 590,
    battery: 86,
    hasHumanPopulation: true,
    populationCount: 12000,
    populationDetails: "12 000 habitants : Agglomération de Chréa, habitations des Gorges de la Chiffa et chalets",
    faunaSpecies: "Macaque de Barbarie, Aigle royal, Martre des pins, faune sylvestre de l'Atlas",
    canopyDensityPercent: 85,
    canopyDensityText: "Densité Forte (85%) : Cédraie majestueuse de l'Atlas et pinède dense à fort indice de danger",
    topography: "Versants montagneux escarpés dominant la plaine agricole de la Mitidja",
    spreadAxis: "Axe Nord vers les lisières habitées de Blida et les gorges de la Chiffa",
  },
  {
    id: "IOT-KAL-08",
    name: "Parc National d'El Kala",
    wilaya: "El Tarf",
    wilayaCode: "W. 36",
    lat: 36.89,
    lon: 8.44,
    elevation: 120,
    type: "Capteur Zone Humide & Forêt",
    temp: 37.0,
    humidity: 26,
    wind: 35,
    windDir: "Sud-Est",
    co2: 540,
    battery: 91,
    hasHumanPopulation: true,
    populationCount: 16500,
    populationDetails: "16 500 habitants : Agglomération d'El Kala, riverains des Lacs Tonga et Oubeira, postes frontières",
    faunaSpecies: "Cerf de Barbarie (dernière population indigène en liberté), Loutre d'Europe, rapaces aquatiques",
    canopyDensityPercent: 90,
    canopyDensityText: "Densité Très Forte (90%) : Chênaie-liège côtière avec sous-bois dense de bruyère arborescente",
    topography: "Zones humides marécageuses ceinturées de collines boisées sableuses",
    spreadAxis: "Axe Est vers la zone frontière algéro-tunisienne et les campements d'éleveurs",
  },
  {
    id: "IOT-AUR-09",
    name: "Aurès - Mont Chélia",
    wilaya: "Batna / Khenchela",
    wilayaCode: "W. 05/40",
    lat: 35.31,
    lon: 6.64,
    elevation: 1800,
    type: "Capteur Sécheresse Semi-Aride",
    temp: 39.2,
    humidity: 14,
    wind: 48,
    windDir: "Sud (Sirocco)",
    co2: 710,
    battery: 83,
    hasHumanPopulation: true,
    populationCount: 5100,
    populationDetails: "5 100 habitants : Hameaux de Bouhmama, Yabous et vergers arboricoles en contrebas",
    faunaSpecies: "Mouflon à manchettes, Gazelle de Cuvier, sangliers des Aurès, rapaces des steppes",
    canopyDensityPercent: 70,
    canopyDensityText: "Densité Moyenne (70%) : Cèdre de l'Atlas et Pin d'Alep en climat semi-aride à sécheresse extrême",
    topography: "Massif culminant de l'est algérien (2 328m), pentes rocheuses abruptes et ventées",
    spreadAxis: "Axe Sud-Est vers la dépression agricole de Bouhmama et les vergers de pommiers",
  },
  {
    id: "IOT-GUE-10",
    name: "Forêt de Guerrouche",
    wilaya: "Jijel",
    wilayaCode: "W. 18",
    lat: 36.69,
    lon: 5.58,
    elevation: 900,
    type: "Poste Ravin Humide",
    temp: 32.5,
    humidity: 35,
    wind: 24,
    windDir: "Nord-Ouest",
    co2: 435,
    battery: 89,
    hasHumanPopulation: true,
    populationCount: 4800,
    populationDetails: "4 800 habitants : Villages d'Erraguene, ouvriers du barrage hydroélectrique et exploitants de liège",
    faunaSpecies: "Macaque de Barbarie, Chacal doré, Genette, amphibiens rares des torrents de montagne",
    canopyDensityPercent: 91,
    canopyDensityText: "Densité Très Forte (91%) : Chêne-liège vierge et ripisylve fluviale luxuriante",
    topography: "Gorges encaissées et vallées profondes à forte humidité ambiante",
    spreadAxis: "Axe Nord vers les gorges de la Soummam et les installations hydrauliques d'Erraguene",
  },
  {
    id: "IOT-CHE-11",
    name: "Mont Chenoua & Sidi Amar",
    wilaya: "Tipaza",
    wilayaCode: "W. 42",
    lat: 36.595,
    lon: 2.418,
    elevation: 905,
    type: "Vigie Côtière Littorale",
    temp: 36.0,
    humidity: 22,
    wind: 39,
    windDir: "Sud (Sirocco)",
    co2: 575,
    battery: 94,
    hasHumanPopulation: true,
    populationCount: 18300,
    populationDetails: "18 300 habitants : Chenoua Plage, villages de montagne, campus universitaire et résidences de Sidi Amar",
    faunaSpecies: "Tortue mauresque, Caméléon commun, rongeurs sauvages, oiseaux marins littoraux",
    canopyDensityPercent: 78,
    canopyDensityText: "Densité Forte (78%) : Pin d'Alep résineux, maquis de lentisque et calicotome hautement combustible",
    topography: "Promontoire maritime culminant à pic au-dessus de la baie de Tipaza",
    spreadAxis: "Axe Est vers le tissu urbain de Tipaza ville et le complexe archéologique protégé",
  },
];

const WIND_DIRECTIONS = [
  "Nord",
  "Nord-Est",
  "Est",
  "Sud-Est",
  "Sud (Sirocco)",
  "Sud-Ouest",
  "Ouest",
  "Nord-Ouest",
];

export default function IoTPage() {
  const { t, language } = useLanguage();
  const { alertPanel } = useNotifications();
  const [nodes, setNodes] = useState<SensorNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("IOT-YAK-01");

  // Selected Node State
  const activeNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  // Extended range telemetry controls
  const [customTemp, setCustomTemp] = useState<number>(activeNode.temp);
  const [customHumidity, setCustomHumidity] = useState<number>(activeNode.humidity);
  const [customWind, setCustomWind] = useState<number>(activeNode.wind);
  const [customWindDir, setCustomWindDir] = useState<string>(activeNode.windDir);
  const [customCO2, setCustomCO2] = useState<number>(activeNode.co2);
  const [ingestionCount, setIngestionCount] = useState<number>(1);
  const [lastIngestedAt, setLastIngestedAt] = useState<string>(
    language === "ar" ? "الآن" : language === "en" ? "Just now" : "À l'instant"
  );

  // Helper functions for localized labels
  const getLocalizedRiskLevel = (level: string) => {
    if (language === "ar") {
      if (level.includes("Critique") || level.includes("Critical") || level.includes("Très")) return "شديد الارتفاع (حرج)";
      if (level.includes("Élevé") || level.includes("High")) return "مرتفع";
      if (level.includes("Modéré") || level.includes("Moderate")) return "متوسط";
      return "منخفض";
    }
    if (language === "en") {
      if (level.includes("Critique") || level.includes("Critical") || level.includes("Très")) return "Very High (Critical)";
      if (level.includes("Élevé") || level.includes("High")) return "High";
      if (level.includes("Modéré") || level.includes("Moderate")) return "Moderate";
      return "Low";
    }
    return level;
  };

  const formatLocalizedWindDir = (dir: string) => {
    if (language === "ar") {
      return dir.replace(/Sud \(Sirocco\)/gi, "جنوب (الشهيلي)")
                .replace(/Sud-Est/gi, "جنوب شرق")
                .replace(/Sud-Ouest/gi, "جنوب غرب")
                .replace(/Nord-Est/gi, "شمال شرق")
                .replace(/Nord-Ouest/gi, "شمال غرب")
                .replace(/Nord/gi, "شمال")
                .replace(/Sud/gi, "جنوب")
                .replace(/Est/gi, "شرق")
                .replace(/Ouest/gi, "غرب");
    }
    if (language === "en") {
      return dir.replace(/Sud \(Sirocco\)/gi, "South (Sirocco)")
                .replace(/Sud-Est/gi, "South-East")
                .replace(/Sud-Ouest/gi, "South-West")
                .replace(/Nord-Est/gi, "North-East")
                .replace(/Nord-Ouest/gi, "North-West")
                .replace(/Nord/gi, "North")
                .replace(/Sud/gi, "South")
                .replace(/Est/gi, "East")
                .replace(/Ouest/gi, "West");
    }
    return dir;
  };

  const getLocalizedNodeType = (typeStr: string) => {
    if (language === "ar") {
      if (typeStr.includes("Vigie Haute Crête")) return "برج مراقبة قمة عالية";
      if (typeStr.includes("Poste Forestier Sommet")) return "مركز غابي - قمة";
      if (typeStr.includes("Station Météo Alpine")) return "محطة طقس جبلية";
      if (typeStr.includes("Capteur Falaise Côtière")) return "مستشعر جرف ساحلي";
      if (typeStr.includes("Poste d'Observation Crête")) return "مركز مراقبة القمم";
      if (typeStr.includes("Capteur Col Montagneux")) return "مستشعر ممر جبلي";
      if (typeStr.includes("Vigie Forestière Sommet")) return "برج مراقبة غابي";
      if (typeStr.includes("Capteur Zone Humide")) return "مستشعر رطوبة وغابات";
      if (typeStr.includes("Capteur Sécheresse Semi-Aride")) return "مستشعر جفاف شبه جاف";
      if (typeStr.includes("Station Climatologique")) return "محطة مناخية";
      if (typeStr.includes("Vigie Côtière Littorale")) return "برج مراقبة ساحلي";
      if (typeStr.includes("Station Sommet Nuageux")) return "محطة قمة ضبابية";
      if (typeStr.includes("Interface Forêt-Village")) return "واجهة الغابة والقرية";
      if (typeStr.includes("Vigie Crête Tellienne")) return "برج مراقبة الأطلس التلي";
      if (typeStr.includes("Poste Ravin Humide")) return "مركز واد رطب";
      return typeStr;
    }
    if (language === "en") {
      if (typeStr.includes("Vigie Haute Crête")) return "High Ridge Tower";
      if (typeStr.includes("Poste Forestier Sommet")) return "Summit Forest Station";
      if (typeStr.includes("Station Météo Alpine")) return "Alpine Weather Station";
      if (typeStr.includes("Capteur Falaise Côtière")) return "Coastal Cliff Sensor";
      if (typeStr.includes("Poste d'Observation Crête")) return "Ridge Watch Station";
      if (typeStr.includes("Capteur Col Montagneux")) return "Mountain Pass Sensor";
      if (typeStr.includes("Vigie Forestière Sommet")) return "Summit Forest Tower";
      if (typeStr.includes("Capteur Zone Humide")) return "Wetland & Forest Sensor";
      if (typeStr.includes("Capteur Sécheresse Semi-Aride")) return "Semi-Arid Drought Sensor";
      if (typeStr.includes("Station Climatologique")) return "Climatological Station";
      if (typeStr.includes("Vigie Côtière Littorale")) return "Coastal Littoral Tower";
      if (typeStr.includes("Station Sommet Nuageux")) return "Cloudy Summit Station";
      if (typeStr.includes("Interface Forêt-Village")) return "Forest-Village Interface";
      if (typeStr.includes("Vigie Crête Tellienne")) return "Tellian Ridge Watchtower";
      if (typeStr.includes("Poste Ravin Humide")) return "Humid Ravine Station";
      return typeStr;
    }
    return typeStr;
  };

  const getLocalizedNodeName = (name: string) => {
    if (language === "ar") {
      if (name.includes("Yakouren")) return "كتلة إعكوران الغابية";
      if (name.includes("Akfadou")) return "كتلة أكفادو الغابية";
      if (name.includes("Tikjda")) return "جرجرة - تيكجدة";
      if (name.includes("Gouraya")) return "الحظيرة الوطنية قورايا";
      if (name.includes("Mizrana")) return "غابة ميزرانة";
      if (name.includes("Babors")) return "كتلة البابور الغابية";
      if (name.includes("Chréa") || name.includes("Chrea")) return "الحظيرة الوطنية الشريعة";
      if (name.includes("Kala")) return "الحظيرة الوطنية القالة";
      if (name.includes("Chélia") || name.includes("Chelia")) return "الأوراس - جبل شيليا";
      if (name.includes("Guerrouche")) return "غابة غروشن";
      if (name.includes("Chenoua")) return "جبل شنوة وسيدي عمار";
    }
    if (language === "en") {
      if (name.includes("Yakouren")) return "Yakouren Massif";
      if (name.includes("Akfadou")) return "Akfadou Massif";
      if (name.includes("Tikjda")) return "Djurdjura - Tikjda";
      if (name.includes("Gouraya")) return "Gouraya National Park";
      if (name.includes("Mizrana")) return "Mizrana Forest";
      if (name.includes("Babors")) return "Babors Massif";
      if (name.includes("Chréa") || name.includes("Chrea")) return "Chrea National Park";
      if (name.includes("Kala")) return "El Kala National Park";
      if (name.includes("Chélia") || name.includes("Chelia")) return "Aures - Mount Chelia";
      if (name.includes("Guerrouche")) return "Guerrouche Forest";
      if (name.includes("Chenoua")) return "Mount Chenoua & Sidi Amar";
    }
    return name;
  };

  const getLocalizedWilaya = (wilaya: string) => {
    if (language === "ar") {
      if (wilaya.includes("Tizi")) return "تيزي وزو";
      if (wilaya.includes("Bejaia")) return "بجاية";
      if (wilaya.includes("Bouira")) return "البويرة";
      if (wilaya.includes("Setif")) return "سطيف / جيجل";
      if (wilaya.includes("Blida")) return "البليدة";
      if (wilaya.includes("Tarf")) return "الطارف";
      if (wilaya.includes("Batna")) return "باتنة / خنشلة";
      if (wilaya.includes("Jijel")) return "جيجل";
      if (wilaya.includes("Tipaza")) return "تيبازة";
    }
    return wilaya;
  };

  const getLocalizedTopography = (id: string, fallback: string) => {
    if (language === "ar") {
      switch (id) {
        case "IOT-YAK-01": return "تضاريس جبلية وعرة، قمم صخرية ووديان ضيقة تحدث تأثير فينتوري للرياح";
        case "IOT-AKF-02": return "هضاب عليا ووديان عميقة، المنطقة الرطبة لبحيرة أكفادو (البحيرة السوداء)";
        case "IOT-TKJ-03": return "منحدرات صخرية شاهقة وقمم كلسية ترتفع لأكثر من 1500م";
        case "IOT-GRY-04": return "كورنيش بحري صخري شديد الانحدار ينحدر مباشرة نحو البحر الأبيض المتوسط";
        case "IOT-MIZ-05": return "تلال ساحلية متموجة تتقاطع مع مسالك رعوية ضيقة";
        case "IOT-BAB-06": return "قمة هرمية معزولة محاطة بمنحدرات صخرية شاهقة ووديان رطبة";
        case "IOT-CHR-07": return "منحدرات جبلية وعرة تشرف على سهل متيجة الفلاحي";
        case "IOT-KAL-08": return "مناطق رطبة ومستنقعات محاطة بتلال رملية حرجية";
        case "IOT-AUR-09": return "الكتلة الجبلية الأعلى بشرق الجزائر (2328م)، منحدرات صخرية شاهقة ومعرضة للرياح";
        case "IOT-GUE-10": return "خوانق ومضايق عميقة ذات رطوبة جوية عالية";
        case "IOT-CHE-11": return "نتوء بحري شاهق يشرف عمودياً على خليج تيبازة";
        default: return fallback;
      }
    }
    if (language === "en") {
      switch (id) {
        case "IOT-YAK-01": return "Rugged mountainous terrain, rocky crests and narrow valleys creating a venturi wind effect";
        case "IOT-AKF-02": return "High plateaus and deep ravines, high-altitude wetland of Black Lake";
        case "IOT-TKJ-03": return "Steep cliffs and limestone crests above 1,500m elevation";
        case "IOT-GRY-04": return "Steep rocky maritime cornice plunging directly into the sea";
        case "IOT-MIZ-05": return "Undulating coastal hills crossed by narrow pastoral tracks";
        case "IOT-BAB-06": return "Isolated pyramidal summit surrounded by rocky escarpments and humid valleys";
        case "IOT-CHR-07": return "Steep mountainous slopes overlooking the agricultural plain of Mitidja";
        case "IOT-KAL-08": return "Marshy wetlands ringed by sandy wooded hills";
        case "IOT-AUR-09": return "Highest summit in eastern Algeria (2,328m), steep wind-swept rocky slopes";
        case "IOT-GUE-10": return "Narrow gorges and deep valleys with high ambient humidity";
        case "IOT-CHE-11": return "High maritime promontory dropping sheer into the bay of Tipaza";
        default: return fallback;
      }
    }
    return fallback;
  };

  const getLocalizedPopulationDetails = (id: string, fallback: string) => {
    if (language === "ar") {
      switch (id) {
        case "IOT-YAK-01": return "14,500 ساكن : قرى آيت بوحيني، تابلبالت ومساكن على طول الطريق الولائي 150";
        case "IOT-AKF-02": return "8,200 ساكن : بلديات أدكار، تاوريرت إغيل وقرى غابية معزولة";
        case "IOT-TKJ-03": return "1,800 شخص : شاليهات المركز الوطني للرياضة، رعاة موسمييون وموظفو الفنادق";
        case "IOT-GRY-04": return "22,000 ساكن : الأحياء الحضرية العليا لمدينة بجاية، طريق رأس كربون السياحي";
        case "IOT-MIZ-05": return "9,600 ساكن : قرى ميزرانة، الحافة الغربية لتيقزيرت والمزارع العائلية";
        case "IOT-BAB-06": return "منطقة محمية غير مأهولة : لا توجد قرى دائمة داخل النطاق المباشر للمحمية";
        case "IOT-CHR-07": return "12,000 ساكن : تجمع الشريعة السكني، مساكن مضايق الشفة والشاليهات";
        case "IOT-KAL-08": return "16,500 ساكن : تجمع القالة، مجاورو بحيرتي طونغا وأوبيرة، والمراكز الحدودية";
        case "IOT-AUR-09": return "5,100 ساكن : قرى بوحمامة، يابوس وبساتين الأشجار المثمرة السفلية";
        case "IOT-GUE-10": return "4,800 ساكن : قرى إيراقن، عمال السد الكهرومائي ومستثمرو الفلين";
        case "IOT-CHE-11": return "18,300 ساكن : شاطئ شنوة، القرى الجبلية، الحرم الجامعي وإقامات سيدي عمار";
        default: return fallback;
      }
    }
    if (language === "en") {
      switch (id) {
        case "IOT-YAK-01": return "14,500 residents: Villages of Ait Bouhini, Tablabalt, and settlements along CW 150";
        case "IOT-AKF-02": return "8,200 residents: Communes of Adekar, Taourirt Ighil, and isolated forest hamlets";
        case "IOT-TKJ-03": return "1,800 people: National Sports Center chalets, seasonal shepherds, and hospitality staff";
        case "IOT-GRY-04": return "22,000 residents: Upper peri-urban neighborhoods of Bejaia, Cap Carbon scenic road";
        case "IOT-MIZ-05": return "9,600 residents: Mizrana villages, western edge of Tigzirt, family agricultural holdings";
        case "IOT-BAB-06": return "Protected uninhabited reserve: No permanent villages within the immediate sanctuary bounds";
        case "IOT-CHR-07": return "12,000 residents: Chrea agglomeration, settlements along Chiffa Gorges, and chalets";
        case "IOT-KAL-08": return "16,500 residents: El Kala town, residents around Lakes Tonga & Oubeira, border posts";
        case "IOT-AUR-09": return "5,100 residents: Bouhmama hamlets, Yabous, and foothill apple orchards";
        case "IOT-GUE-10": return "4,800 residents: Erraguene villages, hydroelectric dam personnel, and cork harvesters";
        case "IOT-CHE-11": return "18,300 residents: Chenoua Plage, mountain settlements, university campus, Sidi Amar";
        default: return fallback;
      }
    }
    return fallback;
  };

  const getLocalizedFaunaSpecies = (id: string, fallback: string) => {
    if (language === "ar") {
      switch (id) {
        case "IOT-YAK-01": return "قرد المكاك البربري (الماغو)، الأيل البربري، جوارح معششة، قطعان ماعز";
        case "IOT-AKF-02": return "قرد الماغو، الخنزير البري لشمال أفريقيا، عقاب مسيرة، ابن آوى الذهبي";
        case "IOT-TKJ-03": return "النسر الملتحي، الرخمة المصرية، قرد الماغو، زريقاء أوروبية";
        case "IOT-GRY-04": return "قرد الماغو (مستعمرة رئيسية محمية)، الصقر الجوال، نورس أودوان";
        case "IOT-MIZ-05": return "الثعلب الأحمر، الأرنب البري الإفريقي، جوارح ليلية، مواشي وأغنام";
        case "IOT-BAB-06": return "كاسر الجوز القبائلي (طائر متوطن عالمياً في البابور)، النمر البربري التاريخي";
        case "IOT-CHR-07": return "قرد المكاك البربري، العقاب الذهبي، خردف الصنوبر، حيوانات الأطلس الغابية";
        case "IOT-KAL-08": return "الأيل البربري (آخر مجتمع بري أصيل طليق)، قضاعة الماء الأوروبية، كواسر مائية";
        case "IOT-AUR-09": return "الأروي المغاربي (الضأن البري)، غزال كوفييه، خنازير الأوراس، كواسر السهوب";
        case "IOT-GUE-10": return "قرد الماغو، ابن آوى الذهبي، الزريقاء، برمائيات نادرة لوديان الجبال";
        case "IOT-CHE-11": return "السلحفاة المغاربية، الحرباء الشائعة، قوارض برية، طيور بحرية شاطئية";
        default: return fallback;
      }
    }
    if (language === "en") {
      switch (id) {
        case "IOT-YAK-01": return "Barbary Macaque (Macaca sylvanus), Barbary Stag, nesting raptors, goat herds";
        case "IOT-AKF-02": return "Barbary Macaque, North African Wild Boar, Booted Eagle, Golden Jackal";
        case "IOT-TKJ-03": return "Bearded Vulture, Egyptian Vulture, Barbary Macaque, Common Genet";
        case "IOT-GRY-04": return "Barbary Macaque (major protected colony), Peregrine Falcon, Audouin's Gull";
        case "IOT-MIZ-05": return "Red Fox, African Hare, nocturnal raptors, cattle and sheep farming";
        case "IOT-BAB-06": return "Kabylian Nuthatch (Sitta ledanti, globally endemic), historical Barbary Leopard";
        case "IOT-CHR-07": return "Barbary Macaque, Golden Eagle, Pine Marten, Atlas woodland fauna";
        case "IOT-KAL-08": return "Barbary Stag (last wild native population), European Otter, aquatic birds of prey";
        case "IOT-AUR-09": return "Barbary Sheep (Aoudad), Cuvier's Gazelle, Aures wild boar, steppe raptors";
        case "IOT-GUE-10": return "Barbary Macaque, Golden Jackal, Common Genet, rare mountain stream amphibians";
        case "IOT-CHE-11": return "Spur-thighed Tortoise, Common Chameleon, wild rodents, coastal seabirds";
        default: return fallback;
      }
    }
    return fallback;
  };

  const getLocalizedCanopyText = (id: string, fallback: string) => {
    if (language === "ar") {
      switch (id) {
        case "IOT-YAK-01": return "كثافة عالية جداً (88%) : بلوط الفلين المعمر، بلوط الزان وأشجار شجيرية كثيفة ذات حمولة قابلة للاشتعال";
        case "IOT-AKF-02": return "كثافة قصوى (92%) : غابة رطبة مختلطة ذات كتلة حيوية عالية وغطاء أرضي سميك";
        case "IOT-TKJ-03": return "كثافة متوسطة (65%) : غابات أرز الأطلس العالية المتفرقة فوق مروج كلسية قابلة للاشتعال";
        case "IOT-GRY-04": return "كثافة عالية (75%) : صنوبر حلبي راتنجي وأدغال متوسطية سريعة الاشتعال";
        case "IOT-MIZ-05": return "كثافة عالية (82%) : بلوط الفلين مع طبقة شجيرية متواصلة";
        case "IOT-BAB-06": return "كثافة استثنائية (94%) : غابة أثرية من الشوح النوميدي وبلوط الأفارص النادر";
        case "IOT-CHR-07": return "كثافة عالية (85%) : غابات أرز الأطلس الشاهقة وغابات صنوبر كثيفة ذات مؤشر خطر مرتفع";
        case "IOT-KAL-08": return "كثافة عالية جداً (90%) : غابات بلوط الفلين الساحلية مع أحراش خلنج شجري كثيفة";
        case "IOT-AUR-09": return "كثافة متوسطة (70%) : أرز الأطلس وصنوبر حلبي في مناخ شبه جاف ذي جفاف شديد";
        case "IOT-GUE-10": return "كثافة عالية جداً (91%) : بلوط فلين عذري وغابات ضفاف نهرية خصبة";
        case "IOT-CHE-11": return "كثافة عالية (78%) : صنوبر حلبي راتنجي، أدغال الضرو والقندول سريعة الاشتعال";
        default: return fallback;
      }
    }
    if (language === "en") {
      switch (id) {
        case "IOT-YAK-01": return "Very High Density (88%): Ancient cork oak, Algerian oak, and dense combustible undergrowth";
        case "IOT-AKF-02": return "Maximum Density (92%): Mixed humid forest with high biomass density and thick litter";
        case "IOT-TKJ-03": return "Moderate Density (65%): Sparse high-altitude Atlas cedar on combustible limestone turf";
        case "IOT-GRY-04": return "High Density (75%): Resinous Aleppo pine and highly combustible Mediterranean scrub";
        case "IOT-MIZ-05": return "High Density (82%): Cork oak with unbroken bushy underbrush";
        case "IOT-BAB-06": return "Exceptional Density (94%): Ancient relict forest of Numidian Fir and Afares oak";
        case "IOT-CHR-07": return "High Density (85%): Majestic Atlas cedar and dense pine forest with high danger rating";
        case "IOT-KAL-08": return "Very High Density (90%): Coastal cork oak forest with dense tree heather understory";
        case "IOT-AUR-09": return "Moderate Density (70%): Atlas cedar and Aleppo pine in extreme semi-arid drought";
        case "IOT-GUE-10": return "Very High Density (91%): Virgin cork oak and lush riparian riverbank forest";
        case "IOT-CHE-11": return "High Density (78%): Resinous Aleppo pine, lentisc mastic and highly flammable calicotome";
        default: return fallback;
      }
    }
    return fallback;
  };

  // Persistent Tactical Report State (saved in localStorage)
  const [persistedReport, setPersistedReport] = useState<TacticalReportData | null>(null);

  // Ingestion and dispatch status
  const [dispatchStatus, setDispatchStatus] = useState<{
    type: "idle" | "nominal" | "normal" | "urgent";
    message: string;
    timestamp?: string;
  }>({
    type: "idle",
    message: language === "ar"
      ? "في انتظار إرسال بيانات المستشعر للتحليل عبر الذكاء الاصطناعي."
      : language === "en"
      ? "Awaiting sensor telemetry transmission for AI risk evaluation."
      : "En attente de transmission d'une trame capteur pour analyse IA.",
  });

  // Tactical Alert Report Modal State
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Load persisted report on initial mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("in9ad_saved_tactical_report");
        if (saved) {
          const parsed: TacticalReportData = JSON.parse(saved);
          setPersistedReport(parsed);
        }
      }
    } catch {}
  }, []);

  // Switch active node and sync custom inputs
  const handleSelectNode = (node: SensorNode) => {
    setSelectedNodeId(node.id);
    setCustomTemp(node.temp);
    setCustomHumidity(node.humidity);
    setCustomWind(node.wind);
    setCustomWindDir(node.windDir);
    setCustomCO2(node.co2);
  };

  // Client-Side ML Fire Risk & Propagation Model
  const mlInference = useMemo(() => {
    // 1. Fine Fuel Moisture Code (FFMC) proxy
    const rawFfmc = 59.5 * (1 - customHumidity / 100) + 0.5 * Math.max(0, customTemp) + 0.2 * customWind;
    const ffmc = Math.min(99.0, Math.max(20.0, rawFfmc));

    // 2. Initial Spread Index (ISI) proxy
    const isi = Math.max(0.1, 0.208 * Math.pow(customWind, 0.9) * (ffmc / 50));

    // 3. Build Up Index (BUI) proxy
    const bui = Math.max(5.0, Math.max(0, customTemp) * 1.8 - customHumidity * 0.4);

    // 4. Fire Weather Index (FWI) proxy
    const fwi = Math.max(0.0, isi * 0.6 + bui * 0.4);

    // 5. CO2 Combustion Anomaly Multiplier (Ambient baseline ~ 415 ppm)
    const co2AnomalyRatio = Math.max(0, (customCO2 - 415) / 500);

    // 6. Calibrated XGBoost Probability Score with high sensitivity for extreme conditions
    const tempFactor = (customTemp - 15) / 35; // scales up to 1.0+ when temp > 50°C
    const humFactor = (100 - customHumidity) / 100; // 1 at 0%, 0 at 100%
    const windFactor = customWind / 70; // normalized to strong wind
    const combustionFactor = co2AnomalyRatio * 0.35;

    let rawScore = (tempFactor * 0.32 + humFactor * 0.30 + windFactor * 0.20 + combustionFactor) * 100;
    if (customTemp >= 50 || customCO2 >= 900) {
      rawScore = Math.max(rawScore, 85);
    }
    if (customTemp <= 10 && customHumidity >= 70 && customCO2 < 500) {
      rawScore = Math.min(rawScore, 15);
    }
    const riskScore = Math.min(99.8, Math.max(1.0, Math.round(rawScore * 10) / 10));

    // Risk Level and Badges
    let riskLevel = "Faible";
    let badgeColor = "bg-emerald-950 border-emerald-800 text-emerald-300";
    if (riskScore > 80 || customTemp >= 50 || customCO2 >= 850) {
      riskLevel = "Très Élevé (Critique)";
      badgeColor = "bg-rose-950 border-rose-800 text-rose-300";
    } else if (riskScore > 60 || customTemp >= 40) {
      riskLevel = "Élevé";
      badgeColor = "bg-orange-950 border-orange-800 text-orange-300";
    } else if (riskScore > 35) {
      riskLevel = "Modéré";
      badgeColor = "bg-amber-950 border-amber-800 text-amber-300";
    }

    // Rate of Spread (ROS - vitesse d'avancée du feu) in m/min & km/h
    const fuelCoeff = activeNode.canopyDensityPercent / 80;
    const ros_m_min = Math.max(
      0.3,
      Math.round(
        (customWind * 0.42 + Math.max(0, customTemp - 20) * 0.55) *
          Math.max(0.1, 1 - customHumidity / 110) *
          fuelCoeff *
          10
      ) / 10
    );
    const ros_km_h = Math.round((ros_m_min * 60) / 100) / 10;

    // Projected Burned Area in Hectares at +1h, +3h, +6h
    const area_1h = Math.max(1, Math.round(ros_m_min * 1.5));
    const area_3h = Math.max(5, Math.round(ros_m_min * 6.2));
    const area_6h = Math.max(15, Math.round(ros_m_min * 19.5));

    // Dynamic fire propagation zone based on wind direction
    let propagationZone = activeNode.spreadAxis;
    if (customWindDir.includes("Sud") || customWindDir.includes("Sirocco")) {
      propagationZone = language === "ar"
        ? `محور شمال-شمال-شرق تحت تأثير رياح السيروكو العنيفة : انتشار مباشر نحو ${activeNode.populationDetails.split(":")[1]?.trim() || activeNode.name}`
        : language === "en"
        ? `North-North-East axis under violent Sirocco effect: Direct propagation towards ${activeNode.populationDetails.split(":")[1]?.trim() || activeNode.name}`
        : `Axe Nord-Nord-Est sous effet Sirocco violent : Propagation directe vers ${activeNode.populationDetails.split(":")[1]?.trim() || activeNode.name}`;
    } else if (customWindDir.includes("Nord")) {
      propagationZone = language === "ar"
        ? `محور جنوب-جنوب-شرق نحو عمق الكتلة الغابية والوديان العلوية`
        : language === "en"
        ? `South-South-East axis towards massif interior and upstream valleys`
        : `Axe Sud-Sud-Est vers l'intérieur du massif et les vallées amont`;
    } else if (customWindDir.includes("Est")) {
      propagationZone = language === "ar"
        ? `محور غرب-شمال-غرب على طول القمم الحرجية`
        : language === "en"
        ? `West-North-West axis along wooded crests`
        : `Axe Ouest-Nord-Ouest le long des crêtes boisées`;
    } else if (customWindDir.includes("Ouest")) {
      propagationZone = language === "ar"
        ? `محور شرق نحو الحواف الغابية وممرات المنحدرات`
        : language === "en"
        ? `East axis towards forest edges and ravine corridors`
        : `Axe Est vers les lisières forestières et couloirs de ravins`;
    }

    return {
      riskScore,
      riskLevel,
      badgeColor,
      ffmc: Math.round(ffmc * 10) / 10,
      isi: Math.round(isi * 10) / 10,
      bui: Math.round(bui * 10) / 10,
      fwi: Math.round(fwi * 10) / 10,
      ros_m_min,
      ros_km_h,
      area_1h,
      area_3h,
      area_6h,
      propagationZone,
    };
  }, [customTemp, customHumidity, customWind, customWindDir, customCO2, activeNode, language]);

  // Current report data object
  const currentReportData: TacticalReportData = useMemo(() => {
    const justNowStr = language === "ar" ? "الآن" : language === "en" ? "Just now" : "À l'instant";
    return {
      massif: activeNode.name,
      wilaya: activeNode.wilaya,
      wilayaCode: activeNode.wilayaCode,
      lat: activeNode.lat,
      lon: activeNode.lon,
      elevation: activeNode.elevation,
      topography: activeNode.topography,
      temp: customTemp,
      humidity: customHumidity,
      wind: customWind,
      windDir: customWindDir,
      co2: customCO2,
      riskScore: mlInference.riskScore,
      riskLevel: mlInference.riskLevel,
      fwi: mlInference.fwi,
      ffmc: mlInference.ffmc,
      isi: mlInference.isi,
      bui: mlInference.bui,
      ros_m_min: mlInference.ros_m_min,
      ros_km_h: mlInference.ros_km_h,
      area_1h: mlInference.area_1h,
      area_3h: mlInference.area_3h,
      area_6h: mlInference.area_6h,
      propagationZone: mlInference.propagationZone,
      hasHumanPopulation: activeNode.hasHumanPopulation,
      populationCount: activeNode.populationCount,
      populationDetails: activeNode.populationDetails,
      faunaSpecies: activeNode.faunaSpecies,
      canopyDensityPercent: activeNode.canopyDensityPercent,
      canopyDensityText: activeNode.canopyDensityText,
      timestamp: lastIngestedAt !== justNowStr ? lastIngestedAt : new Date().toLocaleTimeString(language === "ar" ? "ar-DZ" : language === "en" ? "en-US" : "fr-FR"),
      alertId: `ALT-IOT-${activeNode.wilayaCode.replace(/[\s.]+/g, "")}-${Date.now().toString().slice(-5)}`,
    };
  }, [activeNode, customTemp, customHumidity, customWind, customWindDir, customCO2, mlInference, lastIngestedAt, language]);

  // Active report displayed in modal: either current or restored persisted report
  const modalReport = useMemo(() => {
    return persistedReport || currentReportData;
  }, [persistedReport, currentReportData]);

  const modalNode = useMemo(() => {
    return nodes.find((n) => n.name === modalReport.massif) || activeNode;
  }, [nodes, modalReport, activeNode]);

  // Transmit telemetry and execute AI evaluation + multi-panel alert dispatch
  const handleTriggerAnalysisAndDispatch = async () => {
    setIngestionCount((c) => c + 1);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setLastIngestedAt(timeStr);

    const isFireCharacteristics =
      mlInference.riskScore > 60 || customTemp >= 45 || customCO2 >= 750;
    const isModerateRisk =
      !isFireCharacteristics && (mlInference.riskScore >= 30 || customTemp >= 35);

    // Save report in localStorage so it persists even if user leaves or refreshes
    const reportToSave: TacticalReportData = {
      ...currentReportData,
      timestamp: timeStr,
    };
    try {
      localStorage.setItem("in9ad_saved_tactical_report", JSON.stringify(reportToSave));
      setPersistedReport(reportToSave);
    } catch {}

    // CASE 1: No risk detected / Nominal conditions
    if (!isFireCharacteristics && !isModerateRisk) {
      setDispatchStatus({
        type: "nominal",
        message: language === "ar"
          ? `اكتمل تحليل الذكاء الاصطناعي : ظروف اسمية (خطر منخفض ${mlInference.riskScore}%). لم يتم رصد أي بؤرة حريق أو شذوذ حراري. لم يتم إرسال أي إنذار لغرف القيادة.`
          : language === "en"
          ? `AI analysis completed: Nominal conditions (Low Risk ${mlInference.riskScore}%). No thermal anomaly detected. No alert dispatched to commands.`
          : `Analyse IA terminée : Conditions nominales (Risque Faible ${mlInference.riskScore}%). Aucun foyer ou anomalie thermique détectée. Aucune alerte transmise aux postes de commandement.`,
        timestamp: timeStr,
      });
      return;
    }

    // CASE 2: Low / Small fire or moderate risk -> Normal alert (not urgent)
    if (isModerateRisk) {
      const normalAlertPayload = {
        from_role: "iot_vigie_network",
        to_role: "all",
        alert_id: `ALT-${activeNode.wilayaCode.replace(/[\s.]+/g, "")}-${Date.now().toString().slice(-6)}`,
        title: language === "ar"
          ? `يقظة معتدلة : ${getLocalizedMassifName(activeNode.name, language)} (${activeNode.wilayaCode})`
          : language === "en"
          ? `Moderate Vigilance: ${getLocalizedMassifName(activeNode.name, language)} (${activeNode.wilayaCode})`
          : `Vigilance Modérée : ${activeNode.name} (${activeNode.wilayaCode})`,
        message: language === "ar"
          ? `ظروف جفاف تم رصدها بواسطة مستشعر IoT : حرارة ${customTemp.toFixed(1)}°م، رطوبة ${customHumidity}%، رياح ${customWind} كم/س (${formatLocalizedWindDir(customWindDir)}). الخطر التقديري ${mlInference.riskScore}%. استمرار المراقبة الروتينية.`
          : language === "en"
          ? `Drought conditions detected by IoT sensor: Temp ${customTemp.toFixed(1)}°C, Humidity ${customHumidity}%, Wind ${customWind} km/h (${formatLocalizedWindDir(customWindDir)}). Estimated AI risk ${mlInference.riskScore}%. Routine monitoring maintained.`
          : `Conditions de sécheresse détectées par capteur IoT : Temp ${customTemp.toFixed(
              1
            )}°C, Humidité ${customHumidity}%, Vent ${customWind} km/h (${customWindDir}). Risque IA estimé à ${
              mlInference.riskScore
            }%. Surveillance de routine maintenue.`,
        massif: activeNode.name,
        wilaya: activeNode.wilaya,
        lat: activeNode.lat,
        lon: activeNode.lon,
        risk_level: "MODERATE",
        risk_score: mlInference.riskScore,
      };

      await alertPanel(normalAlertPayload);

      setDispatchStatus({
        type: "normal",
        message: language === "ar"
          ? `تم إرسال إنذار يقظة قياسي إلى وحدات الحماية المدنية ومحافظة الغابات. مؤشر الخطر : ${mlInference.riskScore}%.`
          : language === "en"
          ? `Standard vigilance alert dispatched to Civil Protection and Forest Conservation panels. Risk index: ${mlInference.riskScore}%.`
          : `Alerte de vigilance standard transmise aux panels Protection Civile et Conservation des Forêts. Indice de risque : ${mlInference.riskScore}%.`,
        timestamp: timeStr,
      });
      return;
    }

    // CASE 3: Active Fire Characteristics -> URGENT ALERT + DOUBLE ALERT FOR CENTRAL ADMIN
    if (isFireCharacteristics) {
      const baseAlertId = `ALT-${activeNode.wilayaCode.replace(/[\s.]+/g, "")}-${Date.now().toString().slice(-6)}`;

      // 1. ALERT 1 (RAPPORT INCENDIE): Operational Wildfire Alert dispatched to all commands (including Central Admin)
      const fireReportMessage = language === "ar"
        ? `إنذار حريق نشط : تم رصد بؤرة في ${getLocalizedMassifName(activeNode.name, language)} (${activeNode.wilayaCode}). إحداثيات : ${activeNode.lat.toFixed(4)} N, ${activeNode.lon.toFixed(4)} E (ارتفاع ${activeNode.elevation}م). القياسات : حرارة ${customTemp.toFixed(1)}°م، رطوبة ${customHumidity}%، رياح ${customWind} كم/س (${formatLocalizedWindDir(customWindDir)})، CO2 ${customCO2} ppm. سرعة الانتشار التقديرية : ${mlInference.ros_m_min} م/دقيقة (${mlInference.ros_km_h} كم/س). المساحة المتوقعة : +1س: ${mlInference.area_1h} هكتار، +3س: ${mlInference.area_3h} هكتار. الغطاء النباتي : ${activeNode.canopyDensityText}. التقرير الرسمي متاح للتحميل.`
        : language === "en"
        ? `ACTIVE WILDFIRE ALERT: Fire outbreak detected at ${getLocalizedMassifName(activeNode.name, language)} (${activeNode.wilayaCode}). GPS: ${activeNode.lat.toFixed(4)} N, ${activeNode.lon.toFixed(4)} E (Elevation ${activeNode.elevation}m). Telemetry: Temp ${customTemp.toFixed(1)}°C, Humidity ${customHumidity}%, Wind ${customWind} km/h (${formatLocalizedWindDir(customWindDir)}), CO2 ${customCO2} ppm. Estimated spread rate: ${mlInference.ros_m_min} m/min (${mlInference.ros_km_h} km/h). Projected surfaces: +1h: ${mlInference.area_1h} ha, +3h: ${mlInference.area_3h} ha. Canopy cover: ${activeNode.canopyDensityText}. Official protocol available for download.`
        : `ALERTE INCENDIE ACTIVE : Foyer détecté à ${activeNode.name} (${activeNode.wilayaCode}). GPS : ${activeNode.lat.toFixed(
            4
          )} N, ${activeNode.lon.toFixed(4)} E (Alt ${activeNode.elevation}m). Télémétrie : Temp ${customTemp.toFixed(
            1
          )}°C, Humidité ${customHumidity}%, Vent ${customWind} km/h (${customWindDir}), CO2 ${customCO2} ppm. Vitesse de propagation estimée : ${
            mlInference.ros_m_min
          } m/min (${mlInference.ros_km_h} km/h). Surfaces projetées : +1h: ${mlInference.area_1h} ha, +3h: ${mlInference.area_3h} ha. Couvert végétal : ${
            activeNode.canopyDensityText
          }. Procès-verbal officiel disponible au téléchargement.`;

      // Broadcast to all panels
      await alertPanel({
        from_role: "iot_vigie_network",
        to_role: "all",
        alert_id: baseAlertId,
        title: language === "ar"
          ? `[تقرير حريق] رصد بؤرة نشطة : ${getLocalizedMassifName(activeNode.name, language)} (${activeNode.wilayaCode})`
          : language === "en"
          ? `[FIRE REPORT] Active Outbreak Detected: ${getLocalizedMassifName(activeNode.name, language)} (${activeNode.wilayaCode})`
          : `[RAPPORT INCENDIE] Détection Foyer Actif : ${activeNode.name} (${activeNode.wilayaCode})`,
        message: fireReportMessage,
        massif: activeNode.name,
        wilaya: activeNode.wilaya,
        lat: activeNode.lat,
        lon: activeNode.lon,
        risk_level: "CRITICAL",
        risk_score: mlInference.riskScore,
      });

      // 2. ALERT 2 (URGENCE ÉVACUATION): Dedicated Civilian Safety Alert for Central Administration
      if (activeNode.hasHumanPopulation && activeNode.populationCount > 0) {
        const civilianEvacMessage = language === "ar"
          ? `أمر الوزارة / الولاية : ${activeNode.populationCount.toLocaleString(language === "ar" ? "ar-DZ" : "en-US")} ساكن مهددون في منطقة الخطر (${activeNode.populationDetails}). محور الانتشار المتوقع : ${mlInference.propagationZone}. سرعة التقدم : ${mlInference.ros_m_min} م/دقيقة نحو المساكن. تفعيل فوري لمخطط تنظيم الإسعافات ORSEC للولاية ونقل تعليمات الإخلاء الوقائي.`
          : language === "en"
          ? `MINISTRY / WILAYA ORDER: ${activeNode.populationCount.toLocaleString()} residents threatened in impact zone (${activeNode.populationDetails}). Projected spread axis: ${mlInference.propagationZone}. Advance rate: ${mlInference.ros_m_min} m/min towards settlements. Immediate activation of Wilaya ORSEC Plan and evacuation instructions.`
          : `ORDRE MINISTÈRE / WILAYA : ${activeNode.populationCount.toLocaleString(
              "fr-FR"
            )} résidents menacés dans la zone d'impact (${activeNode.populationDetails}). Axe de propagation prévisionnel : ${
              mlInference.propagationZone
            }. Vitesse d'avancée : ${mlInference.ros_m_min} m/min vers les habitations. Déclenchement impératif du Plan ORSEC Wilaya et transmission immédiate des consignes d'évacuation préventive aux autorités locales et aux populations.`;

        await alertPanel({
          from_role: "iot_vigie_network",
          to_role: "admin_centrale",
          alert_id: `${baseAlertId}-EVAC`,
          title: language === "ar"
            ? `[إخلاء عاجل] سكان مهددون : ${activeNode.populationCount.toLocaleString(language === "ar" ? "ar-DZ" : "en-US")} ساكن (${getLocalizedMassifName(activeNode.name, language)})`
            : language === "en"
            ? `[URGENT EVACUATION] Threatened Civilian Population: ${activeNode.populationCount.toLocaleString()} Residents (${getLocalizedMassifName(activeNode.name, language)})`
            : `[URGENT ÉVACUATION] Population Civile Menacée : ${activeNode.populationCount.toLocaleString(
                "fr-FR"
              )} Habitants (${activeNode.name})`,
          message: civilianEvacMessage,
          massif: activeNode.name,
          wilaya: activeNode.wilaya,
          lat: activeNode.lat,
          lon: activeNode.lon,
          risk_level: "CRITICAL",
          risk_score: mlInference.riskScore,
        });
      }

      setDispatchStatus({
        type: "urgent",
        message: language === "ar"
          ? `تم إرسال إنذار عاجل إلى غرف العمليات. خطر حرج (${mlInference.riskScore}%). تم إرسال تنبيه إخلاء خاص للإدارة المركزية لحماية ${activeNode.populationCount.toLocaleString(language === "ar" ? "ar-DZ" : "en-US")} ساكن. تم إنشاء تقرير تكتيكي محفوظ.`
          : language === "en"
          ? `URGENT ALERT DISPATCHED TO COMMAND CENTERS. Critical risk (${mlInference.riskScore}%). Special evacuation dispatch sent to Central Administration for ${activeNode.populationCount.toLocaleString()} threatened residents. Persistent tactical report generated.`
          : `ALERTE URGENTE DISPATCHÉE AUX COMMANDEMENTS. Risque critique (${mlInference.riskScore}%). Double alerte spéciale d'évacuation transmise à l'Administration Centrale pour les ${activeNode.populationCount.toLocaleString(
              "fr-FR"
            )} habitants menacés. Rapport tactique persistant généré.`,
        timestamp: timeStr,
      });

      // Automatically open the tactical crisis report modal
      setShowReportModal(true);
    }
  };

  // Official PDF Download Handler using client-side jsPDF
  const handleDownloadReport = async () => {
    setIsDownloadingPdf(true);
    try {
      const { generateOfficialTacticalReportPDF } = await import("@/lib/pdfReportGenerator");
      await generateOfficialTacticalReportPDF(modalReport);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div data-tour="iot" className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto gap-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {t("iot_network_title")}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t("iot_network_sub")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t("iot_consult_report")}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0A4D3C] hover:bg-[#0c5d49] text-white transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingPdf ? t("iot_generating_pdf") : t("iot_download_pdf")}</span>
          </button>
        </div>
      </div>

      {/* Persistent Saved Report Banner */}
      {persistedReport && (
        <div className="rounded-lg border border-emerald-800/80 bg-emerald-950/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-200">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs">
              {language === "ar" ? "آخر تقرير تكتيكي مسجل:" : language === "en" ? "Latest tactical report recorded:" : "Dernier rapport tactique enregistré :"} <strong>{persistedReport.massif} ({persistedReport.wilayaCode})</strong> · {language === "ar" ? "الخطر" : language === "en" ? "Risk" : "Risque"} {persistedReport.riskScore}% · {language === "ar" ? "السرعة" : language === "en" ? "Speed" : "Vitesse"} {persistedReport.ros_m_min} m/min ({persistedReport.ros_km_h} km/h) · {persistedReport.timestamp || "recent"}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const matching = nodes.find((n) => n.name === persistedReport.massif);
                if (matching) setSelectedNodeId(matching.id);
                setShowReportModal(true);
              }}
              className="px-3 py-1.5 rounded bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-xs font-semibold transition-colors"
            >
              {language === "ar" ? "فتح التقرير" : language === "en" ? "Open report" : "Ouvrir le rapport"}
            </button>
            <button
              type="button"
              onClick={async () => {
                const { generateOfficialTacticalReportPDF } = await import("@/lib/pdfReportGenerator");
                await generateOfficialTacticalReportPDF(persistedReport);
              }}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>{t("iot_download_pdf")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Hardware Status Banner */}
      <div className="rounded-lg border border-amber-800/80 bg-amber-950/40 p-4 flex items-start gap-3 text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            {language === "ar"
              ? "نافذة غير نشطة : شبكة LoRaWAN الميدانية قيد التجهيز والنشر"
              : language === "en"
              ? "Inactive Window: LoRaWAN Field Network Deployment in Progress"
              : "Fenêtre inactive : Réseau terrain LoRaWAN en cours de déploiement"}
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            {language === "ar"
              ? "شبكة LoRaWAN ومستشعرات البيئة الدقيقة في انتظار التثبيت الميداني على الـ 11 كتلة غابية. يمكنك محاكاة البيانات أدناه لاختبار استجابة الذكاء الاصطناعي."
              : language === "en"
              ? "LoRaWAN sensor network awaiting physical deployment on the 11 massifs. You can inject custom sensor readings below (e.g. 60°C or higher) to test AI inference and emergency dispatch."
              : "Réseau LoRaWAN et capteurs environnementaux en attente d'installation physique sur les 11 massifs. Vous pouvez injecter des données personnalisées ci-dessous pour tester l'analyse IA et les alertes."}
          </p>
        </div>
      </div>

      {/* Interactive Simulation & ML Ingestion Engine */}
      <div className="rounded-lg border border-[#0A4D3C] bg-slate-900 p-4 sm:p-5 space-y-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              {language === "ar"
                ? "حاسبة مخاطر الذكاء الاصطناعي عبر بيانات المستشعرات"
                : language === "en"
                ? "AI Risk Calculator via Sensor Ingestion"
                : "Calculateur de Risque IA via Ingestion des Capteurs"}{" "}
              ({getLocalizedNodeName(activeNode.name)} - {activeNode.wilayaCode})
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>
              {language === "ar" ? "آخر إرسال :" : language === "en" ? "Last transmission:" : "Dernière transmission :"}{" "}
              <strong className="text-emerald-400">
                {lastIngestedAt === "Just now" || lastIngestedAt === "À l'instant" || lastIngestedAt === "الآن"
                  ? (language === "ar" ? "الآن" : language === "en" ? "Just now" : "À l'instant")
                  : lastIngestedAt}
              </strong>
            </span>
            <span>·</span>
            <span>
              {language === "ar" ? "الإطارات المعالجة :" : language === "en" ? "Ingested frames:" : "Trames ingérées :"}{" "}
              <strong className="text-slate-200">{ingestionCount}</strong>
            </span>
          </div>
        </div>

        {/* 4 Sensor Input Cards with Sliders and Direct Numeric Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Temperature: -10°C to 100°C */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Thermometer className="w-4 h-4 text-rose-400" />
                {language === "ar" ? "درجة الحرارة" : language === "en" ? "Temperature" : "Température"}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="-10"
                  max="100"
                  step="0.5"
                  value={customTemp}
                  onChange={(e) => setCustomTemp(parseFloat(e.target.value) || 0)}
                  className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-right font-mono font-bold text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-mono text-slate-400">°C</span>
              </div>
            </div>
            <input
              type="range"
              min="-10"
              max="100"
              step="0.5"
              value={customTemp}
              onChange={(e) => setCustomTemp(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-10°C</span>
              <span>{language === "ar" ? "موجة حر : >35°م" : language === "en" ? "Heatwave: >35°C" : "Canicule : >35°C"}</span>
              <span>100°C</span>
            </div>
          </div>

          {/* 2. Relative Humidity: 0% to 100% */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Droplets className="w-4 h-4 text-sky-400" />
                {language === "ar" ? "الرطوبة النسبية" : language === "en" ? "Relative Humidity" : "Humidité Relative"}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={customHumidity}
                  onChange={(e) => setCustomHumidity(parseInt(e.target.value) || 0)}
                  className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-right font-mono font-bold text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-mono text-slate-400">%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={customHumidity}
              onChange={(e) => setCustomHumidity(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{language === "ar" ? "0% (حرج)" : language === "en" ? "0% (Critical)" : "0% (Critique)"}</span>
              <span>{language === "ar" ? "جفاف : <20%" : language === "en" ? "Drought: <20%" : "Sécheresse : <20%"}</span>
              <span>100%</span>
            </div>
          </div>

          {/* 3. Wind Speed (0 - 120 km/h) & Direction */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Wind className="w-4 h-4 text-teal-400" />
                {language === "ar" ? "الرياح والاتجاه" : language === "en" ? "Wind & Direction" : "Vent & Direction"}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="120"
                  step="1"
                  value={customWind}
                  onChange={(e) => setCustomWind(parseInt(e.target.value) || 0)}
                  className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-right font-mono font-bold text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-mono text-slate-400">km/h</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="1"
              value={customWind}
              onChange={(e) => setCustomWind(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
            <div className="flex items-center justify-between gap-1 pt-0.5">
              <span className="text-[10px] text-slate-500 font-mono">
                {language === "ar" ? "الاتجاه :" : language === "en" ? "Orientation:" : "Orientation :"}
              </span>
              <select
                value={customWindDir}
                onChange={(e) => setCustomWindDir(e.target.value)}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {WIND_DIRECTIONS.map((dir) => (
                  <option key={dir} value={dir}>
                    {formatLocalizedWindDir(dir)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. CO2 & Smoke Particles: 350 to 2000 ppm */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <CloudFog className="w-4 h-4 text-amber-400" />
                {language === "ar" ? "ثاني أكسيد الكربون والدخان" : language === "en" ? "CO2 & Smoke" : "CO2 & Fumée"}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="350"
                  max="2000"
                  step="10"
                  value={customCO2}
                  onChange={(e) => setCustomCO2(parseInt(e.target.value) || 400)}
                  className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-right font-mono font-bold text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-mono text-slate-400">ppm</span>
              </div>
            </div>
            <input
              type="range"
              min="350"
              max="2000"
              step="10"
              value={customCO2}
              onChange={(e) => setCustomCO2(parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>350 ppm</span>
              <span>{language === "ar" ? "شذوذ : >750 ppm" : language === "en" ? "Anomaly: >750 ppm" : "Anomalie : >750 ppm"}</span>
              <span>2000 ppm</span>
            </div>
          </div>
        </div>

        {/* AI ML Prediction & Fire Dynamic Analysis Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-slate-950 p-4 rounded-lg border border-slate-800">
          {/* Left: Probabilities & Risk Level */}
          <div className="lg:col-span-4 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {language === "ar"
                ? "مؤشر خطر الذكاء الاصطناعي (XGBoost + FWI)"
                : language === "en"
                ? "AI Risk Index (XGBoost + FWI)"
                : "Indice de Risque IA (XGBoost + FWI)"}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                {mlInference.riskScore}%
              </span>
              <span className={`px-2.5 py-1 rounded text-xs font-bold border font-mono ${mlInference.badgeColor}`}>
                {getLocalizedRiskLevel(mlInference.riskLevel)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === "ar" ? "برج المراقبة" : language === "en" ? "Watchtower" : "Vigie"} : {getLocalizedNodeName(activeNode.name)} · {language === "ar" ? "الارتفاع" : language === "en" ? "Alt" : "Alt"} {activeNode.elevation}m · GPS {activeNode.lat.toFixed(3)}, {activeNode.lon.toFixed(3)}
            </p>
          </div>

          {/* Center: Dynamic Fire Propagation Indicators */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">
                {language === "ar" ? "سرعة الانتشار (ROS)" : language === "en" ? "Spread Rate (ROS)" : "Vitesse Spread (ROS)"}
              </div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">{mlInference.ros_m_min} m/min</div>
              <div className="text-[9px] text-slate-500">({mlInference.ros_km_h} km/h)</div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">
                {language === "ar" ? "المساحة عند +3س" : language === "en" ? "Area at +3h" : "Surface à +3h"}
              </div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">{mlInference.area_3h} ha</div>
              <div className="text-[9px] text-slate-500">(+1h: {mlInference.area_1h} ha)</div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">
                {language === "ar" ? "السكان المدنيون" : language === "en" ? "Civilian Lives" : "Vies Civiles"}
              </div>
              <div className={`text-sm font-bold mt-0.5 ${activeNode.hasHumanPopulation ? "text-rose-400" : "text-emerald-400"}`}>
                {activeNode.hasHumanPopulation
                  ? (language === "ar" ? `${activeNode.populationCount.toLocaleString("ar-DZ")}` : language === "en" ? `${activeNode.populationCount.toLocaleString()}` : `${activeNode.populationCount.toLocaleString("fr-FR")}`)
                  : (language === "ar" ? "غير مأهول" : language === "en" ? "Uninhabited" : "Inhabité")}
              </div>
              <div className="text-[9px] text-slate-500">
                {activeNode.hasHumanPopulation
                  ? (language === "ar" ? "منطقة مهددة" : language === "en" ? "Threatened zone" : "Zone menacée")
                  : (language === "ar" ? "محمية طبيعية" : language === "en" ? "Sanctuary" : "Sanctuaire")}
              </div>
            </div>
          </div>

          {/* Right: Ingestion & Analysis Action Button */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleTriggerAnalysisAndDispatch}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0A4D3C] hover:bg-[#0c5d49] text-emerald-100 text-xs font-semibold transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>
                {language === "ar"
                  ? "إرسال البيانات والتحليل عبر الذكاء الاصطناعي"
                  : language === "en"
                  ? "Transmit Telemetry & Run AI Analysis"
                  : "Transmettre la trame & Analyser via l'IA"}
              </span>
            </button>
            <div className="text-[10px] text-slate-500 font-mono text-center">
              {language === "ar"
                ? "تقييم الخطر والتنبيه التلقائي لمراكز القيادة"
                : language === "en"
                ? "Evaluates risk & automatically dispatches alerts to commands"
                : "Évalue le risque et alerte automatiquement les commandements"}
            </div>
          </div>
        </div>

        {/* Live Dispatch Feedback Banner */}
        {dispatchStatus.type !== "idle" && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
              dispatchStatus.type === "urgent"
                ? "bg-rose-950/70 border-rose-800 text-rose-200"
                : dispatchStatus.type === "normal"
                ? "bg-amber-950/60 border-amber-800 text-amber-200"
                : "bg-emerald-950/60 border-emerald-800 text-emerald-200"
            }`}
          >
            {dispatchStatus.type === "urgent" ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : dispatchStatus.type === "normal" ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-2">
                <span>
                  {dispatchStatus.type === "urgent"
                    ? (language === "ar" ? "تم تفعيل إنذار عاجل" : language === "en" ? "URGENT ALERT ACTIVATED" : "ALERTE URGENTE ACTIVÉE")
                    : dispatchStatus.type === "normal"
                    ? (language === "ar" ? "تم إرسال إنذار قياسي" : language === "en" ? "NORMAL ALERT TRANSMITTED" : "ALERTE NORMALE TRANSMISE")
                    : (language === "ar" ? "ظروف اسمية" : language === "en" ? "NOMINAL CONDITIONS" : "CONDITIONS NOMINALES")}
                </span>
                {dispatchStatus.timestamp && (
                  <span className="font-mono text-[10px] opacity-80">({dispatchStatus.timestamp})</span>
                )}
              </div>
              <p className="leading-relaxed opacity-95">{dispatchStatus.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Grid of the 11 Massifs + Central LoRaWAN Gateway */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>
              {language === "ar"
                ? "اختر كتلة غابية لتحميل برج المراقبة وبياناته"
                : language === "en"
                ? "Select a forest massif to load its watchtower and data"
                : "Sélectionnez un massif pour charger sa vigie et ses données"}
            </span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            {language === "ar"
              ? "11 برج مراقبة متصل"
              : language === "en"
              ? "11 connected forest watchtowers"
              : "11 vigies forestières connectées"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <div
                key={node.id}
                onClick={() => handleSelectNode(node)}
                className={`cursor-pointer rounded-lg border p-4 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-slate-900 ring-1 ring-emerald-500/40"
                    : "border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {node.wilayaCode}
                      </span>
                      <h3 className="text-xs font-bold text-white tracking-tight">
                        {getLocalizedNodeName(node.name)}
                      </h3>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {getLocalizedWilaya(node.wilaya)} · {language === "ar" ? "الارتفاع" : language === "en" ? "Alt" : "Alt"} {node.elevation}m
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 block">
                      {node.id}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 font-mono mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      {language === "ar" ? "جاهز" : language === "en" ? "Ready" : "Prêt"}
                    </span>
                  </div>
                </div>

                {/* 4 Sensor Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/70">
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>{language === "ar" ? "درجة الحرارة" : language === "en" ? "Temperature" : "Température"}</span>
                      <Thermometer className="w-3 h-3 text-rose-400" aria-hidden="true" />
                    </div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">{node.temp.toFixed(1)} °C</div>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800/70">
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>{language === "ar" ? "الرطوبة" : language === "en" ? "Humidity" : "Humidité"}</span>
                      <Droplets className="w-3 h-3 text-sky-400" aria-hidden="true" />
                    </div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">{node.humidity} %</div>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800/70">
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>{language === "ar" ? "الرياح" : language === "en" ? "Wind" : "Vent"}</span>
                      <Wind className="w-3 h-3 text-teal-400" aria-hidden="true" />
                    </div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">{node.wind} km/h</div>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800/70">
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>{language === "ar" ? "غاز CO2" : language === "en" ? "CO2 Gas" : "Gaz CO2"}</span>
                      <CloudFog className="w-3 h-3 text-amber-400" aria-hidden="true" />
                    </div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">{node.co2} ppm</div>
                  </div>
                </div>

                {/* Human Presence and Canopy Information */}
                <div className="space-y-1 text-[11px] font-sans border-t border-slate-800/60 pt-2 text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className={node.hasHumanPopulation ? "text-amber-300 font-medium truncate" : "text-slate-400"}>
                      {node.hasHumanPopulation
                        ? (language === "ar" ? `${node.populationCount.toLocaleString("ar-DZ")} ساكن` : language === "en" ? `${node.populationCount.toLocaleString()} residents` : `${node.populationCount.toLocaleString("fr-FR")} habitants`)
                        : (language === "ar" ? "منطقة محمية غير مأهولة" : language === "en" ? "Protected uninhabited reserve" : "Zone sanctuarisée inhabitée")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Trees className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-300 truncate">
                      {node.canopyDensityPercent}% {language === "ar" ? "غطاء نباتي" : language === "en" ? "vegetation canopy" : "couvert végétal"}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                  <span className="truncate max-w-[170px]">{getLocalizedNodeType(node.type)}</span>
                  <span className="text-emerald-400 font-semibold">
                    {isSelected
                      ? (language === "ar" ? "نشط في النموذج" : language === "en" ? "Active in ML" : "Actif dans ML")
                      : (language === "ar" ? "اختيار" : language === "en" ? "Select" : "Sélectionner")}
                  </span>
                </div>
              </div>
            );
          })}

          {/* 12th Card: LoRaWAN Central Gateway Node */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                    HUB
                  </span>
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    {language === "ar" ? "بوابة LoRaWAN المركزية" : language === "en" ? "Central LoRaWAN Gateway" : "Passerelle LoRaWAN Centrale"}
                  </h3>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  {language === "ar" ? "محطة مركز التنسيق والعمليات 15 تيزي وزو" : language === "en" ? "CODIS Station 15 Tizi Ouzou" : "Station CODIS 15 Tizi Ouzou"}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500 block">
                  GW-LORA-01
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 font-mono mt-0.5">
                  <WifiOff className="w-3 h-3 text-slate-500" aria-hidden="true" />
                  {language === "ar" ? "غير متصل" : language === "en" ? "Disconnected" : "Déconnecté"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-500">{language === "ar" ? "البروتوكول" : language === "en" ? "Protocol" : "Protocole"}</span>
                <span className="text-slate-200">LoRaWAN v1.0.3 Class A/C</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-500">{language === "ar" ? "قنوات التردد" : language === "en" ? "Frequency Channels" : "Canaux Fréquence"}</span>
                <span className="text-slate-200">8 {language === "ar" ? "قنوات" : language === "en" ? "channels" : "canaux"} (868.1 - 868.5 MHz)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-500">{language === "ar" ? "نطاق التغطية" : language === "en" ? "Coverage Radius" : "Rayon Couverture"}</span>
                <span className="text-slate-200">15 km ({language === "ar" ? "رؤية مباشرة" : language === "en" ? "Line of Sight" : "Visibilité Directe"})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-500">{language === "ar" ? "الحزم المستلمة" : language === "en" ? "Packets Received" : "Paquets Reçus"}</span>
                <span className="text-slate-200">{ingestionCount} {language === "ar" ? "إطار" : language === "en" ? "frames" : "trames"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === "ar" ? "حالة العقد" : language === "en" ? "Nodes Status" : "Statut Nœuds"}</span>
                <span className="text-amber-400">11 {language === "ar" ? "عقدة مجهزة" : language === "en" ? "nodes modeled" : "nœuds modélisés"}</span>
              </div>
            </div>

            <div className="pt-1 text-[10px] text-slate-500 font-mono text-center border-t border-slate-800/60">
              {language === "ar" ? "تم تكوين خادم ChirpStack / The Things Stack" : language === "en" ? "ChirpStack / The Things Stack Server configured" : "Serveur ChirpStack / The Things Stack configuré"}
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Report Modal (Procès-Verbal de Crise & Téléchargement PDF) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl p-5 sm:p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block">
                  {language === "ar"
                    ? "الجمهورية الجزائرية الديمقراطية الشعبية"
                    : language === "en"
                    ? "People's Democratic Republic of Algeria"
                    : "République Algérienne Démocratique et Populaire"}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                  {language === "ar"
                    ? "محضر إنذار وتقرير تكتيكي لحرائق الغابات"
                    : language === "en"
                    ? "Official Alert Minutes & Tactical Wildfire Report"
                    : "Procès-Verbal d'Alerte & Rapport Tactique d'Incendie"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {language === "ar"
                    ? "المنظومة الوطنية إنقاذ : معالجة المستشعرات"
                    : language === "en"
                    ? "IN9AD National System: Sensor Ingestion"
                    : "Système National IN9AD : Ingestion Capteur"}{" "}
                  ({getLocalizedNodeName(modalReport.massif)} - {modalReport.wilayaCode}) · {language === "ar" ? "صدر في :" : language === "en" ? "Issued:" : "Émis :"} {modalReport.timestamp}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Sections */}
            <div className="space-y-4 text-xs">
              {/* Section 1: Identification & GPS */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {language === "ar"
                      ? "1. الموقع الجغرافي والتضاريس"
                      : language === "en"
                      ? "1. Geographic Location & Topography"
                      : "1. Localisation Géographique & Topographie"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {language === "ar" ? "الكتلة الغابية" : language === "en" ? "Massif" : "Massif"}
                    </span>
                    <strong>{getLocalizedNodeName(modalReport.massif)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {language === "ar" ? "الولاية" : language === "en" ? "Wilaya" : "Wilaya"}
                    </span>
                    <strong>{getLocalizedWilaya(modalReport.wilaya)} ({modalReport.wilayaCode})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {language === "ar" ? "إحداثيات GPS" : language === "en" ? "GPS Coordinates" : "Coordonnées GPS"}
                    </span>
                    <strong>{modalReport.lat.toFixed(4)}° N, {modalReport.lon.toFixed(4)}° E</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {language === "ar" ? "الارتفاع" : language === "en" ? "Elevation" : "Altitude"}
                    </span>
                    <strong>{modalReport.elevation} m</strong>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-1.5 font-sans">
                  <strong>{language === "ar" ? "طبيعة التضاريس :" : language === "en" ? "Terrain Relief:" : "Relief :"}</strong> {getLocalizedTopography(modalNode.id, modalReport.topography)}
                </div>
              </div>

              {/* Section 2: Sensor Telemetry & ML Prediction */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {language === "ar"
                      ? "2. المؤشرات المناخية الدقيقة وتقييم النموذج"
                      : language === "en"
                      ? "2. Micro-Climate Parameters & XGBoost Score"
                      : "2. Paramètres Micro-Climatiques & Score XGBoost"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-slate-300 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {language === "ar" ? "درجة الحرارة" : language === "en" ? "Temperature" : "Température"}
                    </span>
                    <strong className="text-rose-400">{modalReport.temp.toFixed(1)} °C</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {language === "ar" ? "الرطوبة" : language === "en" ? "Humidity" : "Humidité"}
                    </span>
                    <strong className="text-sky-400">{modalReport.humidity} %</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {language === "ar" ? "الرياح" : language === "en" ? "Wind" : "Vent"}
                    </span>
                    <strong className="text-teal-400">{modalReport.wind} km/h ({formatLocalizedWindDir(modalReport.windDir)})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {language === "ar" ? "CO2 / الدخان" : language === "en" ? "CO2 / Smoke" : "CO2 / Fumée"}
                    </span>
                    <strong className="text-amber-400">{modalReport.co2} ppm</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {language === "ar" ? "مؤشر الذكاء الاصطناعي" : language === "en" ? "AI Index" : "Indice IA"}
                    </span>
                    <strong className="text-white">{modalReport.riskScore} % ({getLocalizedRiskLevel(modalReport.riskLevel)})</strong>
                  </div>
                </div>
              </div>

              {/* Section 3: Fire Behavior, Rate of Spread & Projected Threat Zone */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {language === "ar"
                      ? "3. ديناميكية وسرعة انتشار الحريق"
                      : language === "en"
                      ? "3. Fire Behavior & Spread Dynamics"
                      : "3. Dynamique de Propagation & Vitesse d'Expansion"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-slate-300">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">
                      {language === "ar" ? "سرعة جبهة الحريق (ROS)" : language === "en" ? "Rate of Spread (ROS)" : "Vitesse du Front (ROS)"}
                    </span>
                    <strong className="text-slate-100 text-sm">{modalReport.ros_m_min} m/min</strong>
                    <span className="text-slate-400 text-[10px] block">({modalReport.ros_km_h} km/h)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">
                      {language === "ar" ? "المساحات المتوقعة" : language === "en" ? "Projected Surfaces" : "Surfaces Projetées"}
                    </span>
                    <strong className="text-slate-100 text-xs block">+1h: {modalReport.area_1h} ha | +3h: {modalReport.area_3h} ha</strong>
                    <span className="text-slate-400 text-[10px] block">+6h: {modalReport.area_6h} ha</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">
                      {language === "ar" ? "مؤشر FWI الكندي" : language === "en" ? "Canadian FWI Index" : "Indice FWI Canadien"}
                    </span>
                    <strong className="text-slate-100 text-sm">{modalReport.fwi}</strong>
                    <span className="text-slate-400 text-[10px] block">FFMC : {modalReport.ffmc} | ISI : {modalReport.isi}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300 border-t border-slate-800/60 pt-2 font-sans">
                  <strong>{language === "ar" ? "محور الانتشار التقديري :" : language === "en" ? "Projected propagation axis:" : "Axe de propagation prévisionnel :"}</strong> {modalReport.propagationZone}
                </div>
              </div>

              {/* Section 4: Human Lives & Threatened Villages */}
              <div className={`p-3.5 rounded-lg border space-y-2 ${modalReport.hasHumanPopulation ? "bg-rose-950/30 border-rose-800/80" : "bg-slate-950 border-slate-800"}`}>
                <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      {language === "ar"
                        ? "4. الخطر على السكان والمناطق السكنية"
                        : language === "en"
                        ? "4. Human Lives & Civilian Populations Threat"
                        : "4. Menace Humaine & Populations Civiles"}
                    </span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${modalReport.hasHumanPopulation ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-emerald-950 text-emerald-300 border border-emerald-800"}`}>
                    {modalReport.hasHumanPopulation
                      ? (language === "ar" ? "سكان مهددون" : language === "en" ? "POPULATION THREATENED" : "POPULATION MENACÉE")
                      : (language === "ar" ? "منطقة غير مأهولة" : language === "en" ? "UNINHABITED ZONE" : "ZONE INHABITÉE")}
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {getLocalizedPopulationDetails(modalNode.id, modalReport.populationDetails)}
                </p>
                {modalReport.hasHumanPopulation && (
                  <div className="p-2 rounded bg-rose-950/60 border border-rose-900 text-rose-200 text-[11px] space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>
                        {language === "ar"
                          ? "توصيات عملياتية للإدارة المركزية :"
                          : language === "en"
                          ? "Central Administration Operational Directive:"
                          : "Recommandation Opérationnelle Administration Centrale :"}
                      </span>
                    </div>
                    <p>
                      {language === "ar"
                        ? `تفعيل فوري لمخطط تنظيم الإسعافات ORSEC لولاية ${getLocalizedWilaya(modalReport.wilaya)}. إقامة طوق أمني وإخلاء وقائي لـ ${modalReport.populationCount.toLocaleString("ar-DZ")} ساكن على طول مسارات الإخلاء نحو مراكز الإيواء.`
                        : language === "en"
                        ? `Immediate activation of the ORSEC Emergency Plan for Wilaya of ${getLocalizedWilaya(modalReport.wilaya)}. Security perimeter establishment and preventive evacuation of ${modalReport.populationCount.toLocaleString()} residents along designated corridors towards relief shelters.`
                        : `Déclenchement immédiat du Plan ORSEC Wilaya de ${modalReport.wilaya}. Établissement d'un périmètre de sécurité et évacuation préventive des ${modalReport.populationCount.toLocaleString("fr-FR")} habitants le long des axes de repli vers les centres de regroupement.`}
                    </p>
                  </div>
                )}
              </div>

              {/* Section 5: Wildlife & Canopy Density */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Trees className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {language === "ar"
                        ? "5. الغطاء النباتي والمواد القابلة للاشتعال"
                        : language === "en"
                        ? "5. Vegetation & Fuel Load"
                        : "5. Végétation & Combustible"}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {getLocalizedCanopyText(modalNode.id, modalReport.canopyDensityText)}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-teal-400" />
                    <span>
                      {language === "ar"
                        ? "6. الحياة البرية والتنوع البيولوجي المحمي"
                        : language === "en"
                        ? "6. Protected Wildlife & Biodiversity"
                        : "6. Faune & Biodiversité Protégée"}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {getLocalizedFaunaSpecies(modalNode.id, modalReport.faunaSpecies)}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <div className="text-[11px] text-slate-400 font-mono">
                {language === "ar"
                  ? "تم الإرسال إلى : الحماية المدنية، محافظة الغابات، الإدارة المركزية"
                  : language === "en"
                  ? "Dispatched to: Civil Protection, Forest Conservation, Central Administration"
                  : "Transmis à : Protection Civile, Conservation des Forêts, Administration Centrale"}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  disabled={isDownloadingPdf}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A4D3C] hover:bg-[#0c5d49] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {isDownloadingPdf
                      ? (language === "ar" ? "جار إنشاء PDF..." : language === "en" ? "Generating PDF..." : "Génération PDF...")
                      : (language === "ar" ? "تحميل محضر الإنذار (PDF)" : language === "en" ? "Download Alert Protocol (PDF)" : "Télécharger le PV d'Alerte (PDF)")}
                  </span>
                </button>
                <Link
                  href="/dashboard/alerts"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{language === "ar" ? "غرفة العمليات والإنذارات" : language === "en" ? "Alerts Operations Room" : "Salle des Alertes"}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  {language === "ar" ? "إغلاق" : language === "en" ? "Close" : "Fermer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
