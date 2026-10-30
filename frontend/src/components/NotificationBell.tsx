"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Bell, 
  CheckCheck, 
  Radio, 
  ArrowRight, 
  ShieldAlert, 
  Flame, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Wind, 
  Compass, 
  Cpu, 
  Check, 
  Inbox, 
  Maximize2,
  Trash2
} from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  ROLE_LABELS,
  getLocalizedRole,
  translateNotificationTitle,
  translateNotificationMessage,
} from "@/lib/notificationTypes";
import { useLanguage } from "@/context/LanguageContext";
import { Tooltip } from "@/components/Tooltip";

// Helper to extract telemetry chips from raw notification messages to prevent RTL text corruption
interface TelemetryTags {
  gps?: string;
  wind?: string;
  area?: string;
  altitude?: string;
  rate?: string;
  cleanText: string;
}

function parseNotificationTelemetry(rawMsg: string): TelemetryTags {
  if (!rawMsg) return { cleanText: "" };
  let clean = rawMsg;
  const tags: TelemetryTags = { cleanText: "" };

  // 1. Extract GPS Coordinates
  const gpsRegex = /(?:GPS\s*[:\s]*)?\(?([NnSs]?\s*[\d.]+\s*[°]?[,\s]+[EeWw]?\s*[\d.]+\s*[°]?)\)?/i;
  const gpsMatch = clean.match(gpsRegex);
  if (gpsMatch && (gpsMatch[0].includes("N") || gpsMatch[0].includes("E") || gpsMatch[0].includes(","))) {
    tags.gps = gpsMatch[0].replace(/[()]/g, "").trim();
    clean = clean.replace(gpsMatch[0], "").trim();
  }

  // 2. Extract Wind
  const windRegex = /(?:رياح|Vent|Wind)?\s*(\d+(?:\.\d+)?\s*(?:km\/h|كم\/س)(?:\s*\([^)]+\))?)/i;
  const windMatch = clean.match(windRegex);
  if (windMatch) {
    tags.wind = windMatch[1].trim();
    clean = clean.replace(windMatch[0], "").trim();
  }

  // 3. Extract Area
  const areaRegex = /(?:المساحة|Surface|Area)?\s*[:\s]*(\d+(?:\.\d+)?\s*(?:هكتار|ha|hectares?))/i;
  const areaMatch = clean.match(areaRegex);
  if (areaMatch) {
    tags.area = areaMatch[1].trim();
    clean = clean.replace(areaMatch[0], "").trim();
  }

  // 4. Extract Altitude
  const altRegex = /\(?(?:ارتفاع|Altitude|Alt)?\s*[:\s]*(\d+\s*m)\)?/i;
  const altMatch = clean.match(altRegex);
  if (altMatch) {
    tags.altitude = altMatch[1].trim();
    clean = clean.replace(altMatch[0], "").trim();
  }

  // Clean trailing punctuation and multiple spaces
  clean = clean.replace(/^[:\s,.-]+|[:\s,.-]+$/g, "").replace(/\s{2,}/g, " ");
  tags.cleanText = clean || rawMsg;
  return tags;
}

