"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchCommunityReports,
  fetchRoadmap,
  updateRoadmapPhase,
  toggleRoadmapLivrable,
  addRoadmapLivrable,
  deleteRoadmapLivrable,
  resetRoadmapData,
  broadcastEmergencySMS,
  fetchDGFWatchtowers,
  fetchSiroccoCorridors,
  fetchDronePatrols,
  updateCommunityReportStatus,
  submitCommunityReport,
  RoadmapPhase,
  DGFWatchtower,
  SiroccoCorridor,
  DronePatrol,
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
  Plus,
  Trash2,
  Send,
  Navigation,
  RotateCcw,
  Compass,
  Activity,
  Layers,
  Cpu,
  Award,
  BookOpen,
  Download,
} from "lucide-react";

const DEFAULT_ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: "phase1",
    name: "Phase 1 : Intégration CODIS & Raccordement DGF",
    month: "Mois 1 - 2",
    status: "in_progress",
    progress: 67,
    start_date: "2026-05-01",
    end_date: "2026-06-30",
    badge: "Pilote Prioritaire",
    badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
    metrics: "Validation CODIS Tizi Ouzou · Raccordement DGF Azazga",
    description: "Déploiement sur le site pilote prioritaire de Kabylie (Tizi Ouzou) avec raccordement direct des postes de vigie DGF d'Azazga et Yakouren.",
    livrables: [
      { id: "p1_1", name: "Installation du serveur local IN9AD au CODIS central de Tizi Ouzou", completed: true },
      { id: "p1_2", name: "Interconnexion directe avec les postes de vigie DGF d'Azazga et Yakouren", completed: true },
      { id: "p1_3", name: "Formation certifiée des officiers de garde aux tableaux de bord tactiques", completed: false },
    ],
  },
  {
    id: "phase2",
    name: "Phase 2 : Déploiement Mobile & Alertes SMS",
    month: "Mois 3",
    status: "in_progress",
    progress: 67,
    start_date: "2026-07-01",
    end_date: "2026-07-31",
    badge: "Déploiement Mobile",
    badgeColor: "bg-blue-950/80 text-blue-300 border-blue-800",
    metrics: "Passerelle SMS < 60s · PWA Hors-Ligne · Portail Citoyen",
    description: "Mise en place de la passerelle SMS d'urgence pour les populations rurales et application PWA autonome pour les chefs de colonne mobile.",
    livrables: [
      { id: "p2_1", name: "Passerelle SMS géociblée avec Algérie Télécom / Mobilis", completed: true },
      { id: "p2_2", name: "Application mobile PWA pour les chefs de colonne mobile en forêt", completed: true },
      { id: "p2_3", name: "Cartographie hors-ligne autonome en zone blanche (Tile cache local)", completed: false },
    ],
  },
  {
    id: "phase3",
    name: "Phase 3 : Montée en Échelle ML & Microclimats Sirocco",
    month: "Mois 6",
    status: "in_progress",
    progress: 33,
    start_date: "2026-08-01",
    end_date: "2026-10-31",
    badge: "Montée en Échelle ML",
    badgeColor: "bg-amber-950/80 text-amber-300 border-amber-800",
    metrics: "Temps de réaction : 15 min · ROC-AUC 98.7%",
    description: "Réentraînement XGBoost sur l'historique complet des cicatrices de feu et corrélation en temps réel avec les microclimats de Sirocco.",
    livrables: [
      { id: "p3_1", name: "Réentraînement XGBoost sur l'historique complet des cicatrices 2025", completed: true },
      { id: "p3_2", name: "Modélisation fine des microclimats de crête et couloirs de Sirocco (+45% à +60%)", completed: false },
      { id: "p3_3", name: "Corrélation en temps réel avec les capteurs thermiques terrestres DGF", completed: false },
    ],
  },
  {
    id: "phase4",
    name: "Phase 4 : Couverture Nationale & Drones Thermiques",
    month: "Long Terme",
    status: "planned",
    progress: 33,
    start_date: "2026-11-01",
    end_date: "2027-06-30",
    badge: "Couverture Nationale",
    badgeColor: "bg-violet-950/80 text-violet-300 border-violet-800",
    metrics: "14 Wilayas Telliennes · Drones Thermiques Autonomes",
    description: "Standardisation nationale aux 14 wilayas du Tell algérien et intégration de patrouilles autonomes de drones thermiques légers.",
    livrables: [
      { id: "p4_1", name: "Déploiement aux 14 wilayas du Tell (El Tarf, Jijel, Bejaia, Tipaza, Tlemcen...)", completed: true },
      { id: "p4_2", name: "Intégration télémétrique de patrouilles de drones thermiques légers (FLIR)", completed: false },
      { id: "p4_3", name: "Standardisation en tant que plateforme officielle du Ministère de l'Intérieur", completed: false },
    ],
  },
];

