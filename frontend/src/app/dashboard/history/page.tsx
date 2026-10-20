"use client";

import React, { useState, useEffect } from "react";
import { 
  History, 
  Download, 
  Search, 
  Filter, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  FileText,
  UserCheck
} from "lucide-react";
import { getStoredUser, getStoredToken } from "@/lib/auth";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_email: string;
  user_name: string;
  user_role: string;
  user_org?: string;
  lat: number;
  lon: number;
  wilaya: string;
  temp: number;
  humidity: number;
  wind: number;
  risk_score: number;
  risk_level: string;
  latency_ms: number;
}

const FALLBACK_LOGS: AuditLogEntry[] = [
  {
    id: "aud-01a",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    user_email: "protection@in9ad.dz",
    user_name: "Commandant Protection Civile",
    user_role: "CIVIL_PROTECTION",
    user_org: "Direction Générale de la Protection Civile",
    lat: 36.735,
    lon: 4.435,
    wilaya: "Tizi Ouzou",
    temp: 42.5,
    humidity: 14.0,
    wind: 45.0,
    risk_score: 94.2,
    risk_level: "Extreme (Crisis Alert)",
    latency_ms: 12.4
  },
  {
    id: "aud-02b",
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    user_email: "foret@in9ad.dz",
    user_name: "Inspecteur Principal des Forêts",
    user_role: "FOREST_GUARD",
    user_org: "Conservation des Forêts (DGF - Kabylie)",
    lat: 36.671,
    lon: 4.582,
    wilaya: "Bejaia",
    temp: 39.0,
    humidity: 18.0,
    wind: 36.0,
    risk_score: 88.9,
    risk_level: "Very High",
    latency_ms: 9.8
  },
  {
    id: "aud-03c",
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    user_email: "protection@in9ad.dz",
    user_name: "Commandant Protection Civile",
    user_role: "CIVIL_PROTECTION",
    user_org: "Direction Générale de la Protection Civile",
    lat: 36.452,
    lon: 4.132,
    wilaya: "Bouira",
    temp: 36.5,
    humidity: 21.0,
    wind: 30.0,
    risk_score: 82.5,
    risk_level: "Very High",
    latency_ms: 14.1
  },
  {
    id: "aud-04d",
    timestamp: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    user_email: "admin@in9ad.dz",
    user_name: "Direction Générale - Super Admin",
    user_role: "ADMIN",
    user_org: "Ministère de l'Intérieur / IN9AD Admin",
    lat: 36.752,
    lon: 5.584,
    wilaya: "Jijel",
    temp: 33.0,
    humidity: 28.0,
    wind: 24.0,
    risk_score: 68.4,
    risk_level: "High",
    latency_ms: 8.5
  },
  {
    id: "aud-05e",
    timestamp: new Date(Date.now() - 340 * 60 * 1000).toISOString(),
    user_email: "foret@in9ad.dz",
    user_name: "Inspecteur Principal des Forêts",
    user_role: "FOREST_GUARD",
    user_org: "Conservation des Forêts (DGF - Kabylie)",
    lat: 36.505,
    lon: 5.478,
    wilaya: "Setif",
    temp: 32.0,
    humidity: 26.0,
    wind: 22.0,
    risk_score: 65.0,
    risk_level: "High",
    latency_ms: 11.2
  }
];

export default function HistoryPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(FALLBACK_LOGS);
  const [filterWilaya, setFilterWilaya] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchLogs() {
      const token = getStoredToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      try {
        const res = await fetch(`${apiBase}/monitoring/audit-logs?limit=50`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setLogs(data);
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote audit logs, using local cache:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesWilaya = filterWilaya === "ALL" || log.wilaya.toLowerCase() === filterWilaya.toLowerCase();
    const matchesSearch =
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.wilaya.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesWilaya && matchesSearch;
  });

  const exportCSV = () => {
    const headers = ["ID", "Horodatage", "Opérateur", "Rôle", "Wilaya", "Latitude", "Longitude", "Temp (°C)", "Humidité (%)", "Vent (km/h)", "Score Risque (%)", "Niveau"];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.user_name} (${l.user_email})"`,
      l.user_role,
      l.wilaya,
      l.lat,
      l.lon,
      l.temp,
      l.humidity,
      l.wind,
      l.risk_score,
      `"${l.risk_level}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `in9ad_registre_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <span>Historique & Registre d'Audit des Prédictions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Traçabilité réglementaire pour la Protection Civile et la Conservation des Forêts (Obligation de redevabilité)
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter Registre CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par officier, e-mail ou wilaya…"
            className="w-full bg-transparent border-0 text-slate-200 placeholder-slate-500 focus:outline-none text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Wilaya:
          </span>
          <select
            value={filterWilaya}
            onChange={(e) => setFilterWilaya(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="ALL">Toutes les wilayas</option>
            <option value="Tizi Ouzou">Tizi Ouzou</option>
            <option value="Bejaia">Bejaia</option>
            <option value="Bouira">Bouira</option>
            <option value="Jijel">Jijel</option>
            <option value="Setif">Setif</option>
            <option value="Bordj Bou Arreridj">Bordj Bou Arreridj</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3 px-4">Horodatage</th>
                <th className="py-3 px-4">Opérateur / Institution</th>
                <th className="py-3 px-4">Wilaya & Coordonnées</th>
                <th className="py-3 px-4">Météo Observée</th>
                <th className="py-3 px-4">Risque IA</th>
                <th className="py-3 px-4 text-right">Latence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((entry) => {
                const isHighRisk = entry.risk_score >= 70;
                const isExtreme = entry.risk_score >= 85;

                return (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono">
                      {new Date(entry.timestamp).toLocaleString("fr-DZ", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{entry.user_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            entry.user_role === "CIVIL_PROTECTION"
                              ? "bg-red-500"
                              : entry.user_role === "FOREST_GUARD"
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                          }`}
                        ></span>
                        <span>{entry.user_email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-400" />
                        <span>{entry.wilaya}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {entry.lat.toFixed(3)}°N, {entry.lon.toFixed(3)}°E
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div>{entry.temp}°C · {entry.humidity}% HR</div>
                      <div className="text-[11px] text-slate-500">Vent {entry.wind} km/h</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isExtreme
                            ? "bg-red-950 text-red-300 border border-red-800"
                            : isHighRisk
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {entry.risk_score}% · {entry.risk_level.split(" ")[0]}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {entry.latency_ms.toFixed(1)} ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
