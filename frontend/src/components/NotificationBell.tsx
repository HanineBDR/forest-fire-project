"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Radio, ArrowRight, ShieldAlert, Send } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { ROLE_LABELS } from "@/lib/notifications";

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    activeRole,
    setActiveRole,
    isConnected,
    connectionType,
    markAsRead,
    markAllAsRead,
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

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Notifications (${unreadCount} non lues)`}
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg border text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
          isOpen
            ? "bg-slate-800 border-slate-700 text-white"
            : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80"
        }`}
      >
        <Bell className="w-4 h-4 text-slate-300" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full border border-slate-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Centre de notifications"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.06)] z-[2000] overflow-hidden"
        >
          {/* Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white tracking-tight">
                  Notifications Opérationnelles
                </h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-300">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span>{connectionType.toUpperCase()}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Rôle: {ROLE_LABELS[activeRole] || activeRole}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-1.5 py-1 rounded hover:bg-slate-800"
              >
                <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Tout lire</span>
              </button>
            )}
          </div>

          {/* Quick Role Switcher */}
          <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 shrink-0">Vue:</span>
            {[
              { id: "protection_civile", label: "Protection Civile" },
              { id: "mohafadat_ghabat", label: "Forêts" },
              { id: "admin_centrale", label: "Admin" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRole(r.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  activeRole === r.id
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Aucune alerte opérationnelle récente.
              </div>
            ) : (
              notifications.slice(0, 8).map((notif) => {
                const isUnread = !notif.is_read;
                const senderName = ROLE_LABELS[notif.sender_role] || notif.sender_role;

                return (
                  <div
                    key={notif.id}
                    className={`p-3 text-xs transition-colors hover:bg-slate-800/50 ${
                      isUnread ? "bg-slate-800/25" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-200 leading-snug">
                            {notif.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-400">
                          <span>Émetteur: {senderName}</span>
                          <span>•</span>
                          <span>{new Date(notif.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notif.id)}
                          title="Marquer comme lu"
                          className="shrink-0 p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white flex items-center gap-1.5 font-medium transition-colors p-1"
            >
              <span>Centre d'alertes & intercom</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <span className="text-[10px] text-slate-400">58 wilayas connectées</span>
          </div>
        </div>
      )}
    </div>
  );
}

