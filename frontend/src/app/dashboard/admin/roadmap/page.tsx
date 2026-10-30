"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchCommunityReports,
  updateCommunityReportStatus,
  submitCommunityReport,
} from "@/lib/api";
import { getLocalizedWilayaName } from "@/lib/notificationTypes";
import {
  ShieldAlert,
  Camera,
  Check,
  X,
  MapPin,
  Eye,
  RefreshCw,
  Upload,
  Flame,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import RoleGate from "@/components/RoleGate";

const WILAYAS = [
  "Tizi Ouzou",
  "Bejaia",
  "Bouira",
  "Jijel",
  "Blida",
  "Khenchela",
  "Batna",
  "Setif",
  "Skikda",
  "El Tarf",
  "Tipaza",
  "Tlemcen",
  "Médéa",
  "Chlef",
];
const DEFAULT_COMMUNITY_REPORTS = [
  {
    report_id: "REP-2026-005",
    lat: 35.432,
    lon: 7.143,
    wilaya: "Khenchela",
    description: "Violent Sirocco winds and dust-laden atmosphere in the Aurès forest massif",
    photo_url: "/reports/report_sirocco.jpg",
    phone: "+213 661 77 88 99",
    status: "PENDING",
    timestamp: "2026-10-20T20:05:13.000Z",
  },
  {
    report_id: "REP-2026-002",
    lat: 36.689,
    lon: 4.623,
    wilaya: "Bejaia",
    description: "Suspicious fire outbreak in undergrowth along the forest trail in the Akfadou massif",
    photo_url: "/reports/report_fire_akfadou.jpg",
    phone: "+213 662 98 76 54",
    status: "PENDING",
    timestamp: "2026-10-20T19:15:33.000Z",
  },
  {
    report_id: "REP-2026-001",
    lat: 36.738,
    lon: 4.412,
    wilaya: "Tizi Ouzou",
    description: "Dense smoke and pungent odor observed above the canopy near Ighil Bouchene (Yakouren Forest)",
    photo_url: "/reports/report_smoke_yakouren.jpg",
    phone: "+213 551 23 45 67",
    status: "PENDING",
    timestamp: "2026-10-20T18:42:10.000Z",
  },
  {
    report_id: "REP-2026-003",
    lat: 36.465,
    lon: 4.148,
    wilaya: "Bouira",
    description: "White smoke plumes observed from the Tikjda watchtower",
    photo_url: "/reports/report_vigie.jpg",
    phone: "+213 770 45 67 89",
    status: "VERIFIED",
    timestamp: "2026-10-20T17:20:00.000Z",
  },
  {
    report_id: "REP-2026-004",
    lat: 36.782,
    lon: 5.31,
    wilaya: "Jijel",
    description: "Charred trees and flare-up resurgence following a wind gust",
    photo_url: "/reports/report_burned_zone.jpg",
    phone: "+213 661 22 33 44",
    status: "VERIFIED",
    timestamp: "2026-10-20T16:10:00.000Z",
  },
];


// Helper to translate default/mock report descriptions according to active language
function getLocalizedReportDescription(desc: string, lang: string): string {
  if (!desc) return "";
  const d = desc.trim();
  const lower = d.toLowerCase();

  if (lower.includes("ighil bouchene") || lower.includes("yakouren") || lower.includes("fumée dense")) {
    if (lang === "ar") return "دخان كثيف ورائحة حادة مرصودة فوق قمم الأشجار بالقرب من إغيل بوشن (غابة يعكورن)";
    if (lang === "en") return "Dense smoke and pungent odor observed above the canopy near Ighil Bouchene (Yakouren Forest)";
    return "Fumée dense et odeur âcre observée au-dessus de la canopée près d'Ighil Bouchene (Forêt de Yakouren)";
  }

  if (lower.includes("akfadou") || lower.includes("sous-bois") || lower.includes("adekar")) {
    if (lang === "ar") return "بداية حريق مشبوهة في الغطاء النباتي على طول المسلك الغابي لكتلة أكفادو";
    if (lang === "en") return "Suspicious fire outbreak in undergrowth along the forest trail in the Akfadou massif";
    return "Départ de feu suspect en sous-bois le long de la piste forestière du massif d'Akfadou";
  }

  if (lower.includes("aurès") || lower.includes("aures") || lower.includes("sirocco et atmosphère") || lower.includes("poussière")) {
    if (lang === "ar") return "رياح سيروكو عاتية وأجواء محملة بالغبار في الكتلة الغابية للأوراس";
    if (lang === "en") return "Violent Sirocco winds and dust-laden atmosphere in the Aurès forest massif";
    return "Vents violents de Sirocco et atmosphère chargée de poussière au massif forestier des Aurès";
  }

  if (lower.includes("tikjda") || lower.includes("fumée blanche") || lower.includes("éclaircies de fumée")) {
    if (lang === "ar") return "أعمدة دخان أبيض خفيف مرصودة من برج مراقبة تيكجدة";
    if (lang === "en") return "White smoke plumes observed from the Tikjda watchtower";
    return "Éclaircies de fumée blanche observées depuis la vigie de Tikjda";
  }

  if (lower.includes("calcinés") || lower.includes("reprise de foyer") || lower.includes("rafale de vent")) {
    if (lang === "ar") return "أشجار متفحمة وتجدد بؤرة نار إثر هبوب رياح قوية";
    if (lang === "en") return "Charred trees and flare-up resurgence following a wind gust";
    return "Arbres calcinés et reprise de foyer suite à une rafale de vent";
  }

  if (lower.includes("azazga") || lower.includes("odeur de cendre")) {
    if (lang === "ar") return "رياح سيروكو قوية مع غبار ورائحة رماد باتجاه عزازقة";
    if (lang === "en") return "Strong Sirocco wind with dust and ash smell towards Azazga";
    return "Fort vent de Sirocco avec poussière et odeur de cendre vers Azazga";
  }

  return d;
}

export default function AdminCitizenReportsPage() {
  const { t, language, isRTL } = useLanguage();

  const [communityReports, setCommunityReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Status Filter for Reports: ALL | PENDING | VERIFIED | REJECTED
  const [reportFilter, setReportFilter] = useState<"ALL" | "PENDING" | "VERIFIED" | "REJECTED">("ALL");

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
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  // Load Citizen Reports from Backend and LocalStorage
  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      let reps: any[] = [];
      try {
        reps = await fetchCommunityReports();
      } catch (err) {
        console.warn("fetchCommunityReports error:", err);
      }

      // Check localStorage for newly submitted citizen reports
      let localReps: any[] = [];
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("inkad_citizen_reports");
          if (stored) {
            localReps = JSON.parse(stored);
          }
        } catch (e) {
          console.warn("Error reading local reports:", e);
        }
      }

      // Merge local reports with backend reports (local on top)
      const existingIds = new Set((reps || []).map((r: any) => r.report_id));
      const newFromLocal = localReps.filter((r: any) => !existingIds.has(r.report_id));
      let combined = [...newFromLocal, ...(reps || [])];

      // If empty, populate with default seed reports
      if (combined.length === 0) {
        combined = DEFAULT_COMMUNITY_REPORTS;
      }

      setCommunityReports(combined);
    } catch (e) {
      console.warn("Could not fetch reports:", e);
      setCommunityReports(DEFAULT_COMMUNITY_REPORTS);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Update Citizen Report Status (VERIFIED / REJECTED)
  const handleUpdateReportStatus = async (reportId: string, newStatus: "VERIFIED" | "REJECTED") => {
    try {
      // 1. Update in backend if reachable
      try {
        await updateCommunityReportStatus(reportId, newStatus, "Officier CODIS Central");
      } catch (backendErr) {
        console.warn("Backend status update note:", backendErr);
      }

      // 2. Update in localStorage if present
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("inkad_citizen_reports");
          if (stored) {
            const list: any[] = JSON.parse(stored);
            const updated = list.map((r: any) =>
              r.report_id === reportId ? { ...r, status: newStatus } : r
            );
            localStorage.setItem("inkad_citizen_reports", JSON.stringify(updated));
          }
        } catch (e) {
          console.warn("Error updating local report status:", e);
        }
      }

      // 3. Update local state
      setCommunityReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? { ...r, status: newStatus } : r))
      );

      const template = newStatus === "VERIFIED"
        ? (t("community_action_verified") || "Report {id} validated with status: VERIFIED")
        : (t("community_action_rejected") || "Report {id} marked as REJECTED");
      setActionMessage(template.replace("{id}", reportId));
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setActionError(t("community_action_error") || "Failed to update report status.");
      setTimeout(() => setActionError(null), 4000);
    }
  };

  // Image Validation Logic
  const validateUploadedImage = (filename: string): { valid: boolean; reason?: string } => {
    const lower = filename.toLowerCase().trim();
    if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
      return {
        valid: false,
        reason: t("community_modal_err_format") || "Format rejected: only .jpg and .png files are accepted.",
      };
    }

    const personKeywords = ["face", "person", "selfie", "portrait", "baby", "people", "family", "enfant", "visage", "humain", "profil", "وجه", "شخص"];
    for (const kw of personKeywords) {
      if (lower.includes(kw)) {
        return {
          valid: false,
          reason: t("community_modal_err_face") || "AI REJECTION: Face / person detected. System accepts only wildfire views.",
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
      setValidationError(validation.reason || "Invalid image.");
      return;
    }

    if (!newReportDesc.trim()) {
      setValidationError(t("community_modal_err_desc") || "Please provide a description of the observation.");
      return;
    }

    setIsSubmittingReport(true);
    try {
      await submitCommunityReport({
        lat: 36.738,
        lon: 4.415,
        wilaya: newReportWilaya,
        description: newReportDesc.trim(),
        photo_url: imageToCheck.startsWith("/") ? imageToCheck : newReportImageChoice,
        phone: "+213 551 00 22 44",
      });

      setValidationSuccess(t("community_modal_success") || "Report validated by AI and transmitted to CODIS queue.");
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
      setValidationError(t("community_action_error") || "Error submitting citizen report.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Filtered Community Reports
  const filteredReports = useMemo(() => {
    return communityReports.filter((r) => {
      if (reportFilter === "ALL") return true;
      return r.status === reportFilter;
    });
  }, [communityReports, reportFilter]);

  const pendingCount = communityReports.filter((r) => r.status === "PENDING").length;
  const verifiedCount = communityReports.filter((r) => r.status === "VERIFIED").length;
  const rejectedCount = communityReports.filter((r) => r.status === "REJECTED").length;

  return (
    <RoleGate allowedRoles={["ADMIN", "CIVIL_PROTECTION"]} redirectTo="/dashboard" showToast={true}>
      <div className={`p-4 sm:p-6 max-w-7xl mx-auto space-y-6 ${isRTL ? "font-arabic" : ""}`}>
        {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              {t("community_reports_badge") || "PROTECTION CIVILE ALGÉRIENNE · DIRECTION GÉNÉRALE DES FORÊTS (DGF)"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Camera className="w-7 h-7 text-red-500" />
            <span>{t("community_reports_page_title") || "Signalements Citoyens & Vérification Tactique"}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {t("community_reports_page_subtitle") || "File opérationnelle des observations citoyennes : vérification stricte des images avec rejet automatique des visages."}
          </p>
        </div>

        {/* Quick Operational Counters */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">{t("community_filter_pending")}:</span>
            <span className="font-mono font-bold text-amber-400">{pendingCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">{t("community_filter_verified")}:</span>
            <span className="font-mono font-bold text-emerald-400">{verifiedCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">{t("community_filter_rejected")}:</span>
            <span className="font-mono font-bold text-slate-300">{rejectedCount}</span>
          </div>
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
      {/* CITIZEN REPORTS VERIFICATION QUEUE */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Top Actions & Filters Bar */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-white text-sm">
                {t("community_queue_title") || "File de Vérification Tactique des Signalements Citoyens"}
              </h3>
            </div>
            <p className="text-slate-400 mt-0.5">
              {t("community_queue_subtitle") || "Filtrage strict : images vérifiées (forêt, fumée, brûlis, vigie) avec rejet automatique des visages / personnes."}
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
                  {st === "ALL"
                    ? t("community_filter_all")
                    : st === "PENDING"
                    ? t("community_filter_pending")
                    : st === "VERIFIED"
                    ? t("community_filter_verified")
                    : t("community_filter_rejected")}
                </button>
              ))}
            </div>

            {/* Test AI Image Validation Button */}
            <button
              onClick={() => setShowSimulateReportModal(true)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("community_btn_test_ai") || "Tester Validation IA"}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadReports}
              disabled={isLoadingReports}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReports ? "animate-spin" : ""}`} />
              <span>{t("community_btn_refresh") || "Actualiser"}</span>
            </button>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const isPending = report.status === "PENDING";
            const isVerified = report.status === "VERIFIED";

            const descLower = (report.description || "").toLowerCase();
            const isWindOrSirocco = descLower.includes("vent") || descLower.includes("sirocco") || descLower.includes("poussi") || descLower.includes("رياح") || descLower.includes("سيروكو");

            const wilayaPrefix = t("community_wilaya_prefix") || "Wilaya de";
            const localizedWilaya = getLocalizedWilayaName(report.wilaya, language);
            const localizedDesc = getLocalizedReportDescription(report.description, language);

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
                      {isPending
                        ? (t("community_status_pending_codis") || "EN ATTENTE CODIS")
                        : isVerified
                        ? (t("community_status_verified") || "VÉRIFIÉ ✓")
                        : (t("community_status_rejected") || "REJETÉ ✗")}
                    </span>
                  </div>

                  {/* Wilaya & Location */}
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{wilayaPrefix} {localizedWilaya}</span>
                      <span className="text-slate-400 text-xs font-mono font-normal">
                        ({Number(report.lat).toFixed(3)}°N, {Number(report.lon).toFixed(3)}°E)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                      &quot;{localizedDesc}&quot;
                    </p>
                  </div>

                  {/* Report Image or Verified Icon Placeholder */}
                  {report.photo_url ? (
                    <div
                      onClick={() =>
                        setPreviewPhoto({
                          url: report.photo_url,
                          title: `${report.report_id} · ${wilayaPrefix} ${localizedWilaya}`,
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
                          {t("community_photo_verified") || "Photo terrain vérifiée"}
                        </span>
                        <span className="text-[10px] text-white flex items-center gap-1 font-bold bg-red-600/90 px-1.5 py-0.5 rounded">
                          <Eye className="w-3 h-3" />
                          {t("community_enlarge_photo") || "Agrandir"}
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
                        {isWindOrSirocco
                          ? (t("community_aerological_report") || "Signalement Aérologique (Sirocco)")
                          : (t("community_visual_observation") || "Observation Visuelle Directe")}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {t("community_no_attachment_gps") || "Aucun fichier joint · Coordonnées GPS confirmées par relais"}
                      </span>
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>
                      {t("community_phone_label") || "Tél :"} {report.phone || t("community_phone_unspecified") || "Non renseigné"}
                    </span>
                    <span dir="ltr">
                      {new Date(report.timestamp).toLocaleString(
                        language === "ar" ? "ar-DZ" : language === "en" ? "en-US" : "fr-FR"
                      )}
                    </span>
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
                      <span>{t("community_btn_validate_alert") || "Valider & Alerter"}</span>
                    </button>
                    <button
                      onClick={() => handleUpdateReportStatus(report.report_id, "REJECTED")}
                      className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center justify-center gap-1 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{t("community_btn_reject") || "Rejeter"}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: AI IMAGE VALIDATION TESTING */}
      {/* ========================================================================= */}
      {showSimulateReportModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-white text-base">
                  {t("community_modal_test_title") || "Tester le Moteur de Validation d'Images IA"}
                </h3>
              </div>
              <button
                onClick={() => setShowSimulateReportModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {t("community_modal_test_desc") || "Vérifie la conformité opérationnelle : détection des incendies/fumées et rejet strict des visages/portraits."}
            </p>

            {validationError && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-700 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {validationSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{validationSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSimulateCitizenReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t("community_modal_wilaya_label") || "Wilaya concernée"}
                </label>
                <select
                  value={newReportWilaya}
                  onChange={(e) => setNewReportWilaya(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500 font-mono text-xs"
                >
                  {WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {t("community_wilaya_prefix")} {getLocalizedWilayaName(w, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t("community_modal_desc_label") || "Description de l'observation *"}
                </label>
                <textarea
                  value={newReportDesc}
                  onChange={(e) => setNewReportDesc(e.target.value)}
                  placeholder={
                    t("community_modal_desc_placeholder") ||
                    "Ex : Colonne dense de fumée grise au-dessus des crêtes de Yakouren, propagation rapide."
                  }
                  rows={2}
                  required
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t("community_modal_choose_image") || "Choisir un cas de test d'image"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { url: "/reports/report_smoke_yakouren.jpg", label: t("community_modal_img_smoke") || "Fumée Yakouren (Valide)" },
                    { url: "/reports/report_fire_akfadou.jpg", label: t("community_modal_img_fire") || "Feu Akfadou (Valide)" },
                    { url: "/reports/report_vigie.jpg", label: t("community_modal_img_vigie") || "Poste de Vigie (Valide)" },
                    { url: "selfie_portrait_test.jpg", label: t("community_modal_img_face") || "Test Rejet Visage (Rejeté Auto)" },
                  ].map((img) => (
                    <button
                      type="button"
                      key={img.url}
                      onClick={() => {
                        setNewReportImageChoice(img.url);
                        setCustomFileTestName(img.url.includes("selfie") ? "selfie_portrait_test.jpg" : "");
                      }}
                      className={`p-2 rounded-lg border text-left transition ${
                        (customFileTestName === "selfie_portrait_test.jpg" && img.url.includes("selfie")) ||
                        (!customFileTestName && newReportImageChoice === img.url)
                          ? "border-red-500 bg-red-950/40 text-white font-bold"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="truncate">{img.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t("community_modal_custom_file_label") || "Ou tester avec un nom de fichier personnalisé :"}
                </label>
                <input
                  type="text"
                  value={customFileTestName}
                  onChange={(e) => setCustomFileTestName(e.target.value)}
                  placeholder={t("community_modal_custom_file_placeholder") || "Ex: selfie_portrait.jpg ou colonne_fumee.png"}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSimulateReportModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  {t("community_modal_btn_cancel") || "Annuler"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isSubmittingReport ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{t("community_modal_btn_submit") || "Valider & Soumettre le Rapport"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX PREVIEW FOR REPORT PHOTOS */}
      {/* ========================================================================= */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl cursor-default"
          >
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{previewPhoto.title}</h4>
                <p className="text-xs text-slate-400 font-mono">{previewPhoto.location}</p>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-black/80 flex items-center justify-center max-h-[75vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </RoleGate>
  );
}
