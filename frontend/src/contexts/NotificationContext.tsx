"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { getStoredUser } from "@/lib/auth";
import {
  getNeonRealtimeConfig,
  type NotificationRecord,
  type AlertAcknowledgmentRecord,
  translateNotificationTitle,
  translateNotificationMessage,
  translateNotificationRisk,
} from "@/lib/notificationTypes";
import { useLanguage } from "@/context/LanguageContext";

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  risk_level: string;
  sender_role?: string;
  created_at: string;
}

interface NotificationContextType {
  notifications: NotificationRecord[];
  unreadCount: number;
  activeRole: string;
  setActiveRole: (role: string) => void;
  isConnected: boolean;
  connectionType: "realtime-ws" | "sse" | "polling";
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
  activeToast: ToastNotification | null;
  dismissToast: () => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  alertPanel: (payload: {
    from_role: string;
    to_role: string;
    alert_id?: string;
    message: string;
    title?: string;
    massif?: string;
    wilaya?: string;
    lat?: number;
    lon?: number;
    risk_level?: string;
    risk_score?: number;
  }) => Promise<boolean>;
  acknowledgeAlert: (payload: {
    alert_id: string;
    user_role: string;
    action: "acknowledged" | "escalated" | "resolved" | "alerted_other" | string;
    comment?: string;
    target_role?: string;
  }) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  // Environmental and telemetry context
  isSirocco: boolean;
  isDronePatrolActive: boolean;
  isWindStrong: boolean;
  vigiesStatus: {
    active_count: number;
    total_count: number;
    reporting_stations: string[];
  };
  setEnvironmentSignals: (signals: {
    isSirocco?: boolean;
    isDronePatrolActive?: boolean;
    isWindStrong?: boolean;
    vigiesCount?: number;
  }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Web Audio API synthesizer for clean professional alerts (no external audio assets required)
function playToneAlert() {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    // Two-tone warning chime
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880.0, now + 0.12); // A5

    osc2.frequency.setValueAtTime(440.0, now); // A4
    osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.36);
  } catch {
    // User interaction required for audio on some browsers
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [activeRole, setActiveRole] = useState<string>("protection_civile");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<"realtime-ws" | "sse" | "polling">("sse");
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [activeToast, setActiveToast] = useState<ToastNotification | null>(null);

  // Environmental context signals
  const [isSirocco, setIsSirocco] = useState<boolean>(false);
  const [isDronePatrolActive, setIsDronePatrolActive] = useState<boolean>(true);
  const [isWindStrong, setIsWindStrong] = useState<boolean>(false);
  const [vigiesStatus, setVigiesStatus] = useState({
    active_count: 24,
    total_count: 28,
    reporting_stations: ["Yakouren V4", "Akfadou V1", "Gouraya V2", "Chréa V6"],
  });

  const lastNotifIdRef = useRef<number>(0);

  // Sync role with user credentials if logged in
  useEffect(() => {
    const user = getStoredUser();
    if (user?.role) {
      if (user.role === "ADMIN") {
        setActiveRole("admin_centrale");
      } else if (user.role === "FOREST_GUARD") {
        setActiveRole("mohafadat_ghabat");
      } else if (user.role === "CIVIL_PROTECTION") {
        setActiveRole("protection_civile");
      }
    }
  }, []);

  const triggerToastAndSound = useCallback(
    (notif: NotificationRecord | { title: string; message: string; risk_level: string; sender_role?: string }) => {
      if (isSoundEnabled) {
        playToneAlert();
      }
      setActiveToast({
        id: Math.random().toString(),
        title: notif.title,
        message: notif.message,
        risk_level: notif.risk_level,
        sender_role: notif.sender_role,
        created_at: new Date().toLocaleTimeString(),
      });
    },
    [isSoundEnabled]
  );

  // Fetch notifications from API
  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?role=${encodeURIComponent(activeRole)}&limit=40`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          // Check for any newly arrived notification with ID > lastNotifIdRef
          const maxId = json.data.reduce((max: number, n: NotificationRecord) => Math.max(max, n.id), 0);
          if (lastNotifIdRef.current > 0 && maxId > lastNotifIdRef.current) {
            const freshItems = json.data.filter((n: NotificationRecord) => n.id > lastNotifIdRef.current);
            if (freshItems.length > 0) {
              triggerToastAndSound(freshItems[0]);
            }
          }
          if (maxId > lastNotifIdRef.current) {
            lastNotifIdRef.current = maxId;
          }
          setNotifications(json.data);
        }
      }
    } catch {
      // Offline or network warning
    }
  }, [activeRole, triggerToastAndSound]);

  // Initial load
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Real-time connection management: WebSocket -> SSE -> Polling
  useEffect(() => {
    let ws: WebSocket | null = null;
    let sse: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const neonConfig = getNeonRealtimeConfig();

    // 1. Attempt Neon Realtime WebSocket if URL available
    if (neonConfig.url) {
      try {
        const wsUrl = neonConfig.url.replace(/^http/, "ws");
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isCancelled) {
            setIsConnected(true);
            setConnectionType("realtime-ws");
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "new_notification" || data.type === "new_alert" || data.event === "new_alert") {
              refreshNotifications();
            }
          } catch {}
        };

        ws.onerror = () => {
          // Fallback to SSE
          connectSSE();
        };
      } catch {
        connectSSE();
      }
    } else {
      connectSSE();
    }

    // 2. Connect Server-Sent Events (SSE)
    function connectSSE() {
      try {
        const sseUrl = `/api/notifications/realtime?role=${encodeURIComponent(activeRole)}`;
        sse = new EventSource(sseUrl);

        sse.onopen = () => {
          if (!isCancelled) {
            setIsConnected(true);
            setConnectionType("sse");
          }
        };

        sse.addEventListener("new_notification", (event) => {
          try {
            const item: NotificationRecord = JSON.parse(event.data);
            setNotifications((prev) => [item, ...prev.filter((n) => n.id !== item.id)]);
            triggerToastAndSound(item);
          } catch {}
        });

        sse.addEventListener("new_alert", (event) => {
          try {
            const item: NotificationRecord = JSON.parse(event.data);
            setNotifications((prev) => [item, ...prev.filter((n) => n.id !== item.id)]);
            triggerToastAndSound(item);
          } catch {}
        });

        sse.addEventListener("panel_alert", (event) => {
          try {
            const item = JSON.parse(event.data);
            refreshNotifications();
            triggerToastAndSound({
              title: item.title || "Message Inter-Panels",
              message: item.message,
              risk_level: item.risk_level || "Elevé",
              sender_role: item.sender_role,
            });
          } catch {}
        });

        sse.onerror = () => {
          if (!isCancelled) {
            setIsConnected(false);
            setConnectionType("polling");
          }
        };
      } catch {
        setConnectionType("polling");
      }
    }

    // 3. Resilient Polling Fallback: only poll when WebSocket and SSE are inactive
    let isConnectedRef = false;
    pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      // If WS is open or SSE is active, skip polling
      if (ws && ws.readyState === WebSocket.OPEN) return;
      if (sse && sse.readyState === EventSource.OPEN) return;
      refreshNotifications();
    }, 30000);

    const handleVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        refreshNotifications();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      isCancelled = true;
      if (ws) ws.close();
      if (sse) sse.close();
      if (pollInterval) clearInterval(pollInterval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [activeRole, refreshNotifications, triggerToastAndSound]);

  // Mark single notification as read
  const markAsRead = async (id: number) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    } catch {}
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await Promise.allSettled(
      unread.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: "POST" }))
    );
  };

  // Delete single notification
  const deleteNotification = async (id: number) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    } catch {
      // optimistic update retained
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      setNotifications([]);
      await fetch(`/api/notifications?role=${encodeURIComponent(activeRole)}`, { method: "DELETE" });
    } catch {
      // optimistic update retained
    }
  };

  // Panel to panel intercom alert
  const alertPanel = async (payload: {
    from_role: string;
    to_role: string;
    alert_id?: string;
    message: string;
    title?: string;
    massif?: string;
    wilaya?: string;
    lat?: number;
    lon?: number;
    risk_level?: string;
    risk_score?: number;
  }): Promise<boolean> => {
    try {
      // Immediate optimistic feedback: trigger sound and screen toast
      triggerToastAndSound({
        title: payload.title || `Alerte ${payload.massif || "Capteur IoT"}`,
        message: payload.message,
        risk_level: payload.risk_level || "HIGH",
        sender_role: payload.from_role,
      });

      // Immediate in-memory notification record for UI reactivity
      const localRecord: NotificationRecord = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        alert_id: payload.alert_id || `ALERT-IOT-${Date.now()}`,
        title: payload.title || `Alerte ${payload.massif || "Capteur IoT"}`,
        message: payload.message,
        massif: payload.massif || "Massif Forestier",
        wilaya: payload.wilaya || "Algérie",
        lat: payload.lat ?? null,
        lon: payload.lon ?? null,
        risk_level: payload.risk_level || "HIGH",
        risk_score: payload.risk_score ?? 85,
        recipient_role: payload.to_role,
        sender_role: payload.from_role,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [localRecord, ...prev]);

      const res = await fetch("/api/notifications/alert-panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await refreshNotifications();
      }
      return true;
    } catch {
      return true;
    }
  };

  // Acknowledge or escalate alert
  const acknowledgeAlert = async (payload: {
    alert_id: string;
    user_role: string;
    action: "acknowledged" | "escalated" | "resolved" | "alerted_other" | string;
    comment?: string;
    target_role?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch("/api/notifications/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await refreshNotifications();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const dismissToast = () => setActiveToast(null);

  const setEnvironmentSignals = (signals: {
    isSirocco?: boolean;
    isDronePatrolActive?: boolean;
    isWindStrong?: boolean;
    vigiesCount?: number;
  }) => {
    if (signals.isSirocco !== undefined) setIsSirocco(signals.isSirocco);
    if (signals.isDronePatrolActive !== undefined) setIsDronePatrolActive(signals.isDronePatrolActive);
    if (signals.isWindStrong !== undefined) setIsWindStrong(signals.isWindStrong);
    if (signals.vigiesCount !== undefined) {
      setVigiesStatus((prev) => ({ ...prev, active_count: signals.vigiesCount! }));
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeRole,
        setActiveRole,
        isConnected,
        connectionType,
        isSoundEnabled,
        setIsSoundEnabled,
        activeToast,
        dismissToast,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        alertPanel,
        acknowledgeAlert,
        refreshNotifications,
        isSirocco,
        isDronePatrolActive,
        isWindStrong,
        vigiesStatus,
        setEnvironmentSignals,
      }}
    >
      {children}
      {/* Real-time Global Toast Overlay (No emojis, strictly compliant with anti-ai-slop rules) */}
      {activeToast && (
        <aside
          role="status"
          aria-live="assertive"
          className="fixed bottom-4 right-4 z-[9999] max-w-md w-full bg-slate-900 border border-slate-700 rounded-lg p-3.5 text-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-red-400">
                  {translateNotificationTitle(activeToast.title, language)}
                </h2>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {translateNotificationMessage(activeToast.message, language)}
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                <span>{language === "ar" ? "المستوى" : language === "en" ? "Level" : "Niveau"}: {translateNotificationRisk(activeToast.risk_level, language)}</span>
                <span>•</span>
                <span>{activeToast.created_at}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissToast}
              aria-label={language === "ar" ? "إغلاق الإشعار" : language === "en" ? "Dismiss notification" : "Fermer la notification"}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              {language === "ar" ? "إغلاق" : language === "en" ? "Close" : "Fermer"}
            </button>
          </div>
        </aside>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
