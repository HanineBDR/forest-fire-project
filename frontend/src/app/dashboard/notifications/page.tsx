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
  Trash2,
} from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  ROLE_LABELS,
  getLocalizedRole,
  translateNotificationTitle,
  translateNotificationMessage,
  translateNotificationRisk,
  getLocalizedMassifName,
  getLocalizedWilayaName,
  type NotificationRecord,
} from "@/lib/notificationTypes";
import { PanelIntercomModal } from "@/components/PanelIntercomModal";
import { useLanguage } from "@/context/LanguageContext";

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
  const { t, language } = useLanguage();
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
    deleteNotification,
    clearAllNotifications,
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
    const roleLabel = ROLE_LABELS[activeRole] || activeRole;
    await acknowledgeAlert({
      alert_id: alertId,
      user_role: activeRole,
      action: "acknowledged",
      comment: language === "ar"
        ? `تمت المعاينة والتكفل الفوري من قِبل ${roleLabel}.`
        : language === "en"
        ? `Immediate operational acknowledgment by ${roleLabel}.`
        : `Prise en compte opérationnelle immédiate par ${roleLabel}.`,
    });
    await loadTimeline();
  };

  const handleEscalate = async (alertId: string) => {
    const roleLabel = ROLE_LABELS[activeRole] || activeRole;
    await acknowledgeAlert({
      alert_id: alertId,
      user_role: activeRole,
      action: "escalated",
      comment: language === "ar"
        ? `تصعيد التدخل: استنفار التعزيزات بين الولايات من قِبل ${roleLabel}.`
        : language === "en"
        ? `Intervention escalation: Cross-wilaya reinforcements requested by ${roleLabel}.`
        : `Escalade d'intervention: Mobilisation de renforts inter-wilayas par ${roleLabel}.`,
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
              {t("notifications_page_title")}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {t("notifications_page_subtitle")}
          </p>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            type="button"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            aria-label={isSoundEnabled ? t("notifications_sound_toggle_aria_on") : t("notifications_sound_toggle_aria_off")}
            className="h-9 px-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-medium"
          >
            {isSoundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>{t("notifications_sound_on")}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>{t("notifications_sound_mute")}</span>
              </>
            )}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            aria-label={t("notifications_refresh_aria")}
            className="h-9 px-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-red-400" : ""}`} />
            <span>{t("notifications_refresh")}</span>
          </button>

          {/* Panel Intercom Modal Trigger */}
          <PanelIntercomModal buttonLabel={t("intercom_alert_panel")} />
        </div>
      </section>

      {/* Environmental & Telemetry Context Cards */}
      <section aria-label="Signaux environnementaux et télémétrie" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Sirocco Status */}
        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t("notifications_sirocco_card_title")}</span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-white mt-1">
            {isSirocco ? t("notifications_sirocco_active") : t("notifications_sirocco_standard")}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {t("notifications_sirocco_desc")}
          </p>
        </div>

        {/* 2. Drones FLIR Thermal */}
        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t("notifications_drones_card_title")}</span>
            <Radio className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-base font-bold text-white mt-1">
            {isDronePatrolActive ? t("notifications_drones_active") : t("notifications_drones_standby")}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {t("notifications_drones_desc")}
          </p>
        </div>

        {/* 3. Vent Fort */}
        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t("notifications_wind_card_title")}</span>
            <Wind className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-base font-bold text-white mt-1">
            {isWindStrong ? t("notifications_wind_strong") : t("notifications_wind_moderate")}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {t("notifications_wind_desc")}
          </p>
        </div>

        {/* 4. Vigies DGF Status */}
        <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t("notifications_vigies_card_title")}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-white mt-1">
            {vigiesStatus.active_count} / {vigiesStatus.total_count} {t("notifications_vigies_online_suffix")}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {vigiesStatus.reporting_stations.join(", ")}
          </p>
        </div>
      </section>

      {/* Role Navigation Bar & Channel Filter */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">{t("notifications_active_post")}</span>
          {[
            { id: "protection_civile", label: t("role_protection_civile") },
            { id: "mohafadat_ghabat", label: t("role_dgf") },
            { id: "admin_centrale", label: t("role_admin_centrale") },
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
          <span className="text-slate-400">{t("notifications_channel")}</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px]">
            {connectionType === "realtime-ws"
              ? "Neon Realtime (WebSocket)"
              : connectionType === "sse"
              ? "Live Stream (SSE)"
              : "Polling (10s)"}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`}
            title={isConnected ? t("notifications_connected") : t("notifications_reconnecting")}
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
              {t("notifications_tab_timeline")}
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
              <span>{t("notifications_tab_alerts")}</span>
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
              <span>{t("notifications_tab_unread")}</span>
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
              <span>{t("notifications_mark_all_read")}</span>
            </button>
          )}
        </div>

        {/* Tab 1: Operational Timeline */}
        {activeTab === "timeline" && (
          <div className="space-y-3">
            {isLoadingTimeline && timelineItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {t("notifications_loading_timeline")}
              </div>
            ) : timelineItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-slate-800 rounded-lg bg-slate-900">
                {t("notifications_empty_timeline")}
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
                              ? t("notifications_ai_detection")
                              : isAck
                              ? `${t("notifications_action_label")} (${item.action})`
                              : t("notifications_intercom_label")}
                          </span>
                          <h2 className="font-semibold text-white">
                            {translateNotificationTitle(item.title, language) || (isAck ? `${t("notifications_ack_alert")} ${item.alert_id}` : "Message")}
                          </h2>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <time dateTime={item.created_at}>
                            {new Date(item.created_at).toLocaleString(language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-US")}
                          </time>
                        </div>
                      </div>

                      <p className="text-slate-300 leading-relaxed text-xs">
                        {translateNotificationMessage(item.message || item.comment, language)}
                      </p>

                      {/* Metadata bar */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                        {item.massif && (
                          <span>
                            {t("notifications_massif_label")} <strong className="text-slate-200">{getLocalizedMassifName(item.massif, language)}</strong>
                          </span>
                        )}
                        {item.wilaya && (
                          <span>
                            {t("notifications_wilaya_label")} <strong className="text-slate-200">{getLocalizedWilayaName(item.wilaya, language)}</strong>
                          </span>
                        )}
                        {item.risk_level && (
                          <span>
                            {t("notifications_level_label")} <strong className="text-red-400">{translateNotificationRisk(item.risk_level, language)}</strong>
                          </span>
                        )}
                        {item.sender_role && (
                          <span>
                            {t("notifications_from_label")} <span className="text-slate-300">{getLocalizedRole(item.sender_role, language)}</span>
                          </span>
                        )}
                        {item.recipient_role && (
                          <span>
                            {t("notifications_to_label")} <span className="text-slate-300">{getLocalizedRole(item.recipient_role, language)}</span>
                          </span>
                        )}
                        {item.user_role && (
                          <span>
                            {t("notifications_operator_label")} <span className="text-slate-300">{getLocalizedRole(item.user_role, language)}</span>
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
                            {t("notifications_acknowledge_btn")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEscalate(item.alert_id!)}
                            className="h-7 px-2.5 bg-red-950 hover:bg-red-900 border border-red-800 rounded text-[11px] font-semibold text-red-200 transition-colors"
                          >
                            {t("notifications_escalate_btn")}
                          </button>
                          <Link
                            href="/dashboard/alerts"
                            className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] font-medium text-slate-300 flex items-center gap-1 transition-colors"
                          >
                            <span>{t("notifications_view_map")}</span>
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
                <span>{t("filter_label")}:</span>
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                aria-label="Filter by recipient"
                className="h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <option value="all">{t("notifications_filter_all_recipients")}</option>
                <option value="protection_civile">{t("role_protection_civile")}</option>
                <option value="mohafadat_ghabat">{t("role_dgf")}</option>
                <option value="admin_centrale">{t("role_admin_centrale")}</option>
              </select>

              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                aria-label="Filter by risk level"
                className="h-8 px-2.5 bg-slate-800 border border-slate-700 rounded text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <option value="all">{t("notifications_filter_all_risk")}</option>
                <option value="très">{t("intercom_urgency_critical")}</option>
                <option value="elevé">{t("intercom_urgency_high")}</option>
                <option value="modéré">{t("intercom_urgency_moderate")}</option>
              </select>
            </div>

            {/* List */}
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-slate-800 rounded-lg bg-slate-900">
                {t("notifications_empty_feed")}
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
                          <h2 className="font-bold text-white text-sm tracking-tight">{translateNotificationTitle(n.title, language)}</h2>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (n.risk_level || "").includes("Très")
                                ? "bg-red-950 text-red-300 border border-red-800"
                                : "bg-amber-950 text-amber-300 border border-amber-800"
                            }`}
                          >
                            {translateNotificationRisk(n.risk_level, language)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <time dateTime={n.created_at}>
                            {new Date(n.created_at).toLocaleString(language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-US")}
                          </time>
                          <div className="flex items-center gap-1.5">
                            {isUnread && (
                              <button
                                type="button"
                                onClick={() => markAsRead(n.id)}
                                className="text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 bg-slate-800 transition-colors"
                              >
                                {t("notifications_mark_read")}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteNotification(n.id)}
                              title={t("notif_delete") || "Delete notification"}
                              className="text-slate-400 hover:text-rose-400 px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-rose-950/40 transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{t("notif_delete") || "Delete"}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-300 leading-relaxed">{translateNotificationMessage(n.message, language)}</p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                        <span>
                          {t("notifications_from_label")} <strong className="text-slate-200">{getLocalizedRole(n.sender_role, language)}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          {t("notifications_to_label")} <strong className="text-slate-200">{getLocalizedRole(n.recipient_role, language)}</strong>
                        </span>
                        {n.massif && (
                          <>
                            <span>•</span>
                            <span>{t("notifications_massif_label")} {getLocalizedMassifName(n.massif, language)}</span>
                          </>
                        )}
                        {n.wilaya && (
                          <>
                            <span>•</span>
                            <span>{t("notifications_wilaya_label")} {getLocalizedWilayaName(n.wilaya, language)}</span>
                          </>
                        )}
                        {n.risk_score && (
                          <>
                            <span>•</span>
                            <span>{t("model_ai_label")}: {n.risk_score.toFixed(1)}%</span>
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
                            {t("notifications_acknowledge_btn")}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const { generateOfficialTacticalReportPDF } = await import("@/lib/pdfReportGenerator");
                              await generateOfficialTacticalReportPDF({
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
                                timestamp: new Date(n.created_at).toLocaleTimeString(language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-US"),
                                alertId: n.alert_id || undefined,
                              });
                            }}
                            className="h-8 px-3 bg-[#0A4D3C] hover:bg-[#0c5d49] rounded text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{t("export_journal_pdf")}</span>
                          </button>
                          <Link
                            href="/dashboard/iot"
                            className="h-8 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t("layer_iot_sensors")}</span>
                          </Link>
                          <PanelIntercomModal
                            initialAlertId={n.alert_id}
                            initialMassif={n.massif || undefined}
                            initialWilaya={n.wilaya || undefined}
                            buttonLabel={t("intercom_alert_panel")}
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
