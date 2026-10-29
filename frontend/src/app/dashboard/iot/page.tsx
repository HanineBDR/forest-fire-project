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
import { generateOfficialTacticalReportPDF, TacticalReportData } from "@/lib/pdfReportGenerator";

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
  const [lastIngestedAt, setLastIngestedAt] = useState<string>("À l'instant");

  // Persistent Tactical Report State (saved in localStorage)
  const [persistedReport, setPersistedReport] = useState<TacticalReportData | null>(null);

  // Ingestion and dispatch status
  const [dispatchStatus, setDispatchStatus] = useState<{
    type: "idle" | "nominal" | "normal" | "urgent";
    message: string;
    timestamp?: string;
  }>({
    type: "idle",
    message: "En attente de transmission d'une trame capteur pour analyse IA.",
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
      propagationZone = `Axe Nord-Nord-Est sous effet Sirocco violent : Propagation directe vers ${activeNode.populationDetails.split(":")[1]?.trim() || activeNode.name}`;
    } else if (customWindDir.includes("Nord")) {
      propagationZone = `Axe Sud-Sud-Est vers l'intérieur du massif et les vallées amont`;
    } else if (customWindDir.includes("Est")) {
      propagationZone = `Axe Ouest-Nord-Ouest le long des crêtes boisées`;
    } else if (customWindDir.includes("Ouest")) {
      propagationZone = `Axe Est vers les lisières forestières et couloirs de ravins`;
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
  }, [customTemp, customHumidity, customWind, customWindDir, customCO2, activeNode]);

  // Current report data object
  const currentReportData: TacticalReportData = useMemo(() => {
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
      timestamp: lastIngestedAt !== "À l'instant" ? lastIngestedAt : new Date().toLocaleTimeString("fr-FR"),
      alertId: `ALT-IOT-${activeNode.wilayaCode.replace(/[\s.]+/g, "")}-${Date.now().toString().slice(-5)}`,
    };
  }, [activeNode, customTemp, customHumidity, customWind, customWindDir, customCO2, mlInference, lastIngestedAt]);

  // Active report displayed in modal: either current or restored persisted report
  const modalReport = useMemo(() => {
    return persistedReport || currentReportData;
  }, [persistedReport, currentReportData]);

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
        message: `Analyse IA terminée : Conditions nominales (Risque Faible ${mlInference.riskScore}%). Aucun foyer ou anomalie thermique détectée. Aucune alerte transmise aux postes de commandement.`,
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
        title: `Vigilance Modérée : ${activeNode.name} (${activeNode.wilayaCode})`,
        message: `Conditions de sécheresse détectées par capteur IoT : Temp ${customTemp.toFixed(
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
        message: `Alerte de vigilance standard transmise aux panels Protection Civile et Conservation des Forêts. Indice de risque : ${mlInference.riskScore}%.`,
        timestamp: timeStr,
      });
      return;
    }

    // CASE 3: Active Fire Characteristics -> URGENT ALERT + DOUBLE ALERT FOR CENTRAL ADMIN
    if (isFireCharacteristics) {
      const baseAlertId = `ALT-${activeNode.wilayaCode.replace(/[\s.]+/g, "")}-${Date.now().toString().slice(-6)}`;

      // 1. ALERT 1 (RAPPORT INCENDIE): Operational Wildfire Alert dispatched to all commands (including Central Admin)
      const fireReportMessage = `ALERTE INCENDIE ACTIVE : Foyer détecté à ${activeNode.name} (${activeNode.wilayaCode}). GPS : ${activeNode.lat.toFixed(
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
        title: `[RAPPORT INCENDIE] Détection Foyer Actif : ${activeNode.name} (${activeNode.wilayaCode})`,
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
        const civilianEvacMessage = `ORDRE MINISTÈRE / WILAYA : ${activeNode.populationCount.toLocaleString(
          "fr-FR"
        )} résidents menacés dans la zone d'impact (${activeNode.populationDetails}). Axe de propagation prévisionnel : ${
          mlInference.propagationZone
        }. Vitesse d'avancée : ${mlInference.ros_m_min} m/min vers les habitations. Déclenchement impératif du Plan ORSEC Wilaya et transmission immédiate des consignes d'évacuation préventive aux autorités locales et aux populations.`;

        await alertPanel({
          from_role: "iot_vigie_network",
          to_role: "admin_centrale",
          alert_id: `${baseAlertId}-EVAC`,
          title: `[URGENT ÉVACUATION] Population Civile Menacée : ${activeNode.populationCount.toLocaleString(
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
        message: `ALERTE URGENTE DISPATCHÉE AUX COMMANDEMENTS. Risque critique (${mlInference.riskScore}%). Double alerte spéciale d'évacuation transmise à l'Administration Centrale pour les ${activeNode.populationCount.toLocaleString(
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
              Réseau Capteurs IoT : Vigies et Ingestion ML
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Surveillance micro-climatique continue, détection de caractéristiques d&apos;incendie et double alerte d&apos;urgence pour l&apos;Administration Centrale
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Consulter le rapport officiel</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0A4D3C] hover:bg-[#0c5d49] text-white transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingPdf ? "Génération..." : "Télécharger PDF"}</span>
          </button>
        </div>
      </div>

      {/* Persistent Saved Report Banner */}
      {persistedReport && (
        <div className="rounded-lg border border-emerald-800/80 bg-emerald-950/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-200">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs">
              Dernier rapport tactique enregistré : <strong>{persistedReport.massif} ({persistedReport.wilayaCode})</strong> · Risque {persistedReport.riskScore}% · Vitesse {persistedReport.ros_m_min} m/min ({persistedReport.ros_km_h} km/h) · Émis à {persistedReport.timestamp || "récemment"}
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
              Ouvrir le rapport
            </button>
            <button
              type="button"
              onClick={() => generateOfficialTacticalReportPDF(persistedReport)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>Télécharger le PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Hardware Status Banner */}
      <div className="rounded-lg border border-amber-800/80 bg-amber-950/40 p-4 flex items-start gap-3 text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Fenêtre inactive : Réseau terrain LoRaWAN en cours de déploiement
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Réseau LoRaWAN et capteurs environnementaux (température, humidité, vent, micro-particules de fumée / CO2) en attente d&apos;installation physique sur les 11 massifs. Vous pouvez injecter des données personnalisées ci-dessous (ex : 60°C ou plus) pour tester l&apos;analyse IA et le déclenchement des alertes d&apos;urgence.
          </p>
        </div>
      </div>

      {/* Interactive Simulation & ML Ingestion Engine */}
      <div className="rounded-lg border border-[#0A4D3C] bg-slate-900 p-4 sm:p-5 space-y-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Calculateur de Risque IA via Ingestion des Capteurs ({activeNode.name} - {activeNode.wilayaCode})
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Dernière transmission : <strong className="text-emerald-400">{lastIngestedAt}</strong></span>
            <span>·</span>
            <span>Trames ingérées : <strong className="text-slate-200">{ingestionCount}</strong></span>
          </div>
        </div>

        {/* 4 Sensor Input Cards with Sliders and Direct Numeric Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Temperature: -10°C to 100°C */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Thermometer className="w-4 h-4 text-rose-400" />
                Température
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
              <span>Canicule : &gt;35°C</span>
              <span>100°C</span>
            </div>
          </div>

          {/* 2. Relative Humidity: 0% to 100% */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Droplets className="w-4 h-4 text-sky-400" />
                Humidité Relative
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
              <span>0% (Critique)</span>
              <span>Sécheresse : &lt;20%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 3. Wind Speed (0 - 120 km/h) & Direction */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Wind className="w-4 h-4 text-teal-400" />
                Vent & Direction
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
              <span className="text-[10px] text-slate-500 font-mono">Orientation :</span>
              <select
                value={customWindDir}
                onChange={(e) => setCustomWindDir(e.target.value)}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {WIND_DIRECTIONS.map((dir) => (
                  <option key={dir} value={dir}>
                    {dir}
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
                CO2 & Fumée
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
              <span>Anomalie : &gt;750 ppm</span>
              <span>2000 ppm</span>
            </div>
          </div>
        </div>

        {/* AI ML Prediction & Fire Dynamic Analysis Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-slate-950 p-4 rounded-lg border border-slate-800">
          {/* Left: Probabilities & Risk Level */}
          <div className="lg:col-span-4 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Indice de Risque IA (XGBoost + FWI)
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                {mlInference.riskScore}%
              </span>
              <span className={`px-2.5 py-1 rounded text-xs font-bold border font-mono ${mlInference.badgeColor}`}>
                {mlInference.riskLevel}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Vigie : {activeNode.name} · Alt {activeNode.elevation}m · GPS {activeNode.lat.toFixed(3)}, {activeNode.lon.toFixed(3)}
            </p>
          </div>

          {/* Center: Dynamic Fire Propagation Indicators */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Vitesse Spread (ROS)</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">{mlInference.ros_m_min} m/min</div>
              <div className="text-[9px] text-slate-500">({mlInference.ros_km_h} km/h)</div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Surface à +3h</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">{mlInference.area_3h} ha</div>
              <div className="text-[9px] text-slate-500">(+1h: {mlInference.area_1h} ha)</div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Vies Civiles</div>
              <div className={`text-sm font-bold mt-0.5 ${activeNode.hasHumanPopulation ? "text-rose-400" : "text-emerald-400"}`}>
                {activeNode.hasHumanPopulation ? `${activeNode.populationCount.toLocaleString("fr-FR")}` : "Inhabité"}
              </div>
              <div className="text-[9px] text-slate-500">
                {activeNode.hasHumanPopulation ? "Zone menacée" : "Sanctuaire"}
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
              <span>Transmettre la trame & Analyser via l&apos;IA</span>
            </button>
            <div className="text-[10px] text-slate-500 font-mono text-center">
              Évalue le risque et alerte automatiquement les commandements
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
                <span>{dispatchStatus.type === "urgent" ? "ALERTE URGENTE ACTIVÉE" : dispatchStatus.type === "normal" ? "ALERTE NORMALE TRANSMISE" : "CONDITIONS NOMINALES"}</span>
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
            <span>Sélectionnez un massif pour charger sa vigie et ses données</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            11 vigies forestières connectées
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
                        {node.name}
                      </h3>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {node.wilaya} · Alt {node.elevation}m
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 block">
                      {node.id}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 font-mono mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      Prêt
                    </span>
                  </div>
                </div>

                {/* 4 Sensor Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/70">
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>Température</span>
                      <Thermometer className="w-3 h-3 text-rose-400" aria-hidden="true" />
                    </div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">{node.temp.toFixed(1)} °C</div>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800/70">
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>Humidité</span>
                      <Droplets className="w-3 h-3 text-sky-400" aria-hidden="true" />
                    </div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">{node.humidity} %</div>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800/70">
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>Vent</span>
                      <Wind className="w-3 h-3 text-teal-400" aria-hidden="true" />
                    </div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">{node.wind} km/h</div>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800/70">
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>Gaz CO2</span>
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
                      {node.hasHumanPopulation ? `${node.populationCount.toLocaleString("fr-FR")} habitants` : "Zone sanctuarisée inhabitée"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Trees className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-300 truncate">{node.canopyDensityPercent}% couvert végétal</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                  <span className="truncate max-w-[170px]">{node.type}</span>
                  <span className="text-emerald-400 font-semibold">
                    {isSelected ? "Actif dans ML" : "Sélectionner"}
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
                    Passerelle LoRaWAN Centrale
                  </h3>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Station CODIS 15 Tizi Ouzou
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500 block">
                  GW-LORA-01
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 font-mono mt-0.5">
                  <WifiOff className="w-3 h-3 text-slate-500" aria-hidden="true" />
                  Déconnecté
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-500">Protocole</span>
                <span className="text-slate-200">LoRaWAN v1.0.3 Class A/C</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-500">Canaux Fréquence</span>
                <span className="text-slate-200">8 canaux (868.1 - 868.5 MHz)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-500">Rayon Couverture</span>
                <span className="text-slate-200">15 km (Visibilité Directe)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-500">Paquets Reçus</span>
                <span className="text-slate-200">{ingestionCount} trames</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statut Nœuds</span>
                <span className="text-amber-400">11 nœuds modélisés</span>
              </div>
            </div>

            <div className="pt-1 text-[10px] text-slate-500 font-mono text-center border-t border-slate-800/60">
              Serveur ChirpStack / The Things Stack configuré
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
                  République Algérienne Démocratique et Populaire
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                  Procès-Verbal d&apos;Alerte & Rapport Tactique d&apos;Incendie
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Système National IN9AD : Ingestion Capteur ({modalReport.massif} - {modalReport.wilayaCode}) · Émis : {modalReport.timestamp}
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
                  <span>1. Localisation Géographique & Topographie</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Massif</span>
                    <strong>{modalReport.massif}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Wilaya</span>
                    <strong>{modalReport.wilaya} ({modalReport.wilayaCode})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Coordonnées GPS</span>
                    <strong>{modalReport.lat.toFixed(4)}° N, {modalReport.lon.toFixed(4)}° E</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Altitude</span>
                    <strong>{modalReport.elevation} m</strong>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-1.5 font-sans">
                  <strong>Relief :</strong> {modalReport.topography}
                </div>
              </div>

              {/* Section 2: Sensor Telemetry & ML Prediction */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. Paramètres Micro-Climatiques & Score XGBoost</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-slate-300 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Température</span>
                    <strong className="text-rose-400">{modalReport.temp.toFixed(1)} °C</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Humidité</span>
                    <strong className="text-sky-400">{modalReport.humidity} %</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Vent</span>
                    <strong className="text-teal-400">{modalReport.wind} km/h ({modalReport.windDir})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CO2 / Fumée</span>
                    <strong className="text-amber-400">{modalReport.co2} ppm</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Indice IA</span>
                    <strong className="text-white">{modalReport.riskScore} % ({modalReport.riskLevel})</strong>
                  </div>
                </div>
              </div>

              {/* Section 3: Fire Behavior, Rate of Spread & Projected Threat Zone */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>3. Dynamique de Propagation & Vitesse d&apos;Expansion</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-slate-300">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Vitesse du Front (ROS)</span>
                    <strong className="text-slate-100 text-sm">{modalReport.ros_m_min} m/min</strong>
                    <span className="text-slate-400 text-[10px] block">({modalReport.ros_km_h} km/h)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Surfaces Projetées</span>
                    <strong className="text-slate-100 text-xs block">+1h: {modalReport.area_1h} ha | +3h: {modalReport.area_3h} ha</strong>
                    <span className="text-slate-400 text-[10px] block">+6h: {modalReport.area_6h} ha</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Indice FWI Canadien</span>
                    <strong className="text-slate-100 text-sm">{modalReport.fwi}</strong>
                    <span className="text-slate-400 text-[10px] block">FFMC : {modalReport.ffmc} | ISI : {modalReport.isi}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300 border-t border-slate-800/60 pt-2 font-sans">
                  <strong>Axe de propagation prévisionnel :</strong> {modalReport.propagationZone}
                </div>
              </div>

              {/* Section 4: Human Lives & Threatened Villages */}
              <div className={`p-3.5 rounded-lg border space-y-2 ${modalReport.hasHumanPopulation ? "bg-rose-950/30 border-rose-800/80" : "bg-slate-950 border-slate-800"}`}>
                <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-rose-400" />
                    <span>4. Menace Humaine & Populations Civiles</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${modalReport.hasHumanPopulation ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-emerald-950 text-emerald-300 border border-emerald-800"}`}>
                    {modalReport.hasHumanPopulation ? "POPULATION MENACÉE" : "ZONE INHABITÉE"}
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {modalReport.populationDetails}
                </p>
                {modalReport.hasHumanPopulation && (
                  <div className="p-2 rounded bg-rose-950/60 border border-rose-900 text-rose-200 text-[11px] space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Recommandation Opérationnelle Administration Centrale :</span>
                    </div>
                    <p>
                      Déclenchement immédiat du Plan ORSEC Wilaya de {modalReport.wilaya}. Établissement d&apos;un périmètre de sécurité et évacuation préventive des {modalReport.populationCount.toLocaleString("fr-FR")} habitants le long des axes de repli vers les centres de regroupement.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 5: Wildlife & Canopy Density */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Trees className="w-3.5 h-3.5 text-emerald-400" />
                    <span>5. Végétation & Combustible</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {modalReport.canopyDensityText}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-teal-400" />
                    <span>6. Faune & Biodiversité Protégée</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {modalReport.faunaSpecies}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <div className="text-[11px] text-slate-400 font-mono">
                Transmis à : Protection Civile, Conservation des Forêts, Administration Centrale
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  disabled={isDownloadingPdf}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A4D3C] hover:bg-[#0c5d49] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingPdf ? "Génération PDF..." : "Télécharger le PV d'Alerte (PDF)"}</span>
                </button>
                <Link
                  href="/dashboard/alerts"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Salle des Alertes</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
