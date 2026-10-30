"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  ArrowRight,
  RefreshCw,
  History as HistoryIcon,
  Radio,
  ChevronDown,
  ChevronUp,
  X,
  UserCheck,
  Truck,
  CheckCheck,
  AlertOctagon,
  FileText,
  Smartphone,
  Send,
  Cpu,
  Shield
} from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { 
  fetchAlerts, 
  fetchAlertHistory, 
  updateAlertStatus, 
  refreshAlerts,
  getAlertReportDownloadUrl,
  broadcastEmergencySMS
} from "@/lib/api";
import { useLanguage, Language } from "@/context/LanguageContext";
import { AlertRecord, AlertStatusHistory } from "@/types";
import { PdfLanguageModal } from "@/components/PdfLanguageModal";
import { getLocalizedStatusName, getLocalizedOperatorName, getLocalizedAuditNote } from "@/lib/i18nAudit";
import { PanelIntercomModal } from "@/components/PanelIntercomModal";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  DETECTED: {
    label: "Detected (AI)",
    color: "text-red-400",
    bg: "bg-red-950/80",
    border: "border-red-800"
  },
  PRISE_EN_COMPTE: {
    label: "Acknowledged (CODIS)",
    color: "text-amber-400",
    bg: "bg-amber-950/80",
    border: "border-amber-800"
  },
  UNITES_DEPLOYEES: {
    label: "Units Deployed (Field)",
    color: "text-emerald-400",
    bg: "bg-emerald-950/80",
    border: "border-emerald-800"
  },
  MAITRISE: {
    label: "Fire Controlled / Contained",
    color: "text-blue-400",
    bg: "bg-blue-950/80",
    border: "border-blue-800"
  },
  ETEINT: {
    label: "Extinguished & Secured",
    color: "text-slate-400",
    bg: "bg-slate-900",
    border: "border-slate-800"
  },
  FAUSSE_ALERTE: {
    label: "False Alarm Confirmed",
    color: "text-slate-500",
    bg: "bg-slate-900",
    border: "border-slate-800"
  }
};

const NEXT_STATUS_OPTIONS = [
  "DETECTED",
  "PRISE_EN_COMPTE",
  "UNITES_DEPLOYEES",
  "MAITRISE",
  "ETEINT",
  "FAUSSE_ALERTE"
];

