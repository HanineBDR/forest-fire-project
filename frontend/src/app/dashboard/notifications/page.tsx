"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Radio,
  Bell,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Send,
  Volume2,
  VolumeX,
  RefreshCw,
  Eye,
  CheckCheck,
  Flame,
  Wind,
  Compass,
  ArrowRight,
  UserCheck,
  Download,
  FileText,
} from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { ROLE_LABELS, NotificationRecord } from "@/lib/notifications";
import { PanelIntercomModal } from "@/components/PanelIntercomModal";
import { generateOfficialTacticalReportPDF } from "@/lib/pdfReportGenerator";

interface TimelineItem {
  item_type: "notification" | "acknowledgment";
  id: number;
  alert_id?: string;
  sender_role?: string;
  recipient_role?: string;
  user_role?: string;
  action?: string;
  title?: string;
  message?: string;
  comment?: string;
  risk_level?: string;
  risk_score?: number;
  massif?: string;
  wilaya?: string;
  target_role?: string;
  created_at: string;
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    activeRole,
    setActiveRole,
    isConnected,
    connectionType,
    isSoundEnabled,
    setIsSoundEnabled,
    markAsRead,
    markAllAsRead,
    acknowledgeAlert,
    refreshNotifications,
    isSirocco,
    isDronePatrolActive,
    isWindStrong,
    vigiesStatus,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<"timeline" | "all" | "unread">("timeline");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch unified timeline
  const loadTimeline = async () => {
    setIsLoadingTimeline(true);
    try {
      const res = await fetch("/api/notifications/timeline?limit=60");
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          setTimelineItems(json.data);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([refreshNotifications(), loadTimeline()]);
    setIsRefreshing(false);
  };

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert({
      alert_id: alertId,
      user_role: activeRole,
      action: "acknowledged",
      comment: `Prise en compte opérationnelle immédiate par ${ROLE_LABELS[activeRole] || activeRole}.`,
    });
    await loadTimeline();
  };

