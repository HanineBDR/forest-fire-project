"use client";

import React, { useState } from "react";
import { Send, Shield, AlertTriangle, Radio, X, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { ROLE_LABELS } from "@/lib/notificationTypes";
import { useLanguage } from "@/context/LanguageContext";
import { sendEmailReport } from "@/lib/api";

interface PanelIntercomModalProps {
  initialMassif?: string;
  initialWilaya?: string;
  initialAlertId?: string;
  buttonClassName?: string;
  buttonLabel?: string;
}

const PREDEFINED_CONTACTS = [
  { label: "CODIS 15 (Protection Civile)", email: "codis15@protectioncivile.dz" },
  { label: "DGF Conservation (Kabylie)", email: "dgf.tizi@dgf.gov.dz" },
  { label: "Centre de Crise (Intérieur)", email: "crise@interieur.gov.dz" },
];

export function PanelIntercomModal({
  initialMassif = "Massif de Yakouren",
  initialWilaya = "Tizi Ouzou",
  initialAlertId,
  buttonClassName,
  buttonLabel,
}: PanelIntercomModalProps) {
  const { t, language } = useLanguage();
  const { activeRole, alertPanel } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<string>("protection_civile");
  const [massif, setMassif] = useState(initialMassif);
  const [wilaya, setWilaya] = useState(initialWilaya);
  const [urgency, setUrgency] = useState<string>("critical");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email Reporting additions
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!message.trim()) return;

    // Validate email if option is enabled
    if (sendViaEmail) {
      const emailClean = recipientEmail.trim().toLowerCase();
      const emailRegex = /^[\w\.\+\-]+@[\w\.\-]+\.[a-zA-Z]{2,}$/;
      if (!emailClean || !emailRegex.test(emailClean)) {
        setErrorMessage(
          t("intercom_err_invalid_email") || 
          "Format d'adresse e-mail invalide. Exemple: codis15@protectioncivile.dz"
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const riskScore = urgency === "critical" ? 90.0 : urgency === "high" ? 75.0 : 50.0;
      const riskLevel = urgency === "critical" ? "Très Elevé" : urgency === "high" ? "Elevé" : "Modéré";

      // 1. Dispatch standard inter-panel real-time notification
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

      // 2. Dispatch Email Incident Report if selected
      let emailDispatched = false;
      if (sendViaEmail && recipientEmail.trim()) {
        try {
          await sendEmailReport({
            recipient_email: recipientEmail.trim().toLowerCase(),
            alert_id: initialAlertId,
            forest_name: massif,
            wilaya: wilaya,
            severity: urgency.toUpperCase(),
            risk_score: riskScore,
            message: message.trim(),
            sender_role: activeRole,
          });
          emailDispatched = true;
        } catch (emailErr: any) {
          console.warn("Could not dispatch email report:", emailErr);
          // Show non-blocking warning if internal real-time succeeded
          if (!ok) {
            throw new Error(emailErr.message || "Failed to send email report");
          }
        }
      }

      if (ok || emailDispatched) {
        const successText = emailDispatched
          ? (t("intercom_success_with_email") || "Alerte diffusée et rapport e-mail transmis avec succès.")
          : (t("intercom_success") || "Message opérationnel diffusé en temps réel.");
        setSuccessNotice(successText);
        setTimeout(() => {
          setSuccessNotice(null);
          setIsOpen(false);
          setMessage("");
          setRecipientEmail("");
          setSendViaEmail(false);
        }, 1800);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la transmission de l'alerte.");
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
          "flex items-center gap-2 h-9 px-3.5 bg-red-600 hover:bg-red-500 border border-red-500 rounded-lg text-xs font-semibold text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shadow-md shadow-red-950/40"
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
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
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
              {errorMessage && (
                <div className="p-2.5 bg-red-950/80 border border-red-800 rounded-lg text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

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
                          ? "bg-red-600 border-red-500 text-white shadow-sm"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message - Bug Fix: Uses intercom_message_label properly */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {t("intercom_message_label") || "Message"}
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

              {/* Email Incident Reporting Option */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sendViaEmail}
                    onChange={(e) => setSendViaEmail(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500 accent-red-600"
                  />
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t("intercom_email_option_label") || "Send Official Report via Email"}</span>
                  </div>
                </label>

                {sendViaEmail && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                    <div className="space-y-1">
                      <label className="block text-[11px] text-slate-400">
                        {t("intercom_email_recipient_label") || "Recipient Authority Email"}
                      </label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="officier@protectioncivile.dz"
                        required={sendViaEmail}
                        className="w-full h-8 px-2.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 font-mono"
                      />
                    </div>

                    {/* Predefined agency contacts quick-select */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                        {t("intercom_agency_presets_label") || "Agency Command Mailboxes:"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PREDEFINED_CONTACTS.map((c) => (
                          <button
                            key={c.email}
                            type="button"
                            onClick={() => setRecipientEmail(c.email)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                              recipientEmail === c.email
                                ? "bg-blue-950 text-blue-300 border-blue-700 font-semibold"
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                            }`}
                          >
                            {c.label.split(" ")[0]} ({c.email.split("@")[0]})
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {successNotice && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successNotice}</span>
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
                  className="flex items-center gap-2 h-9 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 border border-red-500 rounded-lg text-white font-semibold transition-colors shadow-md shadow-red-950/40"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
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
