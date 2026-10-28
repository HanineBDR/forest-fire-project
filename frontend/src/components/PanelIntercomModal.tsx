"use client";

import React, { useState } from "react";
import { Send, Shield, AlertTriangle, Radio, X } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { ROLE_LABELS } from "@/lib/notifications";

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
  buttonLabel = "Alerter autre panel",
}: PanelIntercomModalProps) {
  const { activeRole, alertPanel } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<string>("protection_civile");
  const [massif, setMassif] = useState(initialMassif);
  const [wilaya, setWilaya] = useState(initialWilaya);
  const [urgency, setUrgency] = useState<string>("Très Elevé");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const ok = await alertPanel({
        from_role: activeRole,
        to_role: targetRole,
        alert_id: initialAlertId,
        message: message.trim(),
        massif,
        wilaya,
        risk_level: urgency,
        risk_score: urgency === "Très Elevé" ? 90.0 : 75.0,
      });

      if (ok) {
        setSuccessNotice("Message opérationnel transmis en temps réel.");
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
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Alerter un autre commandement opérationnel"
          className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-400" aria-hidden="true" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Intercom Opérationnel National
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer"
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
                    Émetteur (Votre rôle)
                  </label>
                  <div className="h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-lg flex items-center text-slate-200">
                    {ROLE_LABELS[activeRole] || activeRole}
                  </div>
                </div>

                {/* Target Role */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Destinataire ciblé
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full h-9 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <option value="protection_civile">Protection Civile (CODIS)</option>
                    <option value="mohafadat_ghabat">Conservation des Forêts (DGF)</option>
                    <option value="admin_centrale">Administration Centrale</option>
                    <option value="all">Tous les Commandements (Diffusion générale)</option>
                  </select>
                </div>
              </div>

              {/* Massif and Wilaya */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Massif forestier</label>
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
                  <label className="block text-slate-400 font-medium mb-1">Wilaya</label>
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
                <label className="block text-slate-400 font-medium mb-1">Niveau d'urgence</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Modéré", "Elevé", "Très Elevé"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setUrgency(lvl)}
                      className={`h-8 rounded-lg border text-xs font-semibold transition-colors ${
                        urgency === lvl
                          ? "bg-red-600 border-red-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Message ou signalement opérationnel
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="ex. Départ de feu observé sur le flanc Nord. Vigie 4 signale fumée active. Colonnes mobiles requises."
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
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="flex items-center gap-2 h-9 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 border border-red-500 rounded-lg text-white font-semibold transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Transmission..." : "Émettre l'alerte"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

