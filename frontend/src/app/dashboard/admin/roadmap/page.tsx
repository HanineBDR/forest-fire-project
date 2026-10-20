"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { fetchCommunityReports } from "@/lib/api";
import {
  Shield,
  Clock,
  Smartphone,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Camera,
  Users,
  Check,
  X,
  ExternalLink,
} from "lucide-react";

export default function AdminRoadmapPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"roadmap" | "community">("roadmap");
  const [communityReports, setCommunityReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      const reps = await fetchCommunityReports();
      setCommunityReports(reps);
    } catch (e) {
      console.warn("Could not fetch reports:", e);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleUpdateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/community/reports/${reportId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActionMessage(`Signalement ${reportId} mis à jour : ${newStatus}`);
        loadReports();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const phases = [
    {
      month: "Mois 1 - 2",
      title: t("phase1_title"),
      badge: "Phase Initiale",
      badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
      description: t("phase1_desc"),
      metrics: "Validation CODIS Tizi Ouzou · 0 fausse alerte · Raccordement DGF",
      deliverables: [
        "Installation du serveur IN9AD au CODIS central de Tizi Ouzou",
        "Interconnexion directe avec les postes de vigie DGF d'Azazga et Yakouren",
        "Formation des officiers de garde aux tableaux de bord tactiques",
      ],
    },
    {
      month: "Mois 3",
      title: t("phase2_title"),
      badge: "Déploiement Mobile",
      badgeColor: "bg-blue-950/80 text-blue-300 border-blue-800",
      description: t("phase2_desc"),
      metrics: "SMS d'alerte < 60s · PWA Hors-Ligne · Portail Citoyen",
      deliverables: [
        "Passerelle SMS géociblée avec Algérie Télécom / Mobilis",
        "Application mobile PWA pour les chefs de colonne mobile en forêt",
        "Cartographie hors-ligne autonome en zone blanche",
      ],
    },
    {
      month: "Mois 6",
      title: t("phase3_title"),
      badge: "Montée en Échelle ML",
      badgeColor: "bg-amber-950/80 text-amber-300 border-amber-800",
      description: t("phase3_desc"),
      metrics: "Temps de réaction : 45 min ➔ 15 min · ROC-AUC 98.7%",
      deliverables: [
        "Réentraînement XGBoost sur l'historique complet des cicatrices 2025",
        "Modélisation fine des microclimats de crête et couloirs de Sirocco",
        "Corrélation en temps réel avec les capteurs thermiques terrestres",
      ],
    },
    {
      month: "Long Terme",
      title: t("phase4_title"),
      badge: "Couverture Nationale",
      badgeColor: "bg-violet-950/80 text-violet-300 border-violet-800",
      description: t("phase4_desc"),
      metrics: "14 Wilayas Forestières · Drones Thermiques Autonomes",
      deliverables: [
        "Déploiement aux 14 wilayas du Tell (El Tarf, Jijel, Bejaia, Tipaza, Tlemcen...)",
        "Intégration télémétrique de patrouilles de drones thermiques légers",
        "Standardisation en tant que plateforme officielle du Ministère de l'Intérieur",
      ],
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Vision Stratégique & Prochaines Étapes
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
            <Shield className="w-6 h-6 text-red-500" />
            <span>Feuille de Route 2026 (What Happens Next)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {t("roadmap_subtitle")}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === "roadmap" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Feuille de Route
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
              activeTab === "community" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Signalements Citoyens</span>
            {communityReports.filter((r) => r.status === "PENDING").length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-950 text-red-300 font-mono text-[10px] border border-red-800 font-bold">
                {communityReports.filter((r) => r.status === "PENDING").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {activeTab === "roadmap" ? (
        /* Roadmap Timeline */
        <div className="space-y-6">
          <div className="relative pl-6 md:pl-8 border-l-2 border-slate-800 space-y-8">
            {phases.map((phase, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] md:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-red-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                </div>

                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3 hover:border-slate-700 transition">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-black font-mono text-red-400 uppercase">
                        {phase.month}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${phase.badgeColor}`}>
                        {phase.badge}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">
                      {phase.metrics}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">
                    {phase.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {phase.description}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Livrables Clés :
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {phase.deliverables.map((d, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Community Citizen Reports Queue */
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">File de Validation des Signalements Citoyens</h3>
              <p className="text-slate-400 mt-0.5">
                Vérification humaine des observations citoyennes avant déclenchement d&apos;alertes officielles.
              </p>
            </div>
            <button
              onClick={loadReports}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              Actualiser
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communityReports.map((report) => {
              const isPending = report.status === "PENDING";
              const isVerified = report.status === "VERIFIED";

              return (
                <div
                  key={report.report_id}
                  className={`p-4 rounded-xl border space-y-3 bg-slate-900/80 ${
                    isPending
                      ? "border-amber-800/80 shadow-amber-950/20"
                      : isVerified
                      ? "border-emerald-800/60"
                      : "border-slate-800 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-300">
                      {report.report_id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isPending
                          ? "bg-amber-950 text-amber-300 border-amber-800"
                          : isVerified
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>{report.wilaya}</span>
                      <span className="text-slate-400 text-xs font-mono font-normal">
                        ({report.lat.toFixed(4)}°N, {report.lon.toFixed(4)}°E)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      &quot;{report.description}&quot;
                    </p>
                  </div>

                  {report.photo_url && (
                    <div className="relative rounded-lg overflow-hidden border border-slate-800 max-h-36">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={report.photo_url}
                        alt="Photo fumée citoyenne"
                        className="w-full h-36 object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[9px] text-slate-300 font-mono">
                        Photo témoin
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>Tél: {report.phone || "Non renseigné"}</span>
                    <span>{new Date(report.timestamp).toLocaleString("fr-FR")}</span>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleUpdateReportStatus(report.report_id, "VERIFIED")}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Valider & Alerter</span>
                      </button>
                      <button
                        onClick={() => handleUpdateReportStatus(report.report_id, "REJECTED")}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center justify-center gap-1 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rejeter</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
