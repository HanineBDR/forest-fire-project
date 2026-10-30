"use client";

import React, { useState } from "react";
import { Send, Shield, AlertTriangle, Radio, X } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { ROLE_LABELS } from "@/lib/notificationTypes";
import { useLanguage } from "@/context/LanguageContext";

interface PanelIntercomModalProps {
  initialMassif?: string;
  initialWilaya?: string;
  initialAlertId?: string;
  buttonClassName?: string;
  buttonLabel?: string;
}

export function PanelIntercomModal({
  initialMassif = "Massif de Yakouren",
  initialWilaya = "Tizi Ouzou",
  initialAlertId,
  buttonClassName,
  buttonLabel,
}: PanelIntercomModalProps) {
  const { t } = useLanguage();
  const { activeRole, alertPanel } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<string>("protection_civile");
  const [massif, setMassif] = useState(initialMassif);
  const [wilaya, setWilaya] = useState(initialWilaya);
  const [urgency, setUrgency] = useState<string>("critical");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const riskScore = urgency === "critical" ? 90.0 : urgency === "high" ? 75.0 : 50.0;
      const riskLevel = urgency === "critical" ? "Très Elevé" : urgency === "high" ? "Elevé" : "Modéré";

      const ok = await alertPanel({
        from_role: activeRole,
        to_role: targetRole,
        alert_id: initialAlertId,
        message: message.trim(),
        massif,
        wilaya,
        risk_level: riskLevel,
        risk_score: riskScore,
      });

      if (ok) {
        setSuccessNotice(t("intercom_success"));
        setTimeout(() => {
          setSuccessNotice(null);
          setIsOpen(false);
          setMessage("");
        }, 1500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveButtonLabel = buttonLabel || t("intercom_alert_panel");

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          buttonClassName ||
          "flex items-center gap-2 h-9 px-3.5 bg-red-600 hover:bg-red-500 border border-red-500 rounded-lg text-xs font-semibold text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        }
      >
        <Radio className="w-4 h-4 text-white" aria-hidden="true" />
        <span>{effectiveButtonLabel}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("intercom_modal_aria")}
          className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-400" aria-hidden="true" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {t("intercom_modal_title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t("close")}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Emitter Role */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {t("intercom_emitter")}
                  </label>
                  <div className="h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-lg flex items-center text-slate-200">
                    {ROLE_LABELS[activeRole] || activeRole}
                  </div>
                </div>

                {/* Target Role */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {t("intercom_target")}
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full h-9 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <option value="protection_civile">{t("role_protection_civile")}</option>
                    <option value="mohafadat_ghabat">{t("role_dgf")}</option>
                    <option value="admin_centrale">{t("role_admin_centrale")}</option>
                    <option value="all">{t("role_all_broadcast")}</option>
                  </select>
                </div>
              </div>

              {/* Massif and Wilaya */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t("intercom_massif")}</label>
                  <input
                    type="text"
                    value={massif}
                    onChange={(e) => setMassif(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    placeholder="ex. Massif de Yakouren"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t("intercom_wilaya")}</label>
                  <input
                    type="text"
                    value={wilaya}
                    onChange={(e) => setWilaya(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    placeholder="ex. Tizi Ouzou"
                    required
                  />
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("intercom_urgency")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "moderate", label: t("intercom_urgency_moderate") },
                    { key: "high", label: t("intercom_urgency_high") },
                    { key: "critical", label: t("intercom_urgency_critical") },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setUrgency(key)}
                      className={`h-8 rounded-lg border text-xs font-semibold transition-colors ${
                        urgency === key
                          ? "bg-red-600 border-red-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {t("intercom_message_label")}
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("intercom_message_placeholder")}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 leading-relaxed"
                  required
                />
              </div>

              {successNotice && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs">
                  {successNotice}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-9 px-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="flex items-center gap-2 h-9 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 border border-red-500 rounded-lg text-white font-semibold transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? t("intercom_transmitting") : t("intercom_send")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