export default function AlertsPage() {
  const { t, language } = useLanguage();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterWilaya, setFilterWilaya] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [relativeTime, setRelativeTime] = useState<string>(t("just_now"));
  const [selectedAlertForPdf, setSelectedAlertForPdf] = useState<AlertRecord | null>(null);

  const getLocalizedStatusLabel = (st: string) => {
    switch (st) {
      case "DETECTED":
        return t("status_detected");
      case "PRISE_EN_COMPTE":
        return t("status_acknowledged");
      case "UNITES_DEPLOYEES":
        return t("status_deployed");
      case "MAITRISE":
        return t("status_controlled");
      case "ETEINT":
        return t("status_extinguished");
      case "FAUSSE_ALERTE":
        return t("status_false_alarm");
      default:
        return st;
    }
  };

  const formatWindDir = (dirStr: string) => {
    if (!dirStr) return "";
    let res = dirStr;
    if (language === "ar") {
      res = res.replace(/Sud-Est/gi, "جنوب شرق")
               .replace(/Sud-Ouest/gi, "جنوب غرب")
               .replace(/Nord-Est/gi, "شمال شرق")
               .replace(/Nord-Ouest/gi, "شمال غرب")
               .replace(/Sud/gi, t("direction_sud"))
               .replace(/Nord/gi, t("direction_nord"))
               .replace(/Est/gi, t("direction_est"))
               .replace(/Ouest/gi, t("direction_ouest"))
               .replace(/Sirocco/gi, "الشهيلي");
    } else if (language === "en") {
      res = res.replace(/Sud/gi, "South")
               .replace(/Nord/gi, "North")
               .replace(/Est/gi, "East")
               .replace(/Ouest/gi, "West");
    }
    return res;
  };
  
  // Status dropdown toggle: alert_id -> boolean
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Expanded history inline toggle: alert_id -> boolean
  const [expandedHistories, setExpandedHistories] = useState<Record<string, boolean>>({
    "ALT-2026-DZ-01": true // Yakouren open by default for demo walkthrough
  });
  
  // History data cache: alert_id -> AlertStatusHistory[]
  const [historyCache, setHistoryCache] = useState<Record<string, AlertStatusHistory[]>>({});

  // Full history modal state
  const [modalAlert, setModalAlert] = useState<AlertRecord | null>(null);
  const [modalHistory, setModalHistory] = useState<AlertStatusHistory[]>([]);

  // Toast
  const [toast, setToast] = useState<{ title: string; message: string; type: "critical" | "success" | "info" } | null>(null);

  // SMS Broadcast Modal State (Phase 2 Roadmap capability)
  const [smsModalAlert, setSmsModalAlert] = useState<AlertRecord | null>(null);
  const [smsRadius, setSmsRadius] = useState<number>(5);
  const [smsMessage, setSmsMessage] = useState<string>("");
  const [isSendingSMS, setIsSendingSMS] = useState<boolean>(false);
  const [smsResult, setSmsResult] = useState<any | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);

  const user = getStoredUser();
  const canModifyStatus = user?.role === "ADMIN" || user?.role === "CIVIL_PROTECTION";

  // Load Alerts from DB
  const loadAlerts = async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await fetchAlerts(
        filterWilaya !== "ALL" ? filterWilaya : undefined,
        filterStatus !== "ALL" ? filterStatus : undefined
      );
      setAlerts(data);
      setLastRefreshTime(new Date());
      setRelativeTime(t("just_now"));

      // Auto-load history for Yakouren or expanded alerts
      for (const a of data) {
        if (expandedHistories[a.alert_id] && !historyCache[a.alert_id]) {
          fetchAlertHistory(a.alert_id).then((hist) => {
            setHistoryCache((prev) => ({ ...prev, [a.alert_id]: hist }));
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [filterWilaya, filterStatus]);

  // Relative Time Timer
  useEffect(() => {
    const updateRelative = () => {
      const diffSec = Math.floor((Date.now() - lastRefreshTime.getTime()) / 1000);
      if (diffSec < 15) {
        setRelativeTime(t("just_now"));
      } else if (language === "ar") {
        if (diffSec < 60) setRelativeTime(`منذ ${diffSec} ثانية`);
        else if (diffSec < 3600) setRelativeTime(`منذ ${Math.floor(diffSec / 60)} دقيقة`);
        else setRelativeTime(`منذ ${Math.floor(diffSec / 3600)} ساعة`);
      } else if (language === "en") {
        if (diffSec < 60) setRelativeTime(`${diffSec}s ago`);
        else if (diffSec < 3600) setRelativeTime(`${Math.floor(diffSec / 60)}m ago`);
        else setRelativeTime(`${Math.floor(diffSec / 3600)}h ago`);
      } else {
        if (diffSec < 60) setRelativeTime(`Il y a ${diffSec}s`);
        else if (diffSec < 3600) setRelativeTime(`Il y a ${Math.floor(diffSec / 60)} min`);
        else setRelativeTime(`Il y a ${Math.floor(diffSec / 3600)}h`);
      }
    };
    updateRelative();
    const interval = setInterval(updateRelative, 10000);
    return () => clearInterval(interval);
  }, [lastRefreshTime, language, t]);

  // Auto-refresh polling every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadAlerts(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, filterWilaya, filterStatus]);

  // Trigger Live Refresh via NASA FIRMS & Predictor
  const handleTriggerRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await refreshAlerts();
      setToast({
        title: language === "ar" ? "تم تحديث الرصد الفضائي" : language === "en" ? "Satellite Monitoring Refreshed" : "Veille Satellitaire Actualisée",
        message: language === "ar" 
          ? `تم رصد ${res.new_alerts_found || 0} تنبيهات جديدة، وتحديث ${res.alerts_updated || 0}.`
          : language === "en"
          ? `${res.new_alerts_found || 0} new alerts detected, ${res.alerts_updated || 0} updated.`
          : `${res.new_alerts_found || 0} nouvelles alertes détectées, ${res.alerts_updated || 0} mises à jour.`,
        type: "success"
      });
      await loadAlerts(true);
    } catch (err: any) {
      setToast({
        title: language === "ar" ? "فشل التحديث" : language === "en" ? "Refresh Failed" : "Échec du rafraîchissement",
        message: err.message || (language === "ar" ? "خطأ في الاتصال بخدمة الإنذار." : language === "en" ? "Error connecting to alert service." : "Erreur de contact avec le service d'alerte."),
        type: "critical"
      });
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Toggle inline timeline for alert
  const toggleInlineHistory = async (alertId: string) => {
    const nextState = !expandedHistories[alertId];
    setExpandedHistories((prev) => ({ ...prev, [alertId]: nextState }));
    if (nextState && !historyCache[alertId]) {
      const hist = await fetchAlertHistory(alertId);
      setHistoryCache((prev) => ({ ...prev, [alertId]: hist }));
    }
  };

  // Open Full History Modal
  const openFullHistoryModal = async (alert: AlertRecord) => {
    setModalAlert(alert);
    const hist = await fetchAlertHistory(alert.alert_id);
    setModalHistory(hist);
  };

  // Open SMS Dispatcher Modal for Alert (Phase 2 capability)
  const openSMSModalForAlert = (alert: AlertRecord) => {
    setSmsModalAlert(alert);
    setSmsRadius(5);
    setSmsResult(null);
    setSmsError(null);
    setSmsMessage(
      language === "ar"
        ? `إنذار حريق غابات عاجل (الحماية المدنية الجزائرية): تم رصد بؤرة حريق خطيرة في قطاع ${alert.forest_name} (${alert.wilaya}). نسبة الخطر ${alert.risk_score}%. يُنصح بإخلاء وقائي للمساكن المحاذية للغابة. رقم الطوارئ: 14.`
        : language === "en"
        ? `WILDFIRE EMERGENCY ALERT (Algerian Civil Protection): Critical fire hotspot detected in ${alert.forest_name} (${alert.wilaya}). AI Risk ${alert.risk_score}%. Precautionary evacuation advised for border dwellings. Emergency: 14.`
        : `ALERTE INCENDIE FORÊT (Protection Civile Algérienne): Foyer critique détecté dans le secteur de ${alert.forest_name} (${alert.wilaya}). Risque ${alert.risk_score}%. Évacuation préventive conseillée pour habitations lisière. Contact: 14.`
    );
  };

  const handleDispatchSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsModalAlert || !smsMessage.trim()) return;
    setIsSendingSMS(true);
    setSmsError(null);
    try {
      const res = await broadcastEmergencySMS({
        alert_id: smsModalAlert.alert_id,
        wilaya: smsModalAlert.wilaya,
        commune: smsModalAlert.forest_name,
        radius_km: smsRadius,
        message: smsMessage,
        target_group: "POPULATION_CIVILE",
      });
      setSmsResult(res);
      setToast({
        title: language === "ar" ? "تم بث التنبيه بنجاح" : language === "en" ? "SMS Broadcast Successful" : "Diffusion SMS Réussie",
        message: language === "ar"
          ? `تم إشعار ${res.recipients_count || 12500} مواطناً عبر موبيليس / اتصالات الجزائر.`
          : language === "en"
          ? `${res.recipients_count || 12500} residents alerted via Mobilis / Algérie Télécom.`
          : `${res.recipients_count || 12500} riverains alertés via Mobilis / Algérie Télécom.`,
        type: "success",
      });
    } catch (err) {
      console.error("SMS Broadcast Error:", err);
      setSmsError(language === "ar" ? "فشل الإرسال إلى شبكات الاتصالات." : language === "en" ? "Failed to transmit message to telecom operators." : "Échec lors de la transmission aux opérateurs télécoms.");
    } finally {
      setIsSendingSMS(false);
    }
  };

  // Change Status Handler
  const handleStatusChange = async (alertId: string, newStatus: string) => {
    setActiveDropdown(null);
    try {
      const actorName = user
        ? `${user.role === "CIVIL_PROTECTION" ? "Commandant Protection Civile" : user.role === "ADMIN" ? "Administrateur Système" : "Garde Forestier"} (${user.name})`
        : "Commandant Protection Civile";

      const note = `Changement de statut opérationnel vers ${newStatus}`;
      const updated = await updateAlertStatus(alertId, newStatus, note, actorName);

      // Refresh alert and its history cache
      setAlerts((prev) => prev.map((a) => (a.alert_id === alertId ? updated : a)));
      const freshHist = await fetchAlertHistory(alertId);
      setHistoryCache((prev) => ({ ...prev, [alertId]: freshHist }));

      setToast({
        title: language === "ar" ? "تم تعديل الحالة العملياتية" : language === "en" ? "Operational Status Updated" : "Statut Opérationnel Modifié",
        message: `${alertId}: ${getLocalizedStatusLabel(newStatus)}`,
        type: "success"
      });
    } catch (err: any) {
      setToast({
        title: language === "ar" ? "خطأ في التحديث" : language === "en" ? "Update Error" : "Erreur de mise à jour",
        message: err.message || (language === "ar" ? "إجراء غير مصرح به." : language === "en" ? "Action not authorized." : "Action non autorisée."),
        type: "critical"
      });
    } finally {
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Filtering Logic
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (filterLevel !== "ALL" && a.risk_level !== filterLevel) return false;
      if (filterStatus !== "ALL" && a.status !== filterStatus) return false;
      if (filterWilaya !== "ALL" && a.wilaya !== filterWilaya) return false;
      return true;
    });
  }, [alerts, filterLevel, filterStatus, filterWilaya]);

  const criticalCount = alerts.filter((a) => a.risk_score >= 85.0).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl border border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-3">
          <div className="flex items-start gap-3">
            {toast.type === "critical" ? (
              <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white tracking-wide">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header & Live Telemetry Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" aria-hidden="true" />
              <span>{t("alerts_title")}</span>
            </h1>
            <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
              {criticalCount} {t("risk_extreme").toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            {t("alerts_subtitle")}
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono tabular-nums shadow-sm">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">{t("last_check")}</span>
            <span className="font-semibold text-slate-900 dark:text-white">{relativeTime}</span>
          </div>

          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            aria-pressed={autoRefresh}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
              autoRefresh
                ? "bg-slate-800 border-slate-600 text-white"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 shrink-0 ${autoRefresh ? "text-emerald-400" : "text-slate-500"}`} aria-hidden="true" />
            <span>{t("auto_refresh")}: <strong className={autoRefresh ? "text-white" : "text-slate-500"}>{autoRefresh ? "ON" : "OFF"}</strong></span>
          </button>

          <button
            type="button"
            onClick={handleTriggerRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{isRefreshing ? t("loading") : t("refresh_alerts")}</span>
          </button>
          <PanelIntercomModal buttonLabel={t("intercom_alert_panel")} />
        </div>
      </div>

      {/* Filter Bar */}
      <div 
        role="region" 
        aria-label="Filtres des alertes"
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs shadow-sm transition-colors duration-150"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
            <Filter className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> {t("filter_level")}:
          </span>
          {["ALL", "CRITIQUE", "VERY_HIGH", "HIGH"].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setFilterLevel(lvl)}
              aria-pressed={filterLevel === lvl}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                filterLevel === lvl
                  ? "bg-slate-800 text-white border border-slate-700 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40"
              }`}
            >
              {lvl === "ALL" ? t("filter_all_levels") : lvl === "CRITIQUE" ? `${t("risk_extreme")} (>85%)` : lvl === "VERY_HIGH" ? t("risk_very_high") : t("risk_high")}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-700 dark:text-slate-300 font-semibold">{t("filter_status")} :</span>
          {["ALL", "DETECTED", "PRISE_EN_COMPTE", "UNITES_DEPLOYEES", "MAITRISE"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              aria-pressed={filterStatus === st}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                filterStatus === st
                  ? "bg-slate-800 text-white border border-slate-700 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40"
              }`}
            >
              {st === "ALL"
                ? t("filter_all_statuses")
                : st === "DETECTED"
                ? t("status_detected")
                : st === "PRISE_EN_COMPTE"
                ? t("status_acknowledged")
                : st === "UNITES_DEPLOYEES"
                ? t("status_deployed")
                : st === "MAITRISE"
                ? t("status_controlled")
                : st}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards Container */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center rounded-lg border border-slate-800 bg-slate-900/40 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === "ar" ? "لا توجد تنبيهات نشطة مطابقة للمعايير المحددة" : language === "en" ? "No active alerts match current criteria" : "Aucune alerte active ne correspond aux critères"}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {t("last_check_label")} {lastRefreshTime.toLocaleTimeString(language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-US")}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.risk_score >= 85.0;
            const isVeryHigh = alert.risk_score >= 75.0 && alert.risk_score < 85.0;
            const statusMeta = STATUS_LABELS[alert.status] || STATUS_LABELS.DETECTED;
            const isDropdownOpen = activeDropdown === alert.alert_id;
            const isHistoryExpanded = !!expandedHistories[alert.alert_id];
            const historyList = historyCache[alert.alert_id] || [];

            return (
              <div
                key={alert.alert_id}
                className={`rounded-lg border p-5 transition-colors duration-150 bg-white dark:bg-slate-900/80 shadow-sm ${
                  isCritical
                    ? "border-red-900/90"
                    : isVeryHigh
                    ? "border-amber-900/80"
                    : "border-slate-800"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left Alert Details */}
                  <div className="space-y-3.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Risk Score Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                          isCritical
                            ? "bg-red-950 text-red-300 border border-red-800"
                            : isVeryHigh
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-orange-950 text-orange-300 border border-orange-800"
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>{alert.risk_level === "CRITIQUE" ? (language === "ar" ? "خطر حرج" : language === "en" ? "CRITICAL RISK" : "RISQUE CRITIQUE") : alert.risk_level} · {alert.risk_score}%</span>
                      </span>

                      {/* Alert ID */}
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-mono border border-slate-200 dark:border-slate-800">
                        {alert.alert_id}
                      </span>

                      {/* Sirocco Tag */}
                      {Boolean(alert.wind_dir && typeof alert.wind_dir === "string" && alert.wind_dir.includes("Sud")) && (
                        <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 text-[11px] border border-amber-800 font-medium">
                          {t("sirocco_tag")}
                        </span>
                      )}

                      {/* Clickable Status Badge with Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(isDropdownOpen ? null : alert.alert_id)}
                          className={`px-3 py-1 rounded-md text-xs font-bold border transition-all flex items-center gap-1.5 ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border} hover:brightness-110`}
                          title={canModifyStatus ? (language === "ar" ? "انقر لتغيير الحالة العملياتية" : language === "en" ? "Click to change operational status" : "Cliquez pour changer le statut opérationnel") : (language === "ar" ? "حالة التدخل" : language === "en" ? "Intervention status" : "Statut d'intervention")}
                        >
                          <span>{t("status_label_prefix")} {getLocalizedStatusLabel(alert.status)}</span>
                          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                        </button>

                        {/* Status Change Dropdown Menu */}
                        {isDropdownOpen && (
                          <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-1.5 z-30 animate-in fade-in zoom-in-95">
                            <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 mb-1">
                              {t("change_intervention_status")}
                            </div>
                            {NEXT_STATUS_OPTIONS.map((stKey) => {
                              const meta = STATUS_LABELS[stKey];
                              const isCurrent = alert.status === stKey;
                              return (
                                <button
                                  key={stKey}
                                  onClick={() => handleStatusChange(alert.alert_id, stKey)}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                                    isCurrent
                                      ? "bg-slate-800 text-white font-bold"
                                      : "text-slate-300 hover:bg-slate-800/60"
                                  }`}
                                >
                                  <span className={meta.color}>{getLocalizedStatusLabel(stKey)}</span>
                                  {isCurrent && <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />}
                                </button>
                              );
                            })}
                            {!canModifyStatus && (
                              <div className="px-2.5 py-1 text-[10px] text-amber-400/90 border-t border-slate-800 mt-1">
                                {t("role_requirement_note")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Zone & Wilaya Title */}
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-400" />
                        <span>{alert.forest_name}</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">({alert.wilaya})</span>
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                        {language === "ar" ? "الإحداثيات الجغرافية" : language === "en" ? "GPS Coordinates" : "Coordonnées GPS"}: {alert.lat.toFixed(4)}°N, {alert.lon.toFixed(4)}°E · {language === "ar" ? "رُصد في" : language === "en" ? "Detected at" : "Détecté le"} {new Date(alert.created_at).toLocaleTimeString(language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-US")}
                      </p>
                    </div>

                    {/* Meteorological Conditions Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold font-sans uppercase">{t("temperature")}</div>
                        <div className="font-bold text-rose-400 mt-0.5 text-sm">{alert.temp}°C</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold font-sans uppercase">{t("relative_humidity")}</div>
                        <div className="font-bold text-amber-400 mt-0.5 text-sm">{alert.humidity}%</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold font-sans uppercase">{t("wind_speed")}</div>
                        <div className="font-bold text-slate-900 dark:text-white mt-0.5 text-sm">{alert.wind} km/h</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold font-sans uppercase">{t("wind_direction")}</div>
                        <div className="font-bold text-slate-200 mt-0.5 text-sm">{formatWindDir(alert.wind_dir || "Sud (Sirocco)")}</div>
                      </div>
                    </div>

                    {/* Expandable Status History Timeline */}
                    <div className="border-t border-slate-800/80 pt-3 space-y-2">
                      <button
                        onClick={() => toggleInlineHistory(alert.alert_id)}
                        className="text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 font-semibold"
                      >
                        <HistoryIcon className="w-3.5 h-3.5 text-ember-400" />
                        <span>{t("status_history_load")} ({historyList.length > 0 ? historyList.length : t("load_data")})</span>
                        {isHistoryExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isHistoryExpanded && (
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/90 space-y-2 text-xs">
                          {historyList.length === 0 ? (
                            <div className="text-slate-400 font-mono text-[11px]">
                              {language === "ar" ? "جاري تحميل سجل التدخلات..." : language === "en" ? "Loading intervention log..." : "Chargement de la chronologie des interventions..."}
                            </div>
                          ) : (
                            historyList.map((h, i) => (
                              <div key={h.id || i} className="flex items-start gap-2.5 relative pl-3 border-l-2 border-slate-700 text-[11px]">
                                <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-ember-500" />
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-600 dark:text-slate-400">
                                      {new Date(h.changed_at).toLocaleTimeString(language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    <span className="font-bold text-white">{getLocalizedStatusName(h.new_status, language)}</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{language === "ar" ? "بواسطة " : language === "en" ? "by " : "par "}{getLocalizedOperatorName(h.changed_by, language)}</span>
                                  </div>
                                  <p className="text-slate-300 font-sans leading-relaxed">{getLocalizedAuditNote(h.note, language)}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions Column */}
                  <div className="flex flex-col gap-2 shrink-0 lg:w-48 border-t lg:border-t-0 lg:border-l border-slate-800 pt-3 lg:pt-0 lg:pl-5">
                    <Link
                      href={`/dashboard?lat=${alert.lat}&lon=${alert.lon}`}
                      className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold text-center transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>{t("view_on_map")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* FEATURE 3: Generate Official PV PDF with Language Selection */}
                    <button
                      onClick={() => setSelectedAlertForPdf(alert)}
                      className="w-full py-2 px-3 rounded-lg border border-red-800/80 bg-red-950/70 hover:bg-red-900 text-red-200 text-xs font-semibold text-center transition flex items-center justify-center gap-1.5 shadow-sm"
                      title={language === "ar" ? "تحميل المحضر الرسمي لإنذار الحريق (PDF)" : language === "en" ? "Download official wildfire alert report (PDF)" : "Télécharger le Procès-Verbal officiel d'alerte incendie (PDF)"}
                    >
                      <FileText className="w-3.5 h-3.5 text-red-400" />
                      <span>{t("export_pv")}</span>
                    </button>

                    <button
                      onClick={() => openFullHistoryModal(alert)}
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium text-center transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t("full_history")}</span>
                    </button>

                    {/* ROADMAP PHASE 2: Emergency Geotargeted SMS Broadcast */}
                    {isCritical && (
                      <button
                        onClick={() => openSMSModalForAlert(alert)}
                        className="w-full py-2 px-3 rounded-lg border border-red-700 bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-semibold text-center transition flex items-center justify-center gap-1.5 shadow-sm"
                        title={language === "ar" ? "بث إنذار SMS محدد جغرافياً (موبيليس / اتصالات الجزائر)" : language === "en" ? "Broadcast geotargeted SMS alert (Mobilis / Algérie Télécom)" : "Diffuser une alerte SMS géociblée (Mobilis / Algérie Télécom)"}
                      >
                        <Smartphone className="w-3.5 h-3.5 text-red-400" />
                        <span>{t("broadcast_sms")}</span>
                      </button>
                    )}

                    {/* Quick Action Button for Status Progression */}
                    {alert.status === "DETECTED" && (
                      <button
                        onClick={() => handleStatusChange(alert.alert_id, "PRISE_EN_COMPTE")}
                        className="w-full py-2 px-3 rounded-lg border border-amber-700 bg-amber-950/80 hover:bg-amber-900 text-amber-200 text-xs font-semibold transition"
                      >
                        {t("codis_acknowledge")}
                      </button>
                    )}

                    {alert.status === "PRISE_EN_COMPTE" && (
                      <button
                        onClick={() => handleStatusChange(alert.alert_id, "UNITES_DEPLOYEES")}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{t("deploy_mobile_column")}</span>
                      </button>
                    )}

                    {alert.status === "UNITES_DEPLOYEES" && (
                      <button
                        onClick={() => handleStatusChange(alert.alert_id, "MAITRISE")}
                        className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>{t("declare_controlled")}</span>
                      </button>
                    )}

                    {alert.status === "MAITRISE" && (
                      <button
                        onClick={() => handleStatusChange(alert.alert_id, "ETEINT")}
                        className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
                      >
                        {t("close_extinguished")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Full Audit & History Modal */}
      {modalAlert && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setModalAlert(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    <HistoryIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>{modalAlert.alert_id}</span>
                  </span>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {modalAlert.wilaya}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {t("audit_history_modal_title") || "Operational Intervention Audit Log"}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-300 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{getLocalizedAuditNote(modalAlert.forest_name, language)}</span>
                  </span>
                  <span>•</span>
                  <span className="font-mono text-[11px] text-slate-400" dir="ltr">
                    GPS: {modalAlert.lat}°N, {modalAlert.lon}°E
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setModalAlert(null)} 
                className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-colors shrink-0"
                aria-label={t("close_modal") || "Close"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Modern Timeline */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {modalHistory.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    <HistoryIcon className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {t("no_history_available") || "No intervention events recorded yet."}
                  </div>
                </div>
              ) : (
                <div className="relative border-l-2 rtl:border-l-0 rtl:border-r-2 border-slate-700/70 ml-3.5 rtl:ml-0 rtl:mr-3.5 space-y-6 py-1">
                  {modalHistory.map((h, idx) => {
                    const isAi = h.changed_by?.includes("IA") || h.changed_by?.includes("XGBoost") || h.changed_by?.includes("Système IA");
                    const isCommander = h.changed_by?.includes("Commandant") || h.changed_by?.includes("Protection");
                    const isField = h.changed_by?.includes("Garde") || h.changed_by?.includes("Forêt") || h.changed_by?.includes("Inspecteur");

                    const nodeColor = isAi 
                      ? "bg-violet-950 border-violet-500 text-violet-400" 
                      : isCommander
                      ? "bg-red-950 border-red-500 text-red-400"
                      : isField
                      ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                      : "bg-amber-950 border-amber-500 text-amber-400";

                    return (
                      <div key={h.id || idx} className="relative pl-6 rtl:pl-0 rtl:pr-6 group">
                        {/* Timeline Node Icon */}
                        <div className={`absolute -left-[17px] rtl:-left-auto rtl:-right-[17px] top-1.5 w-8 h-8 rounded-full border-2 ${nodeColor} flex items-center justify-center shadow-lg bg-slate-950`}>
                          {isAi ? (
                            <Cpu className="w-3.5 h-3.5" />
                          ) : isCommander ? (
                            <Truck className="w-3.5 h-3.5" />
                          ) : isField ? (
                            <Shield className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 hover:border-slate-700 transition-colors p-3.5 space-y-2.5">
                          {/* Top Row: Transition Pills & Timestamp */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono text-[11px]">
                                {getLocalizedStatusName(h.old_status, language)}
                              </span>
                              <span className="text-slate-500 font-bold">→</span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-mono text-[11px] font-bold">
                                {getLocalizedStatusName(h.new_status, language)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>
                                {new Date(h.changed_at).toLocaleString(language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit"
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Operator Row */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400 font-medium">
                              {t("intervenant_label") || (language === "ar" ? "المتدخل / الرتبة :" : "Operator / Rank:")}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-semibold text-[11px]">
                              {getLocalizedOperatorName(h.changed_by, language)}
                            </span>
                          </div>

                          {/* Note Callout */}
                          <div className="rounded-lg border-l-2 rtl:border-l-0 rtl:border-r-2 border-emerald-500/80 bg-slate-900/90 px-3 py-2 text-xs text-slate-200 leading-relaxed font-sans shadow-sm">
                            {getLocalizedAuditNote(h.note, language)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-mono">
                {modalHistory.length} {language === "ar" ? "إجراءات موثقة بالسجل العملياتي" : language === "en" ? "verified actions in operational log" : "actions vérifiées dans le registre"}
              </span>
              <button
                onClick={() => setModalAlert(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition border border-slate-700/80 shadow-sm"
              >
                {t("close_modal") || (language === "ar" ? "إغلاق" : "Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency SMS Broadcast Modal (Roadmap Phase 2 capability) */}
      {smsModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {t("sms_modal_title")} : {smsModalAlert.alert_id}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {smsModalAlert.forest_name} ({smsModalAlert.wilaya}) · {t("cell_broadcast_networks")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSmsModalAlert(null);
                  setSmsResult(null);
                  setSmsError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchSMS} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">{t("target_sector")}</span>
                  <span className="text-white font-bold">{smsModalAlert.forest_name} ({smsModalAlert.wilaya})</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">{t("ai_risk_index")}</span>
                  <span className="text-red-400 font-bold">{smsModalAlert.risk_score}% ({smsModalAlert.risk_level})</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t("broadcast_radius")} {smsRadius} km
                </label>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={smsRadius}
                  onChange={(e) => setSmsRadius(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>{t("radius_immediate")}</span>
                  <span className="text-red-400 font-bold">{smsRadius} km</span>
                  <span>{t("radius_full")}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t("sms_content_label")}
                </label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500 font-mono text-[11px]"
                />
              </div>

              {smsResult && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs space-y-1 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{t("sms_broadcast_success")} ({smsResult.broadcast_id})</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    {t("sms_recipients_alerted")} <span className="text-white font-bold">{smsResult.recipients_count}</span> {t("sms_riverains_in_radius")} {smsResult.radius_km} km.
                  </div>
                </div>
              )}

              {smsError && (
                <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{smsError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">
                  {t("official_protocol_note")}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSmsModalAlert(null);
                      setSmsResult(null);
                      setSmsError(null);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    {t("close_modal")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingSMS || !smsMessage.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50 shadow-md shadow-red-950/40"
                  >
                    {isSendingSMS ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{t("broadcast_now_btn")}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Language Selection Modal */}
      <PdfLanguageModal
        isOpen={!!selectedAlertForPdf}
        onClose={() => setSelectedAlertForPdf(null)}
        onConfirm={(chosenLang: Language) => {
          if (!selectedAlertForPdf) return;
          window.open(getAlertReportDownloadUrl(selectedAlertForPdf.alert_id, chosenLang), "_blank");
          setSelectedAlertForPdf(null);
        }}
        documentTitle={
          selectedAlertForPdf
            ? `${selectedAlertForPdf.forest_name} (${selectedAlertForPdf.wilaya}) — ${selectedAlertForPdf.alert_id}`
            : undefined
        }
      />
    </div>
  );
}
