"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  Flame, 
  Wind, 
  Thermometer, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Filter, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { getStoredUser } from "@/lib/auth";

interface RiskAlert {
  id: string;
  wilaya: string;
  zone: string;
  riskScore: number;
  level: "EXTREME" | "VERY_HIGH" | "HIGH";
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDir: string;
  sirocco: boolean;
  detectedAt: string;
  coordinates: [number, number];
  civilProtectionAdvisory: string;
  forestGuardProtocol: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "MOBILIZED";
}

const INITIAL_ALERTS: RiskAlert[] = [
  {
    id: "ALT-2026-DZ-01",
    wilaya: "Tizi Ouzou",
    zone: "Forêt de Yakouren (Massif Central)",
    riskScore: 94.2,
    level: "EXTREME",
    temperature: 42.5,
    humidity: 13.0,
    windSpeed: 48.0,
    windDir: "Sud (Sirocco)",
    sirocco: true,
    detectedAt: "Il y a 14 minutes",
    coordinates: [36.7350, 4.4350],
    civilProtectionAdvisory: "Déploiement immédiat de la Colonne Mobile n°1 (Unité Principale Tizi Ouzou). Alerte rouge pré-positionnement engins.",
    forestGuardProtocol: "Évacuation des pistes forestières, activation du poste vigie Yakouren, inspection tranchées pare-feu.",
    status: "ACTIVE"
  },
  {
    id: "ALT-2026-DZ-02",
    wilaya: "Bejaia",
    zone: "Massif de l'Akfadou (Crête Soummam)",
    riskScore: 89.6,
    level: "VERY_HIGH",
    temperature: 39.8,
    humidity: 16.5,
    windSpeed: 38.0,
    windDir: "Sud-Sud-Est",
    sirocco: true,
    detectedAt: "Il y a 32 minutes",
    coordinates: [36.6710, 4.5820],
    civilProtectionAdvisory: "Mise en pré-alerte du détachement de renfort première intervention (DRPI Bejaia).",
    forestGuardProtocol: "Patrouilles motorisées sur l'axe Adekar - Akfadou, fermeture temporaire des accès sentiers.",
    status: "ACKNOWLEDGED"
  },
  {
    id: "ALT-2026-DZ-03",
    wilaya: "Bouira",
    zone: "Parc National du Djurdjura (Tikjda)",
    riskScore: 83.1,
    level: "VERY_HIGH",
    temperature: 37.0,
    humidity: 19.0,
    windSpeed: 34.0,
    windDir: "Sud",
    sirocco: true,
    detectedAt: "Il y a 1 heure",
    coordinates: [36.4520, 4.1320],
    civilProtectionAdvisory: "Surveillance renforcée du corridor touristique et des chalets de haute montagne.",
    forestGuardProtocol: "Coordination avec la brigade de gendarmerie pour interdiction des barbecues et feux de camp.",
    status: "ACTIVE"
  },
  {
    id: "ALT-2026-DZ-04",
    wilaya: "Jijel",
    zone: "Forêt d'El Aouana & Guerrouche",
    riskScore: 78.5,
    level: "HIGH",
    temperature: 35.2,
    humidity: 24.0,
    windSpeed: 29.0,
    windDir: "Sud-Est",
    sirocco: false,
    detectedAt: "Il y a 2 heures",
    coordinates: [36.7520, 5.5840],
    civilProtectionAdvisory: "Vigilance accrue unité côtière et vérification des réserves d'eau d'appoint.",
    forestGuardProtocol: "Ronde régulière des gardes forestiers sur les lisières habitées.",
    status: "ACKNOWLEDGED"
  },
  {
    id: "ALT-2026-DZ-05",
    wilaya: "Setif",
    zone: "Massif des Babors (Mont Babor)",
    riskScore: 76.0,
    level: "HIGH",
    temperature: 34.5,
    humidity: 22.0,
    windSpeed: 26.0,
    windDir: "Sud-Ouest",
    sirocco: false,
    detectedAt: "Il y a 3 heures",
    coordinates: [36.5050, 5.4780],
    civilProtectionAdvisory: "Vigilance unité Babor, maintien d'une liaison radio permanente avec le poste de commandement.",
    forestGuardProtocol: "Surveillance des zones reboisées et des peuplements de sapin de Numidie.",
    status: "ACTIVE"
  }
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<RiskAlert[]>(INITIAL_ALERTS);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const user = getStoredUser();

  const filtered = filterLevel === "ALL" 
    ? alerts 
    : alerts.filter(a => a.level === filterLevel);

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "ACKNOWLEDGED" } : a));
  };

  const handleMobilize = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "MOBILIZED" } : a));
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Vigilance Feux de Forêt - Alertes Détectées</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zones à risque Élevé et Extrême identifiées par le modèle XGBoost et validées par satellite NASA FIRMS
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Niveau:
          </span>
          {["ALL", "EXTREME", "VERY_HIGH", "HIGH"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filterLevel === lvl
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {lvl === "ALL" ? "Tous" : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {filtered.map((alert) => {
          const isExtreme = alert.level === "EXTREME";
          const isVeryHigh = alert.level === "VERY_HIGH";

          return (
            <div
              key={alert.id}
              className={`rounded-lg border p-5 transition bg-slate-900/70 ${
                isExtreme
                  ? "border-red-900/90 shadow-sm"
                  : isVeryHigh
                  ? "border-amber-900/80"
                  : "border-slate-800"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left zone details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide ${
                        isExtreme
                          ? "bg-red-950 text-red-300 border border-red-800"
                          : isVeryHigh
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-orange-950 text-orange-300 border border-orange-800"
                      }`}
                    >
                      {alert.level === "EXTREME" ? "CRITIQUE (EXTRÊME)" : alert.level} · {alert.riskScore}%
                    </span>

                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                      {alert.id}
                    </span>

                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {alert.detectedAt}
                    </span>

                    {alert.sirocco && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 text-[11px] border border-amber-900/60">
                        Vent de Sirocco (الشهيلي)
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        alert.status === "MOBILIZED"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : alert.status === "ACKNOWLEDGED"
                          ? "bg-blue-950 text-blue-300 border border-blue-800"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      Statut: {alert.status === "MOBILIZED" ? "Unités Déployées" : alert.status === "ACKNOWLEDGED" ? "Prise en Compte" : "En Attente"}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-400" />
                      <span>{alert.zone}</span>
                      <span className="text-xs text-slate-400 font-normal">({alert.wilaya})</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Coordonnées: {alert.coordinates[0].toFixed(4)}°N, {alert.coordinates[1].toFixed(4)}°E
                    </p>
                  </div>

                  {/* Weather readings grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase">Température</div>
                      <div className="font-semibold text-slate-200 mt-0.5">{alert.temperature}°C</div>
                    </div>
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase">Humidité</div>
                      <div className="font-semibold text-slate-200 mt-0.5">{alert.humidity}%</div>
                    </div>
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase">Vent</div>
                      <div className="font-semibold text-slate-200 mt-0.5">{alert.windSpeed} km/h</div>
                    </div>
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase">Direction</div>
                      <div className="font-semibold text-slate-200 mt-0.5">{alert.windDir}</div>
                    </div>
                  </div>

                  {/* Operational Directives */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="p-2.5 rounded bg-red-950/30 border border-red-900/50 text-red-200">
                      <span className="font-semibold text-red-300 block mb-0.5">
                        Consigne Protection Civile (الحماية المدنية):
                      </span>
                      {alert.civilProtectionAdvisory}
                    </div>

                    <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-900/50 text-emerald-200">
                      <span className="font-semibold text-emerald-300 block mb-0.5">
                        Directive Conservation des Forêts (محافظة الغابات):
                      </span>
                      {alert.forestGuardProtocol}
                    </div>
                  </div>
                </div>

                {/* Right action buttons */}
                <div className="flex flex-col gap-2 shrink-0 lg:w-44 border-t lg:border-t-0 lg:border-l border-slate-800 pt-3 lg:pt-0 lg:pl-4">
                  <Link
                    href={`/dashboard?lat=${alert.coordinates[0]}&lon=${alert.coordinates[1]}`}
                    className="w-full py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium text-center transition flex items-center justify-center gap-1.5"
                  >
                    <span>Voir sur la carte</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {alert.status === "ACTIVE" && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="w-full py-1.5 px-3 rounded border border-blue-800/80 bg-blue-950/50 hover:bg-blue-900/50 text-blue-300 text-xs font-medium transition"
                    >
                      Prendre en compte
                    </button>
                  )}

                  {alert.status !== "MOBILIZED" && (
                    <button
                      onClick={() => handleMobilize(alert.id)}
                      className="w-full py-1.5 px-3 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition"
                    >
                      Mobiliser unité
                    </button>
                  )}

                  {alert.status === "MOBILIZED" && (
                    <div className="flex items-center justify-center gap-1 text-xs text-emerald-400 font-medium py-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Unités en route</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