  const handleEscalate = async (alertId: string) => {
    await acknowledgeAlert({
      alert_id: alertId,
      user_role: activeRole,
      action: "escalated",
      comment: `Escalade d'intervention: Mobilisation de renforts inter-wilayas par ${ROLE_LABELS[activeRole] || activeRole}.`,
      target_role: "all",
    });
    await loadTimeline();
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "unread" && n.is_read) return false;
      if (filterRole !== "all" && n.recipient_role !== filterRole && n.recipient_role !== "all") {
        return false;
      }
      if (filterRisk !== "all" && !(n.risk_level || "").toLowerCase().includes(filterRisk.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [notifications, activeTab, filterRole, filterRisk]);

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Title & Operational Actions */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-red-500" aria-hidden="true" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Système National d'Alerte Précoce & Intercom
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Réseau interconnecté en temps réel entre la Protection Civile (CODIS), l'Administration Centrale
            et la Conservation des Forêts (DGF). Notification automatique instantanée dès détection IA.
          </p>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            type="button"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            aria-label={isSoundEnabled ? "Désactiver les alertes sonores" : "Activer les alertes sonores"}
            className="h-9 px-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-medium"
          >
            {isSoundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Son: Actif</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>Son: Sourdine</span>
              </>
            )}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            aria-label="Actualiser les alertes et la chronologie"
            className="h-9 px-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-red-400" : ""}`} />
            <span>Actualiser</span>
          </button>

          {/* Panel Intercom Modal Trigger */}
          <PanelIntercomModal buttonLabel="Alerter autre panel" />
        </div>
      </section>

      {/* Environmental & Telemetry Context Cards */}
      <section aria-label="Signaux environnementaux et télémétrie" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Sirocco Status */}
        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Couloir Sirocco</span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-white mt-1">
            {isSirocco ? "Sirocco Actif (Propagation 2.5x)" : "Flux Méditerranéen Standard"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Surveillance continue des flux Sud / Sud-Ouest
          </p>
        </div>

        {/* 2. Drones FLIR Thermal */}
        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Drones Thermiques FLIR</span>
            <Radio className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-base font-bold text-white mt-1">
            {isDronePatrolActive ? "3 Patrouilles Opérationnelles" : "En Standby"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Détection infrarouge sur Yakouren & Gouraya
          </p>
        </div>

        {/* 3. Vent Fort */}
        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Anémométrie & Vent</span>
            <Wind className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-base font-bold text-white mt-1">
            {isWindStrong ? "Vent Fort (> 30 km/h)" : "Régime Modéré (18-25 km/h)"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Facteur FWI ISI sous surveillance automatique
          </p>
        </div>

        {/* 4. Vigies DGF Status */}
        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Vigies Forestières DGF</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-white mt-1">
            {vigiesStatus.active_count} / {vigiesStatus.total_count} Stations En Ligne
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {vigiesStatus.reporting_stations.join(", ")}
          </p>
        </div>
      </section>

      {/* Role Navigation Bar & Channel Filter */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Poste actif:</span>
          {[
            { id: "protection_civile", label: "Protection Civile (CODIS)" },
            { id: "mohafadat_ghabat", label: "Conservation des Forêts (DGF)" },
            { id: "admin_centrale", label: "Administration Centrale" },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveRole(r.id)}
              className={`h-8 px-3 rounded-md text-xs font-semibold transition-colors ${
                activeRole === r.id
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Canal:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px]">
            {connectionType === "realtime-ws"
              ? "Neon Realtime (WebSocket)"
              : connectionType === "sse"
              ? "Live Stream (SSE)"
              : "Polling (10s)"}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`}
            title={isConnected ? "Connecté au réseau national" : "Reconnexion..."}
          />
        </div>
      </section>

      {/* Main Content Tabs: Timeline vs Notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={`h-10 px-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "timeline"
                  ? "border-red-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Chronologie Opérationnelle (IA → Commandements)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`h-10 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "all"
                  ? "border-red-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Flux d'Alertes</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
                {notifications.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`h-10 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "unread"
                  ? "border-red-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Non Lues</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-red-600 text-[10px] text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && activeTab !== "timeline" && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-800 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tout marquer comme lu</span>
            </button>
          )}
        </div>

        {/* Tab 1: Operational Timeline */}
        {activeTab === "timeline" && (
          <div className="space-y-3">
            {isLoadingTimeline && timelineItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Chargement de la chronologie des interventions...
              </div>
            ) : timelineItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-slate-800 rounded-lg bg-slate-900">
                Aucun événement opérationnel enregistré pour le moment.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {timelineItems.map((item, idx) => {
                  const isNotif = item.item_type === "notification";
                  const isAck = item.item_type === "acknowledgment";
                  const isAi = isNotif && item.sender_role === "ai_model";

                  return (
                    <article
                      key={`${item.item_type}-${item.id}-${idx}`}
                      className="relative p-4 rounded-lg border border-slate-800 bg-slate-900 text-xs space-y-2 hover:border-slate-700 transition-colors"
                    >
                      {/* Timeline Dot */}
                      <span
                        className={`absolute -left-6 top-4 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                          isAi
                            ? "bg-red-500"
                            : isAck
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isAi
                                ? "bg-red-950 text-red-300 border border-red-800"
                                : isAck
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : "bg-amber-950 text-amber-300 border border-amber-800"
                            }`}
                          >
                            {isAi
                              ? "Détection Modèle IA"
                              : isAck
                              ? `Action (${item.action})`
                              : "Intercom Opérationnel"}
                          </span>
                          <h2 className="font-semibold text-white">
                            {item.title || (isAck ? `Accusé de réception - Alerte ${item.alert_id}` : "Message")}
                          </h2>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <time dateTime={item.created_at}>
                            {new Date(item.created_at).toLocaleString("fr-FR")}
                          </time>
                        </div>
                      </div>

                      <p className="text-slate-300 leading-relaxed text-xs">
                        {item.message || item.comment}
                      </p>

                      {/* Metadata bar */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                        {item.massif && (
                          <span>
                            Massif: <strong className="text-slate-200">{item.massif}</strong>
                          </span>
                        )}
                        {item.wilaya && (
                          <span>
                            Wilaya: <strong className="text-slate-200">{item.wilaya}</strong>
                          </span>
                        )}
                        {item.risk_level && (
                          <span>
                            Niveau: <strong className="text-red-400">{item.risk_level}</strong>
                          </span>
                        )}
                        {item.sender_role && (
                          <span>
                            De: <span className="text-slate-300">{ROLE_LABELS[item.sender_role] || item.sender_role}</span>
                          </span>
                        )}
                        {item.recipient_role && (
                          <span>
                            Vers: <span className="text-slate-300">{ROLE_LABELS[item.recipient_role] || item.recipient_role}</span>
                          </span>
                        )}
                        {item.user_role && (
                          <span>
                            Opérateur: <span className="text-slate-300">{ROLE_LABELS[item.user_role] || item.user_role}</span>
                          </span>
                        )}
                      </div>

                      {/* Interactive quick actions */}
                      {item.alert_id && isNotif && (
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleAcknowledge(item.alert_id!)}
                            className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] font-medium text-slate-200 transition-colors"
                          >
                            Prendre en compte
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEscalate(item.alert_id!)}
                            className="h-7 px-2.5 bg-red-950 hover:bg-red-900 border border-red-800 rounded text-[11px] font-semibold text-red-200 transition-colors"
                          >
                            Escalader renforts
                          </button>
                          <Link
                            href="/dashboard/alerts"
                            className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] font-medium text-slate-300 flex items-center gap-1 transition-colors"
                          >
                            <span>Voir sur la carte</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2 & 3: Alert Feed with Filters */}
        {activeTab !== "timeline" && (
          <div className="space-y-3">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Filtres:</span>
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                aria-label="Filtrer par destinataire"
                className="h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <option value="all">Tous les destinataires</option>
                <option value="protection_civile">Protection Civile</option>
                <option value="mohafadat_ghabat">Conservation des Forêts</option>
                <option value="admin_centrale">Administration Centrale</option>
              </select>

              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                aria-label="Filtrer par niveau de risque"
                className="h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <option value="all">Tous les niveaux de risque</option>
                <option value="très">Très Elevé</option>
                <option value="elevé">Elevé</option>
                <option value="modéré">Modéré</option>
              </select>
            </div>

            {/* List */}
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-slate-800 rounded-lg bg-slate-900">
                Aucune alerte ne correspond aux critères sélectionnés.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredNotifications.map((n) => {
                  const isUnread = !n.is_read;
                  return (
                    <article
                      key={n.id}
                      className={`p-4 rounded-lg border text-xs space-y-2 transition-colors ${
                        isUnread
                          ? "bg-slate-900 border-red-900/60 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                          : "bg-slate-900/70 border-slate-800"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          )}
                          <h2 className="font-bold text-white text-sm tracking-tight">{n.title}</h2>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (n.risk_level || "").includes("Très")
                                ? "bg-red-950 text-red-300 border border-red-800"
                                : "bg-amber-950 text-amber-300 border border-amber-800"
                            }`}
                          >
                            {n.risk_level}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <time dateTime={n.created_at}>
                            {new Date(n.created_at).toLocaleString("fr-FR")}
                          </time>
                          {isUnread && (
                            <button
                              type="button"
                              onClick={() => markAsRead(n.id)}
                              className="text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 bg-slate-800 transition-colors"
                            >
                              Marquer lu
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-300 leading-relaxed">{n.message}</p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                        <span>
                          Émetteur: <strong className="text-slate-200">{ROLE_LABELS[n.sender_role] || n.sender_role}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Destinataire: <strong className="text-slate-200">{ROLE_LABELS[n.recipient_role] || n.recipient_role}</strong>
                        </span>
                        {n.massif && (
                          <>
                            <span>•</span>
                            <span>Massif: {n.massif}</span>
                          </>
                        )}
                        {n.wilaya && (
                          <>
                            <span>•</span>
                            <span>Wilaya: {n.wilaya}</span>
                          </>
                        )}
                        {n.risk_score && (
                          <>
                            <span>•</span>
                            <span>Indice IA: {n.risk_score.toFixed(1)}%</span>
                          </>
                        )}
                      </div>

                      {/* Quick action bar */}
                      {n.alert_id && (
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleAcknowledge(n.alert_id!)}
                            className="h-8 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-medium text-white transition-colors"
                          >
                            Prendre en compte
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              generateOfficialTacticalReportPDF({
                                massif: n.massif || "Massif Forestier",
                                wilaya: n.wilaya || "Algérie",
                                wilayaCode: "DZ",
                                lat: n.lat || 36.735,
                                lon: n.lon || 4.435,
                                elevation: 850,
                                topography: "Relief montagneux et crêtes accidentées",
                                temp: 38.5,
                                humidity: 18,
                                wind: 45,
                                windDir: "Sud (Sirocco)",
                                co2: 685,
                                riskScore: n.risk_score || 85,
                                riskLevel: n.risk_level || "CRITICAL",
                                fwi: 35.3,
                                ffmc: 91.2,
                                isi: 14.5,
                                bui: 68.8,
                                ros_m_min: 24.5,
                                ros_km_h: 1.5,
                                area_1h: 35,
                                area_3h: 150,
                                area_6h: 420,
                                propagationZone: "Axe Nord-Nord-Est vers zones d'habitations",
                                hasHumanPopulation: true,
                                populationCount: 14500,
                                populationDetails: "Habitations et localités de lisière sous surveillance prioritaire",
                                faunaSpecies: "Faune locale protégée, rapaces et élevages",
                                canopyDensityPercent: 88,
                                canopyDensityText: "Densité Très Forte (88%) en Chêne-liège et maquis combustible",
                                timestamp: new Date(n.created_at).toLocaleTimeString("fr-FR"),
                                alertId: n.alert_id || undefined,
                              });
                            }}
                            className="h-8 px-3 bg-[#0A4D3C] hover:bg-[#0c5d49] rounded text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Télécharger PV (PDF)</span>
                          </button>
                          <Link
                            href="/dashboard/iot"
                            className="h-8 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Voir Vigie IoT</span>
                          </Link>
                          <PanelIntercomModal
                            initialAlertId={n.alert_id}
                            initialMassif={n.massif || undefined}
                            initialWilaya={n.wilaya || undefined}
                            buttonLabel="Répondre / Alerter panel"
                            buttonClassName="h-8 px-3 bg-red-600 hover:bg-red-500 border border-red-500 rounded text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