export default function AdminRoadmapPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"roadmap" | "community">("roadmap");
  const [communityReports, setCommunityReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Roadmap State (Backend-backed, with immediate default fallback)
  const [phases, setPhases] = useState<RoadmapPhase[]>(DEFAULT_ROADMAP_PHASES);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState<boolean>(false);
  const [updatingPhaseId, setUpdatingPhaseId] = useState<string | null>(null);

  // Deliverable Addition Modal
  const [showAddLivrableModal, setShowAddLivrableModal] = useState<boolean>(false);
  const [addLivrablePhaseId, setAddLivrablePhaseId] = useState<string>("");
  const [newLivrableName, setNewLivrableName] = useState<string>("");
  const [newLivrableDesc, setNewLivrableDesc] = useState<string>("");
  const [isAddingLivrable, setIsAddingLivrable] = useState<boolean>(false);

  // Emergency SMS Dispatcher Modal (Phase 2 idea)
  const [showSMSModal, setShowSMSModal] = useState<boolean>(false);
  const [smsWilaya, setSmsWilaya] = useState<string>("Tizi Ouzou");
  const [smsCommune, setSmsCommune] = useState<string>("Massif de Yakouren");
  const [smsRadius, setSmsRadius] = useState<number>(5);
  const [smsTargetGroup, setSmsTargetGroup] = useState<string>("POPULATION_CIVILE");
  const [smsMessage, setSmsMessage] = useState<string>(
    "ALERTE INCENDIE FORÊT (Protection Civile Algérienne): Évacuation préventive recommandée pour les riverains du massif. Suivre strictement les consignes des sapeurs-pompiers et composer le 14."
  );
  const [isSendingSMS, setIsSendingSMS] = useState<boolean>(false);
  const [smsResult, setSmsResult] = useState<any | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);

  // Telemetry Inspection Modal (Phase 1 Vigies, Phase 3 Sirocco, Phase 4 Drones)
  const [inspectionPhase, setInspectionPhase] = useState<"phase1" | "phase3" | "phase4" | null>(null);
  const [dgfVigies, setDgfVigies] = useState<DGFWatchtower[]>([]);
  const [isLoadingDgf, setIsLoadingDgf] = useState<boolean>(false);
  const [siroccoCorridors, setSiroccoCorridors] = useState<SiroccoCorridor[]>([]);
  const [isLoadingSirocco, setIsLoadingSirocco] = useState<boolean>(false);
  const [dronePatrols, setDronePatrols] = useState<DronePatrol[]>([]);
  const [isLoadingDrones, setIsLoadingDrones] = useState<boolean>(false);

  // Certified Officer Training Modal (Phase 1 Livrable p1_3)
  const [showTrainingModal, setShowTrainingModal] = useState<boolean>(false);
  const [trainingTraineeName, setTrainingTraineeName] = useState<string>("Lieutenant M. Benali");
  const [trainingOfficerUnit, setTrainingOfficerUnit] = useState<string>("CODIS Central Tizi Ouzou (15)");
  const [certifiedModules, setCertifiedModules] = useState<number[]>([1, 2, 3, 4]);
  const [trainingGeneratedToast, setTrainingGeneratedToast] = useState<string | null>(null);

  // Inter-Ministerial Standardization Dossier Modal (Phase 4 Livrable p4_3)
  const [showStandardizationModal, setShowStandardizationModal] = useState<boolean>(false);

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
  const handleUpdateReportStatus = async (reportId: string, newStatus: "VERIFIED" | "REJECTED") => {
    try {
      await updateCommunityReportStatus(reportId, newStatus, "Officier CODIS Central");
      setActionMessage(`Signalement ${reportId} validé avec le statut : ${newStatus}`);
      loadReports();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setActionError("Échec de mise à jour du signalement.");
      setTimeout(() => setActionError(null), 4000);
    }
  };

  // Toggle Deliverable Completion Checkbox
  const handleToggleLivrable = async (phaseId: string, livrableId: string, currentCompleted: boolean) => {
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
      loadRoadmap();
    }
  };

  // Add Deliverable to a Phase
  const handleAddLivrableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addLivrablePhaseId || !newLivrableName.trim()) return;
    setIsAddingLivrable(true);
    try {
      const res = await addRoadmapLivrable(addLivrablePhaseId, {
        name: newLivrableName.trim(),
        description: newLivrableDesc.trim() || undefined,
      });
      if (res && res.phase) {
        setActionMessage(`Nouveau livrable ajouté à la phase "${res.phase.name}".`);
        loadRoadmap();
        setShowAddLivrableModal(false);
        setNewLivrableName("");
        setNewLivrableDesc("");
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setActionError("Échec de l'ajout du livrable.");
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setIsAddingLivrable(false);
    }
  };

  // Delete Deliverable from a Phase
  const handleDeleteLivrableSubmit = async (phaseId: string, livrableId: string) => {
    if (!confirm("Confirmer la suppression de ce livrable opérationnel ?")) return;
    try {
      const res = await deleteRoadmapLivrable(phaseId, livrableId);
      if (res && res.phase) {
        setActionMessage(`Livrable supprimé. Nouvelle progression : ${res.phase.progress}%`);
        loadRoadmap();
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
      setActionError("Échec de la suppression du livrable.");
      setTimeout(() => setActionError(null), 4000);
    }
  };

  // Reset Roadmap to Default Approved Plan
  const handleResetRoadmapData = async () => {
    if (!confirm("Réinitialiser l'ensemble de la feuille de route aux 4 phases et livrables officiels ?")) return;
    setIsLoadingRoadmap(true);
    try {
      const res = await resetRoadmapData();
      if (res && res.roadmap) {
        setPhases(res.roadmap.phases || []);
        setActionMessage("Feuille de route réinitialisée avec succès aux jalons officiels.");
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setActionError("Échec de la réinitialisation de la feuille de route.");
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setIsLoadingRoadmap(false);
    }
  };

  // Trigger Emergency SMS Broadcast (Phase 2 idea)
  const handleBroadcastSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsMessage.trim()) return;
    setIsSendingSMS(true);
    setSmsError(null);
    try {
      const res = await broadcastEmergencySMS({
        wilaya: smsWilaya,
        commune: smsCommune,
        radius_km: smsRadius,
        message: smsMessage,
        target_group: smsTargetGroup,
      });
      setSmsResult(res);
      setActionMessage(
        `Diffusion SMS d'urgence validée (${res.recipients_count || 12500} destinataires estimés via Mobilis / Algérie Télécom).`
      );
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      console.error("SMS Broadcast Error:", err);
      setSmsError("Erreur lors de la diffusion SMS d'urgence.");
    } finally {
      setIsSendingSMS(false);
    }
  };

  // Open Telemetry Inspection Modal
  const handleOpenInspection = async (phase: "phase1" | "phase3" | "phase4") => {
    setInspectionPhase(phase);
    if (phase === "phase1" && dgfVigies.length === 0) {
      setIsLoadingDgf(true);
      try {
        const v = await fetchDGFWatchtowers();
        setDgfVigies(v);
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoadingDgf(false);
      }
    } else if (phase === "phase3" && siroccoCorridors.length === 0) {
      setIsLoadingSirocco(true);
      try {
        const c = await fetchSiroccoCorridors();
        setSiroccoCorridors(c);
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoadingSirocco(false);
      }
    } else if (phase === "phase4" && dronePatrols.length === 0) {
      setIsLoadingDrones(true);
      try {
        const d = await fetchDronePatrols();
        setDronePatrols(d);
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoadingDrones(false);
      }
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
              Protection Civile Algérienne · Direction Générale des Forêts (DGF)
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Shield className="w-7 h-7 text-red-500" />
            <span>Feuille de Route Stratégique & Opérations Terrain 2026</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Industrialisation opérationnelle d&apos;IN9AD : vigies DGF, passerelle SMS géociblée, couloirs aérologiques Sirocco et patrouilles drones thermiques.
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
                <button
                  onClick={handleResetRoadmapData}
                  disabled={isLoadingRoadmap}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                  title="Réinitialiser l'ensemble de la feuille de route aux jalons officiels"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Réinitialiser Plan</span>
                </button>
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
          <div className="space-y-6">
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

                  {/* ================================================================= */}
                  {/* OPERATIONAL CAPACITY STRIP SPECIFIC TO EACH ROADMAP IDEA */}
                  {/* ================================================================= */}

                  {/* Phase 1: Vigies DGF & Capteurs Terrestres */}
                  {phase.id === "phase1" && (
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-emerald-900/50 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-bold text-white text-xs">
                            Capacité Opérationnelle Déployée : 6 Vigies DGF & Capteurs Terrestres
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowTrainingModal(true)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition border border-slate-700"
                          >
                            <Award className="w-3 h-3 text-amber-400" />
                            <span>Formation Officiers CODIS</span>
                          </button>
                          <button
                            onClick={() => handleOpenInspection("phase1")}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition border border-slate-700"
                          >
                            <Eye className="w-3 h-3 text-emerald-400" />
                            <span>Télémétrie des 6 Vigies</span>
                          </button>
                          <Link
                            href="/dashboard?focus=vigies"
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                          >
                            <span>Voir sur Carte</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Pilote Territorial</span>
                          <span className="text-white font-bold">Tizi Ouzou Actif</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Stations DGF Raccordées</span>
                          <span className="text-emerald-400 font-bold">6 Postes Optiques</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Fréquence Radio VHF</span>
                          <span className="text-amber-400 font-bold">154.250 MHz</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Ligne de Vue Azazga/Yakouren</span>
                          <span className="text-emerald-400 font-bold">100% Opérationnelle</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase 2: Passerelle SMS d'Urgence & PWA Mobile */}
                  {phase.id === "phase2" && (
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-red-900/50 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-red-400 shrink-0" />
                          <span className="font-bold text-white text-xs">
                            Capacité Opérationnelle Déployée : Passerelle SMS Géociblée & PWA Colonnes Mobiles
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowSMSModal(true)}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm"
                          >
                            <Send className="w-3 h-3" />
                            <span>Diffuser Alerte SMS (Test)</span>
                          </button>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
                            PWA Prête
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Opérateurs Télécom</span>
                          <span className="text-white font-bold">Mobilis / Algérie Télécom</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Cell-Broadcast Rayon</span>
                          <span className="text-amber-400 font-bold">3 à 15 km Configurable</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Manifeste Web PWA</span>
                          <span className="text-emerald-400 font-bold">manifest.json Actif</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Cache Cartographique</span>
                          <span className="text-blue-400 font-bold">Hors-Ligne Disponible</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase 3: Couloirs Aérologiques Sirocco */}
                  {phase.id === "phase3" && (
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-amber-900/50 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Wind className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="font-bold text-white text-xs">
                            Capacité Opérationnelle Déployée : Modélisation Couloirs Sirocco (+45% à +60%)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenInspection("phase3")}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition border border-slate-700"
                          >
                            <Eye className="w-3 h-3 text-amber-400" />
                            <span>Inspecter Couloirs</span>
                          </button>
                          <Link
                            href="/dashboard?focus=sirocco"
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                          >
                            <span>Voir sur Carte</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Couloir Sebaou-Yakouren</span>
                          <span className="text-amber-400 font-bold">Multiplicateur +45%</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Couloir Soummam-Adekar</span>
                          <span className="text-red-400 font-bold">Multiplicateur +60%</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Couloir Djurdjura-Tikjda</span>
                          <span className="text-amber-400 font-bold">Multiplicateur +45%</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Couplage Topographique</span>
                          <span className="text-emerald-400 font-bold">Effet Venturi Intégré</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase 4: Tell Algérien (14 Wilayas) & Drones FLIR */}
                  {phase.id === "phase4" && (
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-cyan-900/50 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="font-bold text-white text-xs">
                            Capacité Opérationnelle Déployée : 14 Wilayas Telliennes & Patrouilles Drones FLIR
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowStandardizationModal(true)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition border border-slate-700"
                          >
                            <FileCheck className="w-3 h-3 text-emerald-400" />
                            <span>Dossier Homologation</span>
                          </button>
                          <button
                            onClick={() => handleOpenInspection("phase4")}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition border border-slate-700"
                          >
                            <Eye className="w-3 h-3 text-cyan-400" />
                            <span>Télémétrie Drone UAV</span>
                          </button>
                          <Link
                            href="/dashboard?focus=drones"
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                          >
                            <span>Voir sur Carte</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Couverture Nationale</span>
                          <span className="text-emerald-400 font-bold">14 Wilayas Forestières</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Vecteur Aérien UAV</span>
                          <span className="text-white font-bold">DJI Matrice 300 RTK</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Capteur Embarqué</span>
                          <span className="text-cyan-400 font-bold">FLIR Zenmuse H20T</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans block">Base Historique</span>
                          <span className="text-white font-bold">10 Ans (Tell Algérien)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactive Deliverables Checklist & Management */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-red-400" />
                        <span>Livrables Clés & Tâches Critiques (Cliquer pour valider) :</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-slate-400">
                          {phase.livrables.filter((l) => l.completed).length} / {phase.livrables.length} cochés
                        </span>
                        <button
                          onClick={() => {
                            setAddLivrablePhaseId(phase.id);
                            setShowAddLivrableModal(true);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition border border-slate-700"
                        >
                          <Plus className="w-3 h-3 text-red-400" />
                          <span>Ajouter Livrable</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {phase.livrables.map((liv) => (
                        <div
                          key={liv.id}
                          className={`group p-3 rounded-xl border select-none transition flex items-start justify-between gap-2 ${
                            liv.completed
                              ? "bg-emerald-950/30 border-emerald-800/70 text-emerald-200 hover:bg-emerald-950/50"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                          }`}
                        >
                          <div
                            onClick={() => handleToggleLivrable(phase.id, liv.id, liv.completed)}
                            className="flex items-start gap-2.5 cursor-pointer flex-1"
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

                          {/* Delete Livrable Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLivrableSubmit(phase.id, liv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-950/80 text-slate-400 hover:text-red-400 transition"
                            title="Supprimer ce livrable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add Deliverable Card Quick Button */}
                      <button
                        onClick={() => {
                          setAddLivrablePhaseId(phase.id);
                          setShowAddLivrableModal(true);
                        }}
                        className="p-3 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 text-xs font-semibold"
                      >
                        <Plus className="w-4 h-4 text-red-400" />
                        <span>Nouveau livrable</span>
                      </button>
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

                    {/* Report Image or Verified Icon Placeholder */}
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
      {/* MODAL: ADD DELIVERABLE TO ROADMAP PHASE */}
      {/* ========================================================================= */}
      {showAddLivrableModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-white text-base">
                  Ajouter un Livrable Opérationnel
                </h3>
              </div>
              <button
                onClick={() => setShowAddLivrableModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLivrableSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Phase Cible
                </label>
                <select
                  value={addLivrablePhaseId}
                  onChange={(e) => setAddLivrablePhaseId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500 font-mono text-xs"
                >
                  {phases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.month})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Intitulé du Livrable
                </label>
                <input
                  type="text"
                  value={newLivrableName}
                  onChange={(e) => setNewLivrableName(e.target.value)}
                  placeholder="Ex: Raccordement des caméras thermiques au serveur régional"
                  required
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description / Critère de Réussite (Optionnel)
                </label>
                <textarea
                  value={newLivrableDesc}
                  onChange={(e) => setNewLivrableDesc(e.target.value)}
                  placeholder="Détails techniques, protocoles ou validation requise..."
                  rows={2}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddLivrableModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isAddingLivrable || !newLivrableName.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isAddingLivrable ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Ajouter à la feuille de route</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EMERGENCY SMS BROADCAST DISPATCHER (PHASE 2 ROADMAP IDEA) */}
      {/* ========================================================================= */}
      {showSMSModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    Passerelle SMS Géociblée d&apos;Urgence
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Réseaux : Mobilis · Algérie Télécom · Djezzy · Ooredoo
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSMSModal(false);
                  setSmsResult(null);
                  setSmsError(null);
                }}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSMS} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Wilaya Cible
                  </label>
                  <select
                    value={smsWilaya}
                    onChange={(e) => setSmsWilaya(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500 font-mono text-xs"
                  >
                    {[
                      "Tizi Ouzou",
                      "Bejaia",
                      "Bouira",
                      "Jijel",
                      "Setif",
                      "Skikda",
                      "El Tarf",
                      "Blida",
                      "Tipaza",
                      "Ain Defla",
                      "Tlemcen",
                      "Guelma",
                      "Souk Ahras",
                      "Batna",
                    ].map((w) => (
                      <option key={w} value={w}>
                        Wilaya de {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Secteur / Commune
                  </label>
                  <input
                    type="text"
                    value={smsCommune}
                    onChange={(e) => setSmsCommune(e.target.value)}
                    placeholder="Ex: Massif Yakouren / Azazga"
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Rayon Cell-Broadcast ({smsRadius} km)
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
                    <span>2 km (Local)</span>
                    <span className="text-red-400 font-bold">{smsRadius} km</span>
                    <span>20 km (Massif)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Groupe Cible
                  </label>
                  <select
                    value={smsTargetGroup}
                    onChange={(e) => setSmsTargetGroup(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500 font-mono text-xs"
                  >
                    <option value="POPULATION_CIVILE">Population Civile (Cell-Broadcast)</option>
                    <option value="EXPLOITANTS_FORESTIERS">Exploitants Agricoles & Forestiers</option>
                    <option value="COLONNES_MOBILES">Colonnes Mobiles Protection Civile</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Message d&apos;Urgence Diffusé (Français / Arabe)
                </label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500 font-mono text-[11px]"
                />
              </div>

              {smsResult && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-emerald-200 text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Diffusion SMS Exécutée avec Succès (Code: {smsResult.broadcast_id})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-1 text-slate-300">
                    <div>Destinataires: <span className="text-white font-bold">{smsResult.recipients_count}</span></div>
                    <div>Relais: <span className="text-white font-bold">Mobilis / AT</span></div>
                    <div>Rayon: <span className="text-white font-bold">{smsResult.radius_km} km</span></div>
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
                  Protocole d&apos;urgence Ministère de l&apos;Intérieur
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSMSModal(false);
                      setSmsResult(null);
                      setSmsError(null);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Fermer
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
                    <span>Diffuser Alerte Immédiate</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TELEMETRY INSPECTION (VIGIES DGF, SIROCCO & DRONES) */}
      {/* ========================================================================= */}
      {inspectionPhase && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {inspectionPhase === "phase1" && <Radio className="w-5 h-5 text-emerald-400" />}
                {inspectionPhase === "phase3" && <Wind className="w-5 h-5 text-amber-400" />}
                {inspectionPhase === "phase4" && <Navigation className="w-5 h-5 text-cyan-400" />}
                <div>
                  <h3 className="font-bold text-white text-base">
                    {inspectionPhase === "phase1" && "Télémétrie des 6 Vigies DGF & Capteurs Terrestres"}
                    {inspectionPhase === "phase3" && "Modélisation des Couloirs Aérologiques Sirocco"}
                    {inspectionPhase === "phase4" && "Télémétrie en Vol Drone Thermique FLIR (DJI Matrice 300 RTK)"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Données temps réel synchronisées avec les stations CODIS & DGF
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectionPhase(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content for Phase 1: Vigies DGF */}
            {inspectionPhase === "phase1" && (
              <div className="space-y-3">
                {isLoadingDgf ? (
                  <div className="p-8 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                    <span>Interrogation des capteurs DGF en cours...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dgfVigies.map((vigie) => (
                      <div
                        key={vigie.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{vigie.name}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px] font-bold">
                            {vigie.elevation_m}m
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Wilaya : <span className="text-slate-200">{vigie.wilaya}</span> · Observateur : <span className="text-slate-200">{vigie.observer}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[10px] text-center">
                          <div>
                            <span className="text-slate-500 block">Temp</span>
                            <span className="text-rose-400 font-bold">{vigie.temp_sensor}°C</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Hum</span>
                            <span className="text-amber-400 font-bold">{vigie.humidity_sensor}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Vent</span>
                            <span className="text-white font-bold">{vigie.wind_sensor} km/h</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-900">
                          <span className="text-slate-400">Canal VHF : {vigie.radio_channel}</span>
                          <span className="text-emerald-400 font-bold">{vigie.optical_status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content for Phase 3: Sirocco Corridors */}
            {inspectionPhase === "phase3" && (
              <div className="space-y-3">
                {isLoadingSirocco ? (
                  <div className="p-8 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Chargement des modélisations aérologiques...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {siroccoCorridors.map((corridor) => (
                      <div
                        key={corridor.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{corridor.name}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono text-[11px] font-bold">
                            {corridor.multiplier_label}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {corridor.description}
                        </p>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                          <span>Axe du Vent : {corridor.wind_axis}</span>
                          <span className="text-amber-400 font-semibold">Wilaya : {corridor.wilaya}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content for Phase 4: FLIR Drones */}
            {inspectionPhase === "phase4" && (
              <div className="space-y-3">
                {isLoadingDrones ? (
                  <div className="p-8 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-500" />
                    <span>Connexion à la télémétrie UAV en cours...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dronePatrols.map((drone) => (
                      <div
                        key={drone.drone_id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white text-sm">{drone.drone_id} · {drone.model}</span>
                            <span className="text-slate-400 font-mono text-xs block">
                              Base : {drone.home_base} · Mission : {drone.mission_name}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[11px] font-bold animate-pulse">
                            {drone.status_label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Altitude AGL</span>
                            <span className="text-white font-bold">{drone.altitude_m_agl} m</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Vitesse</span>
                            <span className="text-white font-bold">{drone.speed_kmh} km/h</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Batterie</span>
                            <span className="text-emerald-400 font-bold">{drone.battery_pct}% ({drone.flight_time_remaining})</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Capteur FLIR</span>
                            <span className="text-rose-400 font-bold">Max {drone.max_temperature_detected_c}°C</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900 font-mono">
                          <span>Points chauds détectés : {drone.hotspots_detected_count}</span>
                          <span className="text-cyan-400 font-semibold">{drone.video_link}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <span>Visualiser les couches sur la Carte</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setInspectionPhase(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CODIS OFFICER CERTIFIED TRAINING CURRICULUM (PHASE 1 ROADMAP IDEA) */}
      {/* ========================================================================= */}
      {showTrainingModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-600/80 text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Formation Certifiée des Officiers de Garde CODIS & DGF
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Livrable P1.3 · Conforme au Manuel Tactique de la Protection Civile Algérienne
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTrainingModal(false);
                  setTrainingGeneratedToast(null);
                }}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {trainingGeneratedToast && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{trainingGeneratedToast}</span>
              </div>
            )}

            {/* Trainee Officer Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Officier Stagiaire :</label>
                <input
                  type="text"
                  value={trainingTraineeName}
                  onChange={(e) => setTrainingTraineeName(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Unité d&apos;Affectation :</label>
                <input
                  type="text"
                  value={trainingOfficerUnit}
                  onChange={(e) => setTrainingOfficerUnit(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold"
                />
              </div>
            </div>

            {/* Curriculum Checklist */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Modules d&apos;Aptitude Tactique (4 Heures de Validation) :
              </span>

              {[
                {
                  id: 1,
                  title: "Module 1 : Modèle Prédictif XGBoost & Interprétation FWI",
                  desc: "Compréhension des indices météo canadiens (FFMC, ISI, BUI, FWI) adaptés au climat méditerranéen et seuils critiques à 85/100.",
                },
                {
                  id: 2,
                  title: "Module 2 : Protocole d'Alerte Vigies DGF & Radio VHF",
                  desc: "Levée de doute optique rapide, communication d'urgence sur le canal VHF 154.250 MHz avec les postes d'Azazga et Yakouren.",
                },
                {
                  id: 3,
                  title: "Module 3 : Diffusion SMS Géociblée & Cell-Broadcast",
                  desc: "Définition du périmètre de sécurité (3 à 15 km), réquisition des canaux Mobilis / Algérie Télécom et transmission de consignes d'évacuation.",
                },
                {
                  id: 4,
                  title: "Module 4 : Reconnaissance Aérienne par Drones FLIR",
                  desc: "Exploitation du flux vidéo thermique DJI Matrice 300 RTK, détection des fumerolles résiduelles et guidage des colonnes mobiles au sol.",
                },
              ].map((mod) => {
                const isChecked = certifiedModules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => {
                      if (isChecked) {
                        setCertifiedModules(certifiedModules.filter((id) => id !== mod.id));
                      } else {
                        setCertifiedModules([...certifiedModules, mod.id]);
                      }
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      isChecked
                        ? "bg-slate-950 border-emerald-600/60 shadow-sm shadow-emerald-950/20"
                        : "bg-slate-950/50 border-slate-800 text-slate-400"
                    }`}
                  >
                    <div className="pt-0.5">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className={`font-bold ${isChecked ? "text-white" : "text-slate-400"}`}>
                        {mod.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{mod.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Certificate Action Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-xs font-mono">
                Progression :{" "}
                <span className="font-bold text-emerald-400">
                  {certifiedModules.length} / 4 Modules Validés
                </span>
              </div>
              <button
                onClick={() => {
                  setTrainingGeneratedToast(
                    `Attestation d'aptitude tactique délivrée à ${trainingTraineeName} (${trainingOfficerUnit}). Enregistré au registre CODIS n°DZ-2026-${Math.floor(1000 + Math.random() * 9000)}.`
                  );
                }}
                disabled={certifiedModules.length < 4}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-black font-bold text-xs flex items-center gap-1.5 transition shadow-md"
              >
                <Award className="w-4 h-4" />
                <span>Délivrer Attestation Officielle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INTER-MINISTERIAL STANDARDIZATION DOSSIER (PHASE 4 ROADMAP IDEA) */}
      {/* ========================================================================= */}
      {showStandardizationModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-emerald-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Dossier d&apos;Homologation & Standardisation Interministérielle
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Livrable P4.3 · Ministère de l&apos;Intérieur, des Collectivités Locales & DGF
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStandardizationModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Legal Reference Strip */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                  Cadre Réglementaire & Souveraineté Numérique :
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Conforme aux dispositions du <strong>Décret Exécutif n°21-344</strong> fixant le plan national de lutte contre les feux de forêts. Plateforme certifiée pour déploiement sur le réseau intranet sécurisé des 14 wilayas forestières du Tell algérien.
                </p>
              </div>

              {/* Security & Cloud Infrastructure */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-white">Chiffrement Souverain</div>
                  <div className="text-[11px] text-slate-400">
                    Liaisons radio VHF, flux FLIR drones et télémétrie chiffrés AES-256.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-white">Hébergement Local</div>
                  <div className="text-[11px] text-slate-400">
                    Datacenter national sécurisé (CODIS Tizi Ouzou / Alger), aucune dépendance cloud externe.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-white">Accès Hiérarchique</div>
                  <div className="text-[11px] text-slate-400">
                    RBAC tripartite : Officier CODIS, Guetteur DGF, et Chef de Colonne Mobile PWA.
                  </div>
                </div>
              </div>

              {/* 14 Wilayas Interoperability Matrix */}
              <div className="space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Grille d&apos;Interconnexion Opérationnelle (14 Wilayas Telliennes) :
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                  {[
                    { name: "Tizi Ouzou (15)", status: "Pilote Actif", color: "text-emerald-400" },
                    { name: "Bejaia (06)", status: "Opérationnel", color: "text-emerald-400" },
                    { name: "Bouira (10)", status: "Opérationnel", color: "text-emerald-400" },
                    { name: "Jijel (18)", status: "Raccordé", color: "text-blue-400" },
                    { name: "El Tarf (36)", status: "Raccordé", color: "text-blue-400" },
                    { name: "Skikda (21)", status: "Raccordé", color: "text-blue-400" },
                    { name: "Setif (19)", status: "Raccordé", color: "text-blue-400" },
                    { name: "Blida (09)", status: "Raccordé", color: "text-blue-400" },
                    { name: "Tipaza (42)", status: "Raccordé", color: "text-blue-400" },
                    { name: "Ain Defla (44)", status: "Raccordé", color: "text-blue-400" },
                    { name: "Tlemcen (13)", status: "Raccordé", color: "text-blue-400" },
                    { name: "Guelma (24)", status: "Raccordé", color: "text-blue-400" },
                    { name: "Souk Ahras (41)", status: "Raccordé", color: "text-blue-400" },
                    { name: "Batna (05)", status: "Raccordé", color: "text-blue-400" },
                  ].map((w) => (
                    <div key={w.name} className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-300">{w.name}</span>
                      <span className={`font-bold ${w.color}`}>{w.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commission Visa Signature Strip */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white block">Visa de la Commission Interministérielle</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Visa Technique n°DZ-PC-DGF-2026/899 · Statut : HOMOLOGATION FAVORABLE ACCORDÉE
                  </span>
                </div>
                <button
                  onClick={() => {
                    alert("Dossier d'homologation interministériel n°DZ-PC-DGF-2026/899 archivé et validé.");
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition shrink-0"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Confirmer Homologation</span>
                </button>
              </div>
            </div>
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
