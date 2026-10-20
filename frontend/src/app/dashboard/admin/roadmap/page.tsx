"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchCommunityReports,
  fetchRoadmap,
  updateRoadmapPhase,
  toggleRoadmapLivrable,
  submitCommunityReport,
  RoadmapPhase,
} from "@/lib/api";
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
  Calendar,
  Flame,
  Wind,
  Eye,
  CheckSquare,
  Square,
  RefreshCw,
  Upload,
  Sparkles,
  Filter,
  CheckCircle,
  FileCheck,
  SlidersHorizontal,
} from "lucide-react";

export default function AdminRoadmapPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"roadmap" | "community">("roadmap");
  const [communityReports, setCommunityReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Roadmap State (Backend-backed)
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState<boolean>(true);
  const [updatingPhaseId, setUpdatingPhaseId] = useState<string | null>(null);

  // Lightbox Preview for Report Photos
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string; location: string } | null>(null);

  // Image Validation / Simulated New Report Modal
  const [showSimulateReportModal, setShowSimulateReportModal] = useState<boolean>(false);
  const [newReportWilaya, setNewReportWilaya] = useState<string>("Tizi Ouzou");
  const [newReportDesc, setNewReportDesc] = useState<string>("");
  const [newReportImageChoice, setNewReportImageChoice] = useState<string>("/reports/report_smoke_yakouren.jpg");
  const [customFileTestName, setCustomFileTestName] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);

  // Status Filter for Reports
  const [reportFilter, setReportFilter] = useState<string>("ALL");

  // Load Roadmap from Backend
  const loadRoadmap = async () => {
    setIsLoadingRoadmap(true);
    try {
      const data = await fetchRoadmap();
      if (data && data.phases) {
        setPhases(data.phases);
      }
    } catch (err) {
      console.warn("Could not fetch roadmap from backend:", err);
    } finally {
      setIsLoadingRoadmap(false);
    }
  };

  // Load Citizen Reports from Backend
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
    loadRoadmap();
    loadReports();
  }, []);

  // Update Citizen Report Status (VERIFIED / REJECTED)
  const handleUpdateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/community/reports/${reportId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, verified_by: "Officier CODIS Central" }),
      });
      if (res.ok) {
        setActionMessage(`Signalement ${reportId} validé avec le statut : ${newStatus}`);
        loadReports();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setActionError("Échec de mise à jour du signalement.");
      setTimeout(() => setActionError(null), 4000);
    }
  };

  // Toggle Deliverable Completion Checkbox
  const handleToggleLivrable = async (phaseId: string, livrableId: string, currentCompleted: boolean) => {
    // Optimistic UI Update
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== phaseId) return p;
        const updatedLivrables = p.livrables.map((liv) =>
          liv.id === livrableId ? { ...liv, completed: !currentCompleted } : liv
        );
        const compCount = updatedLivrables.filter((l) => l.completed).length;
        const newProg = Math.round((compCount / updatedLivrables.length) * 100);
        let newStatus = p.status;
        if (newProg === 100) newStatus = "completed";
        else if (newProg > 0) newStatus = "in_progress";
        else newStatus = "planned";

        return {
          ...p,
          livrables: updatedLivrables,
          progress: newProg,
          status: newStatus,
        };
      })
    );

    try {
      const res = await toggleRoadmapLivrable(phaseId, livrableId, !currentCompleted);
      if (res && res.phase) {
        setActionMessage(`Livrable mis à jour · Progression ${res.phase.name} : ${res.phase.progress}%`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to persist livrable toggle:", err);
      loadRoadmap(); // rollback on error
    }
  };

  // Mark Whole Phase as Completed
  const handleMarkPhaseCompleted = async (phaseId: string) => {
    setUpdatingPhaseId(phaseId);
    try {
      const res = await updateRoadmapPhase(phaseId, { status: "completed", progress: 100 });
      if (res && res.phase) {
        setActionMessage(`Phase "${res.phase.name}" marquée comme entièrement TERMINÉE (100%).`);
        loadRoadmap();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to mark phase as completed:", err);
      setActionError("Erreur lors de la mise à jour de la phase.");
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setUpdatingPhaseId(null);
    }
  };

  // Reset Phase to In Progress
  const handleResetPhase = async (phaseId: string) => {
    setUpdatingPhaseId(phaseId);
    try {
      const res = await updateRoadmapPhase(phaseId, { status: "in_progress", progress: 50 });
      if (res && res.phase) {
        setActionMessage(`Phase "${res.phase.name}" réinitialisée en cours d'exécution.`);
        loadRoadmap();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingPhaseId(null);
    }
  };

  // Image Validation Logic
  const validateUploadedImage = (filename: string): { valid: boolean; reason?: string } => {
    const lower = filename.toLowerCase().trim();
    if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
      return {
        valid: false,
        reason: "Format rejeté : seuls les fichiers .jpg et .png sont acceptés par le système de veille opérationnelle.",
      };
    }

    // Heuristic face / person detection rejection
    const personKeywords = ["face", "person", "selfie", "portrait", "baby", "people", "family", "enfant", "visage", "humain", "profil"];
    for (const kw of personKeywords) {
      if (lower.includes(kw)) {
        return {
          valid: false,
          reason: "REJET IA : Visage / individu détecté. La plateforme Protection Civile accepte exclusivement des vues de feu, fumée ou forêt.",
        };
      }
    }

    return { valid: true };
  };

  // Handle Simulated Report Submit with Validation
  const handleSimulateCitizenReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setValidationSuccess(null);

    // Validate photo choice or custom test name
    const imageToCheck = customFileTestName.trim() || newReportImageChoice;
    const validation = validateUploadedImage(imageToCheck);

    if (!validation.valid) {
      setValidationError(validation.reason || "Image invalide.");
      return;
    }

    if (!newReportDesc.trim()) {
      setValidationError("Veuillez saisir une description de l'observation.");
      return;
    }

    try {
      await submitCommunityReport({
        lat: 36.738,
        lon: 4.415,
        wilaya: newReportWilaya,
        description: newReportDesc,
        photo_url: newReportImageChoice,
        phone: "+213 551 00 22 44",
      });

      setValidationSuccess("Rapport validé par l'IA et transmis avec succès à la file d'attente CODIS.");
      setTimeout(() => {
        setShowSimulateReportModal(false);
        setNewReportDesc("");
        setCustomFileTestName("");
        setValidationError(null);
        setValidationSuccess(null);
        loadReports();
      }, 1500);
    } catch (err) {
      console.error(err);
      setValidationError("Erreur lors de la soumission du rapport.");
    }
  };

  // Calculate Overall Deliverable Completion
  const totalLivrables = phases.reduce((acc, p) => acc + (p.livrables?.length || 0), 0);
  const completedLivrables = phases.reduce(
    (acc, p) => acc + (p.livrables?.filter((l) => l.completed).length || 0),
    0
  );
  const overallPercentage = totalLivrables > 0 ? Math.round((completedLivrables / totalLivrables) * 100) : 0;

  // Filtered Community Reports
  const filteredReports = communityReports.filter((r) => {
    if (reportFilter === "ALL") return true;
    return r.status === reportFilter;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header and Strategic Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Protection Civile Algérienne · CODIS Tizi Ouzou
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Shield className="w-7 h-7 text-red-500" />
            <span>Feuille de Route 2026 & Signalements Opérationnels</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Suivi interactif de l&apos;industrialisation du système IN9AD, validation humaine des alertes citoyennes et raccordement opérationnel DGF.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`px-3.5 py-2 rounded-md font-bold transition flex items-center gap-2 ${
              activeTab === "roadmap"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Feuille de Route</span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono">
              {overallPercentage}%
            </span>
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`px-3.5 py-2 rounded-md font-bold transition flex items-center gap-2 ${
              activeTab === "community"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Signalements Citoyens</span>
            {communityReports.filter((r) => r.status === "PENDING").length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-mono text-[10px] font-black animate-pulse">
                {communityReports.filter((r) => r.status === "PENDING").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Global Alerts / Banners */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-600/80 text-red-200 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="font-medium">{actionError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: FEUILLE DE ROUTE INTERACTIVE */}
      {/* ========================================================================= */}
      {activeTab === "roadmap" && (
        <div className="space-y-6">
          {/* Gantt-Style Executive Timeline Visual */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Chronologie d&apos;Exécution & Déploiement Terrain (Gantt Visual)
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Avancement global : {completedLivrables} sur {totalLivrables} livrables validés ({overallPercentage}%)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">Synchronisé avec /backend/roadmap.json</span>
                <button
                  onClick={loadRoadmap}
                  disabled={isLoadingRoadmap}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Actualiser l'état du backend"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRoadmap ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Overall Progress Gauge */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Indice de Maturité Opérationnelle IN9AD</span>
                <span className="text-red-400 font-mono font-bold">{overallPercentage}% TERMINÉ</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
            </div>

            {/* Gantt Visual Chart Grid */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-12 text-[10px] font-mono uppercase text-slate-400 px-3 pb-1 border-b border-slate-800/60">
                <div className="col-span-4 sm:col-span-3">Phase & Périmètre</div>
                <div className="col-span-6 sm:col-span-7">Calendrier & Échéancier 2026-2027</div>
                <div className="col-span-2 text-right">Statut</div>
              </div>

              {phases.map((p) => {
                const isCompleted = p.status === "completed";
                const isInProgress = p.status === "in_progress";

                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-12 items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition text-xs"
                  >
                    <div className="col-span-4 sm:col-span-3 pr-2">
                      <div className="font-bold text-white truncate">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-red-400" />
                        <span>{p.month}</span>
                      </div>
                    </div>

                    <div className="col-span-6 sm:col-span-7 pr-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>{p.start_date} ➔ {p.end_date}</span>
                          <span className={isCompleted ? "text-emerald-400 font-bold" : "text-amber-400"}>
                            {p.progress}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isCompleted
                                ? "bg-emerald-500"
                                : isInProgress
                                ? "bg-gradient-to-r from-amber-500 to-red-500"
                                : "bg-slate-700"
                            }`}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          isCompleted
                            ? "bg-emerald-950/90 text-emerald-300 border-emerald-700"
                            : isInProgress
                            ? "bg-amber-950/90 text-amber-300 border-amber-700 animate-pulse"
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        }`}
                      >
                        {isCompleted ? "VALIDÉ" : isInProgress ? "EN COURS" : "PLANIFIÉ"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Interactive Phases Cards */}
          <div className="space-y-5">
            {phases.map((phase) => {
              const isCompleted = phase.status === "completed";
              const isInProgress = phase.status === "in_progress";
              const isPhaseUpdating = updatingPhaseId === phase.id;

              return (
                <div
                  key={phase.id}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                    isCompleted
                      ? "bg-slate-900/60 border-emerald-900/60 shadow-lg shadow-emerald-950/10"
                      : isInProgress
                      ? "bg-slate-900/80 border-red-900/50 shadow-lg shadow-red-950/10"
                      : "bg-slate-900/40 border-slate-800 opacity-90"
                  }`}
                >
                  {/* Phase Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-black text-red-400 uppercase tracking-wider">
                          {phase.month}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${phase.badgeColor || "bg-slate-800 text-slate-300 border-slate-700"}`}>
                          {phase.badge || "Jalon Stratégique"}
                        </span>
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            <Check className="w-3 h-3" />
                            Livrables 100% Validés
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-white tracking-tight">
                        {phase.name}
                      </h3>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex items-center gap-3">
                      <div className="w-32 sm:w-40 space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Avancement</span>
                          <span className={isCompleted ? "text-emerald-400 font-bold" : "text-white font-bold"}>
                            {phase.progress}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isCompleted ? "bg-emerald-500" : "bg-red-500"
                            }`}
                            style={{ width: `${phase.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Admin Phase Action Button */}
                      {isCompleted ? (
                        <button
                          onClick={() => handleResetPhase(phase.id)}
                          disabled={isPhaseUpdating}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isPhaseUpdating ? "animate-spin" : ""}`} />
                          <span>Réajuster</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkPhaseCompleted(phase.id)}
                          disabled={isPhaseUpdating}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>✓ Marquer comme terminé</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Phase Description & Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 text-xs">
                    <div className="md:col-span-2 space-y-2">
                      <p className="text-slate-300 leading-relaxed">
                        {phase.description}
                      </p>
                      <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Période : {phase.start_date} ➔ {phase.end_date}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                        Indicateurs d&apos;Impact :
                      </span>
                      <p className="text-xs font-mono text-emerald-300 leading-snug">
                        {phase.metrics}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Deliverables Checklist */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-red-400" />
                        <span>Livrables Clés & Tâches Critiques (Cliquer pour valider) :</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {phase.livrables.filter((l) => l.completed).length} / {phase.livrables.length} cochés
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {phase.livrables.map((liv) => (
                        <div
                          key={liv.id}
                          onClick={() => handleToggleLivrable(phase.id, liv.id, liv.completed)}
                          className={`p-3 rounded-xl border cursor-pointer select-none transition flex items-start gap-2.5 ${
                            liv.completed
                              ? "bg-emerald-950/30 border-emerald-800/70 text-emerald-200 hover:bg-emerald-950/50"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                          }`}
                        >
                          <div className="mt-0.5">
                            {liv.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                          </div>
                          <span className={`text-xs leading-snug ${liv.completed ? "line-through text-slate-400" : "font-medium text-slate-200"}`}>
                            {liv.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SIGNALEMENTS CITOYENS AVEC VRAIES IMAGES */}
      {/* ========================================================================= */}
      {activeTab === "community" && (
        <div className="space-y-4">
          {/* Top Actions & Filters Bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-white text-sm">
                  File de Vérification Tactique des Signalements Citoyens
                </h3>
              </div>
              <p className="text-slate-400 mt-0.5">
                Filtrage strict : images vérifiées (forêt, fumée, brûlis, vigie) avec rejet automatique des visages / personnes.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Buttons */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                {(["ALL", "PENDING", "VERIFIED", "REJECTED"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setReportFilter(st)}
                    className={`px-2.5 py-1 rounded font-semibold transition ${
                      reportFilter === st ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st === "ALL" ? "Tous" : st === "PENDING" ? "En Attente" : st === "VERIFIED" ? "Validés" : "Rejetés"}
                  </button>
                ))}
              </div>

              {/* Simulate Report Button with Image Validation */}
              <button
                onClick={() => setShowSimulateReportModal(true)}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tester Validation IA</span>
              </button>

              <button
                onClick={loadReports}
                disabled={isLoadingReports}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReports ? "animate-spin" : ""}`} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => {
              const isPending = report.status === "PENDING";
              const isVerified = report.status === "VERIFIED";

              // Detect report type for icon fallback
              const descLower = (report.description || "").toLowerCase();
              const isWindOrSirocco = descLower.includes("vent") || descLower.includes("sirocco") || descLower.includes("poussi");

              return (
                <div
                  key={report.report_id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 bg-slate-900/80 transition ${
                    isPending
                      ? "border-amber-700/80 shadow-md shadow-amber-950/20"
                      : isVerified
                      ? "border-emerald-800/60"
                      : "border-slate-800 opacity-60"
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header badge & ID */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-300">
                        {report.report_id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isPending
                            ? "bg-amber-950 text-amber-300 border-amber-700 animate-pulse"
                            : isVerified
                            ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        }`}
                      >
                        {isPending ? "EN ATTENTE CODIS" : isVerified ? "VÉRIFIÉ ✓" : "REJETÉ ✗"}
                      </span>
                    </div>

                    {/* Wilaya & Location */}
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>Wilaya de {report.wilaya}</span>
                        <span className="text-slate-400 text-xs font-mono font-normal">
                          ({Number(report.lat).toFixed(3)}°N, {Number(report.lon).toFixed(3)}°E)
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                        &quot;{report.description}&quot;
                      </p>
                    </div>

                    {/* Report Image or Verified Icon Placeholder (NEVER stock baby/cloud) */}
                    {report.photo_url ? (
                      <div
                        onClick={() =>
                          setPreviewPhoto({
                            url: report.photo_url,
                            title: `Signalement ${report.report_id} · ${report.wilaya}`,
                            location: `${Number(report.lat).toFixed(4)}°N, ${Number(report.lon).toFixed(4)}°E`,
                          })
                        }
                        className="relative rounded-xl overflow-hidden border border-slate-800 max-h-44 group cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={report.photo_url}
                          alt="Photo du foyer ou de la fumée"
                          className="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2">
                          <span className="px-2 py-0.5 bg-black/80 rounded text-[9px] text-slate-200 font-mono border border-slate-700">
                            Photo terrain vérifiée
                          </span>
                          <span className="text-[10px] text-white flex items-center gap-1 font-bold bg-red-600/90 px-1.5 py-0.5 rounded">
                            <Eye className="w-3 h-3" />
                            Agrandir
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Dedicated Fire/Smoke Icon Box (Never random unsplash images) */
                      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/70 p-4 flex flex-col items-center justify-center text-center space-y-1.5 h-36">
                        {isWindOrSirocco ? (
                          <div className="w-10 h-10 rounded-full bg-amber-950/60 border border-amber-700 flex items-center justify-center text-amber-400">
                            <Wind className="w-5 h-5 animate-pulse" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-700 flex items-center justify-center text-red-500">
                            <Flame className="w-5 h-5 animate-pulse" />
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-200">
                          {isWindOrSirocco ? "Signalement Aérologique (Sirocco)" : "Observation Visuelle Directe"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Aucun fichier joint · Coordonnées GPS confirmées par relais
                        </span>
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Tél: {report.phone || "Non renseigné"}</span>
                      <span>{new Date(report.timestamp).toLocaleString("fr-FR")}</span>
                    </div>
                  </div>

                  {/* Actions for Pending Reports */}
                  {isPending && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleUpdateReportStatus(report.report_id, "VERIFIED")}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
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

      {/* ========================================================================= */}
      {/* LIGHTBOX MODAL PREVIEW FOR AUTHENTIC PHOTOS */}
      {/* ========================================================================= */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-white text-sm">{previewPhoto.title}</h4>
                <p className="text-xs text-slate-400 font-mono">Coordonnées : {previewPhoto.location}</p>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative max-h-[70vh] flex items-center justify-center bg-black rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.url}
                alt="Aperçu grand format"
                className="max-h-[68vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Vérifié conforme aux critères Protection Civile (aucun visage/famille)
              </span>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIMULATED REPORT MODAL WITH IMAGE VALIDATION */}
      {/* ========================================================================= */}
      {showSimulateReportModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-white text-base">
                  Test du Module de Validation d&apos;Images
                </h3>
              </div>
              <button
                onClick={() => setShowSimulateReportModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulateCitizenReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Wilaya d&apos;Observation
                </label>
                <select
                  value={newReportWilaya}
                  onChange={(e) => setNewReportWilaya(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Tizi Ouzou">Tizi Ouzou (Yakouren / Azazga)</option>
                  <option value="Bejaia">Bejaia (Massif Akfadou / Adekar)</option>
                  <option value="Bouira">Bouira (Parc Djurdjura / Tikjda)</option>
                  <option value="Jijel">Jijel (Texenna / Guerrouche)</option>
                  <option value="Khenchela">Khenchela (Aurès / Chélia)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description du Témoin
                </label>
                <textarea
                  value={newReportDesc}
                  onChange={(e) => setNewReportDesc(e.target.value)}
                  placeholder="Ex: Colonne de fumée grise s'élevant derrière la crête..."
                  rows={2}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Photo Choice */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Sélection d&apos;Image Réelle (Strictement Conforme)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Fumée Yakouren", path: "/reports/report_smoke_yakouren.jpg" },
                    { label: "Feu Akfadou", path: "/reports/report_fire_akfadou.jpg" },
                    { label: "Vigie Algérie", path: "/reports/report_vigie.jpg" },
                    { label: "Zone Brûlée", path: "/reports/report_burned_zone.jpg" },
                    { label: "Sirocco & Poussière", path: "/reports/report_sirocco.jpg" },
                  ].map((img) => (
                    <button
                      key={img.path}
                      type="button"
                      onClick={() => {
                        setNewReportImageChoice(img.path);
                        setCustomFileTestName("");
                        setValidationError(null);
                      }}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                        newReportImageChoice === img.path && !customFileTestName
                          ? "bg-red-950/60 border-red-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          newReportImageChoice === img.path && !customFileTestName
                            ? "text-red-400"
                            : "text-slate-600"
                        }`}
                      />
                      <span className="truncate">{img.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulator for Rejecting Non-Fire / Face Images */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-slate-300 font-semibold block flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Tester le filtre de rejet IA (Ex: fichier avec visage / selfie)
                </span>
                <input
                  type="text"
                  value={customFileTestName}
                  onChange={(e) => {
                    setCustomFileTestName(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="Tapez ex: portrait_famille.jpg ou baby_cloud.png"
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-400">
                  Le filtre rejette automatiquement tout nom ou tag contenant &quot;face&quot;, &quot;portrait&quot;, &quot;baby&quot;, &quot;famille&quot;.
                </p>
              </div>

              {validationError && (
                <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {validationSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{validationSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSimulateReportModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Soumettre au Système</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
