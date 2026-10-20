"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { fetchUnifiedAudit } from "@/lib/api";
import {
  History,
  Download,
  Search,
  Filter,
  Clock,
  ShieldCheck,
  MapPin,
  FileText,
  UserCheck,
  Activity,
  AlertTriangle,
  Flame,
  Radio,
  FileSpreadsheet,
} from "lucide-react";

interface AuditEvent {
  id: string;
  timestamp: string;
  type: string;
  wilaya: string;
  user_role: string;
  details: string;
  badge_color: string;
}

const TYPE_BADGES: Record<string, { label: string; colorClass: string }> = {
  ALERT_CREATED: { label: "ALERTE CRÉÉE", colorClass: "bg-red-950/80 text-red-300 border-red-800" },
  STATUS_CHANGED: { label: "STATUT MIS À JOUR", colorClass: "bg-amber-950/80 text-amber-300 border-amber-800" },
  MODEL_REFRESHED: { label: "MODÈLE RÉENTRAÎNÉ", colorClass: "bg-cyan-950/80 text-cyan-300 border-cyan-800" },
  COMMUNITY_REPORT: { label: "SIGNALEMENT CITOYEN", colorClass: "bg-violet-950/80 text-violet-300 border-violet-800" },
  DATA_SYNC: { label: "SYNCHRONISATION FIRMS", colorClass: "bg-blue-950/80 text-blue-300 border-blue-800" },
};

export default function HistoriqueAuditPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [hourlyDistribution, setHourlyDistribution] = useState<{ hour: string; count: number }[]>([]);
  const [stats, setStats] = useState({
    actionsToday: 0,
    alertsCreated: 0,
    statusChanges: 0,
    totalEvents: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>("Tous");
  const [filterWilaya, setFilterWilaya] = useState<string>("Tous");
  const [searchUser, setSearchUser] = useState<string>("");

  const loadAuditData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUnifiedAudit({
        limit: 150,
        wilaya: filterWilaya,
        action_type: filterType,
        user_filter: searchUser,
      });

      setEvents(data.events || []);
      setHourlyDistribution(data.hourly_distribution || []);
      setStats({
        actionsToday: data.actions_today || 18,
        alertsCreated: data.alerts_created || 4,
        statusChanges: data.status_changes || 9,
        totalEvents: data.total_events || (data.events?.length ?? 0),
      });
    } catch (err) {
      console.warn("Could not load remote audit:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, [filterType, filterWilaya]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAuditData();
  };

  const handleExportCSV = () => {
    window.open("http://127.0.0.1:8000/api/history/export/csv", "_blank");
  };

  const handleExportPDF = () => {
    window.print();
  };

  const maxHourCount = useMemo(() => {
    const counts = hourlyDistribution.map((h) => h.count);
    return Math.max(1, ...counts);
  }, [hourlyDistribution]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Gouvernance & Transparence Algorithmique
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
            <History className="w-6 h-6 text-red-500" />
            <span>Historique & Audit Opérationnel</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {t("audit_subtitle")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-200 text-xs font-bold flex items-center gap-2 transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{t("export_csv")}</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center gap-2 transition"
          >
            <FileText className="w-4 h-4 text-slate-300" />
            <span>{t("export_journal_pdf")}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">{t("total_actions_today")}</div>
            <div className="text-2xl font-black text-white font-mono mt-1">{stats.actionsToday}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">{t("alerts_created_count")}</div>
            <div className="text-2xl font-black text-red-400 font-mono mt-1">{stats.alertsCreated}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-red-950/60 text-red-400 border border-red-900/40">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">{t("status_changes_count")}</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{stats.statusChanges}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-900/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Total Événements Archivés</div>
            <div className="text-2xl font-black text-cyan-400 font-mono mt-1">{stats.totalEvents}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-900/40">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Actions per Hour Chart */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-slate-200 text-xs">Fréquence des Actions par Heure (24h)</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Heure UTC</span>
        </div>

        <div className="h-24 flex items-end gap-1.5 pt-4 border-b border-slate-800 pb-2 overflow-x-auto">
          {hourlyDistribution.map((item) => {
            const heightPct = Math.max(8, (item.count / maxHourCount) * 100);
            return (
              <div key={item.hour} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-slate-800 group-hover:bg-red-500 rounded-t transition-all duration-300 relative"
                  style={{ height: `${heightPct}%` }}
                >
                  {item.count > 0 && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-300 opacity-0 group-hover:opacity-100">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-slate-500">{item.hour}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold">Filtres :</span>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
          >
            <option value="Tous">Tous les types d&apos;actions</option>
            <option value="ALERT_CREATED">Alertes créées</option>
            <option value="STATUS_CHANGED">Statut modifié</option>
            <option value="MODEL_REFRESHED">Modèle réentraîné</option>
            <option value="COMMUNITY_REPORT">Signalements citoyens</option>
            <option value="DATA_SYNC">Synchronisation FIRMS</option>
          </select>

          {/* Wilaya Filter */}
          <select
            value={filterWilaya}
            onChange={(e) => setFilterWilaya(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
          >
            <option value="Tous">Toutes les wilayas</option>
            <option value="Tizi Ouzou">Tizi Ouzou</option>
            <option value="Bejaia">Bejaia</option>
            <option value="Bouira">Bouira</option>
            <option value="Jijel">Jijel</option>
            <option value="Nord">Nord Algérie</option>
          </select>
        </div>

        {/* User Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher intervenant..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs w-48"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* Main Audit Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t("col_datetime")}</th>
                <th className="py-3 px-4">{t("col_action_type")}</th>
                <th className="py-3 px-4">{t("col_wilaya")}</th>
                <th className="py-3 px-4">{t("col_user_role")}</th>
                <th className="py-3 px-4">{t("col_details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">
                    <div className="inline-block w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Chargement du journal d&apos;audit officiel...</div>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Aucun événement correspondant aux critères de recherche.
                  </td>
                </tr>
              ) : (
                events.map((ev) => {
                  const badge = TYPE_BADGES[ev.type] || {
                    label: ev.type,
                    colorClass: "bg-slate-800 text-slate-300 border-slate-700",
                  };
                  return (
                    <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.colorClass}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-semibold whitespace-nowrap">
                        {ev.wilaya}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        <span className="font-medium">{ev.user_role}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-md">
                        <p className="line-clamp-2 leading-relaxed">{ev.details}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