export function NotificationBell() {
  const { t, language, isRTL } = useLanguage();
  const {
    notifications,
    unreadCount,
    activeRole,
    setActiveRole,
    isConnected,
    connectionType,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getLocalizedRoleLabel = (rId: string) => {
    return getLocalizedRole(rId, language);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <Tooltip content={t("tooltip_notification_bell")} position="bottom">
        <button
          type="button"
          id="notification-bell-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label={`${t("notif_center_title")} (${unreadCount})`}
          className={`relative flex items-center justify-center w-9 h-9 rounded-xl border text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
            isOpen
              ? "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white shadow-md"
              : "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
          }`}
        >
          <Bell className="w-4 h-4 text-slate-300" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full border-2 border-slate-950 shadow-sm animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </Tooltip>

      {isOpen && (
        <div
          role="dialog"
          aria-label={t("notif_center_title")}
          className="absolute end-0 mt-2.5 w-[calc(100vw-28px)] sm:w-[430px] max-w-[430px] bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl shadow-black/30 dark:shadow-black/80 z-[2200] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {t("notif_operational_title") || "Operational Notifications"}
                </h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  <span>{connectionType.toUpperCase()}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 shrink-0"
                  title={t("notif_mark_all_read") || "Mark all as read"}
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t("notif_mark_all_read") || (language === "ar" ? "قراءة الكل" : "Mark read")}</span>
                </button>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">
                  {language === "ar" ? "كل التنبيهات مقروءة" : language === "en" ? "All read" : "À jour"}
                </span>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="text-[11px] font-semibold text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-rose-950/40 border border-transparent hover:border-rose-900/60 shrink-0"
                  title={t("notif_clear_all") || "Clear all notifications"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t("notif_clear_all") || (language === "ar" ? "مسح الكل" : "Clear all")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Role View Filter */}
          <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-slate-400 font-medium shrink-0">
              {t("notif_view_label") || (language === "ar" ? "العرض:" : "View:")}
            </span>
            <div className="flex items-center gap-1">
              {[
                { id: "protection_civile", label: getLocalizedRoleLabel("protection_civile") },
                { id: "mohafadat_ghabat", label: getLocalizedRoleLabel("mohafadat_ghabat") },
                { id: "admin_centrale", label: getLocalizedRoleLabel("admin_centrale") },
              ].map((r) => {
                const isActive = activeRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveRole(r.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all shrink-0 ${
                      isActive
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-2">
            {notifications.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                  <Inbox className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {t("notif_empty_label") || "No operational notifications."}
                </div>
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => {
                const isUnread = !notif.is_read;
                const senderName = getLocalizedRoleLabel(notif.sender_role);
                const translatedTitle = translateNotificationTitle(notif.title, language);
                const translatedMsg = translateNotificationMessage(notif.message, language);
                const telemetry = parseNotificationTelemetry(translatedMsg);

                const isFire = notif.title?.includes("INCENDIE") || notif.title?.includes("FIRE") || notif.title?.includes("حريق");
                const isUrgent = notif.title?.includes("URGENT") || notif.title?.includes("ÉVACUATION") || notif.title?.includes("إخلاء");
                const isWarning = notif.title?.includes("Risque") || notif.title?.includes("Risk") || notif.title?.includes("خطر");

                const borderAccent = isFire
                  ? "border-l-4 rtl:border-l-0 rtl:border-r-4 border-red-500 bg-red-950/20"
                  : isUrgent
                  ? "border-l-4 rtl:border-l-0 rtl:border-r-4 border-amber-500 bg-amber-950/20"
                  : isWarning
                  ? "border-l-4 rtl:border-l-0 rtl:border-r-4 border-amber-600/70 bg-slate-900/90"
                  : "border-l-4 rtl:border-l-0 rtl:border-r-4 border-slate-700 bg-slate-900/60";

                return (
                  <div
                    key={notif.id}
                    className={`rounded-xl border border-slate-200 dark:border-slate-800/80 ${borderAccent} p-3 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 space-y-2`}
                  >
                    {/* Card Top: Category Icon + Title + Action */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-slate-800 text-slate-300 mt-0.5 shrink-0">
                          {isFire ? (
                            <Flame className="w-3.5 h-3.5 text-red-400" />
                          ) : isUrgent ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Radio className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug truncate">
                            {translatedTitle}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            title={t("notif_mark_read") || "Mark as read"}
                            className="p-1 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          title={t("notif_delete") || "Delete notification"}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Card Body: Clean narrative text */}
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {telemetry.cleanText}
                    </p>

                    {/* Telemetry Chips (Prevents RTL/LTR Decimals Inversion) */}
                    {(telemetry.gps || telemetry.wind || telemetry.area || telemetry.altitude) && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {telemetry.gps && (
                          <span 
                            dir="ltr"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-cyan-300"
                          >
                            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>{telemetry.gps}</span>
                          </span>
                        )}
                        {telemetry.wind && (
                          <span 
                            dir="ltr"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-amber-300"
                          >
                            <Wind className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{telemetry.wind}</span>
                          </span>
                        )}
                        {telemetry.area && (
                          <span 
                            dir="ltr"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-rose-300"
                          >
                            <Flame className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>{telemetry.area}</span>
                          </span>
                        )}
                        {telemetry.altitude && (
                          <span 
                            dir="ltr"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-slate-300"
                          >
                            <span>⛰️ {telemetry.altitude}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Footer: Sender & Time */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                      <span className="truncate max-w-[220px]">
                        {senderName}
                      </span>
                      <span className="font-mono text-slate-500 shrink-0">
                        {new Date(notif.created_at).toLocaleTimeString(language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 font-semibold transition-all border border-slate-200 dark:border-slate-700/70 shadow-sm"
            >
              <span>{t("nav_intercom_alerts") || "Open Full Intercom"}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <span className="text-[10px] text-slate-400 font-mono">
              58 {language === "ar" ? "ولاية متصلة بالشبكة" : language === "en" ? "wilayas connected" : "wilayas connectées"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
