"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Shield,
  BarChart3,
  Users,
  Bell,
  Trees,
  Map,
  Activity,
  Radio,
  Plane,
  Cpu,
  X,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Flame,
  ShieldAlert,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getStoredUser, UserRole } from "@/lib/auth";

interface StepDef {
  id: string;
  target: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  preferredPlacement?: "top" | "bottom";
}

export const OnboardingGuide: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [userRole, setUserRole] = useState<UserRole>("CIVIL_PROTECTION");
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom";
    arrowLeft: number;
  }>({
    top: 100,
    left: 20,
    placement: "bottom",
    arrowLeft: 40,
  });

  // Track logged-in role dynamically
  useEffect(() => {
    setMounted(true);
    const u = getStoredUser();
    if (u?.role) {
      setUserRole(u.role);
    }
  }, []);

  // Listen for role updates or custom tour triggers
  useEffect(() => {
    const handleUserUpdate = (e: any) => {
      const u = e.detail || getStoredUser();
      if (u?.role) setUserRole(u.role);
    };
    const handleStartTour = (e: any) => {
      const explicitRole = e?.detail?.role || getStoredUser()?.role || userRole;
      if (explicitRole) setUserRole(explicitRole);
      setStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("inkad_user_updated", handleUserUpdate);
    window.addEventListener("inkad_start_tour", handleStartTour);
    return () => {
      window.removeEventListener("inkad_user_updated", handleUserUpdate);
      window.removeEventListener("inkad_start_tour", handleStartTour);
    };
  }, [userRole]);

  // Close tour on page navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Comprehensive, Role-Aware Guide Steps
  const allSteps: StepDef[] = useMemo(() => {
    const steps: StepDef[] = [
      // 1. Institutional Brand & Mission
      {
        id: "brand",
        target: '[data-tour="brand"]',
        icon: Shield,
        title: t("tour_step_brand_title") || "INKAD · National Early Warning System",
        desc: t("tour_step_brand_desc") || "Official institutional command console for predictive wildfire surveillance across Northern Algeria. Calibrated specifically for high-risk Mediterranean and pine massifs.",
        preferredPlacement: "bottom",
      },
      // 2. Command Role & Multi-Agency Switcher
      {
        id: "roles",
        target: '[data-tour="roles"]',
        icon: Users,
        title: t("tour_step_roles_title") || "Multi-Agency Command Switcher",
        desc:
          userRole === "ADMIN"
            ? (t("tour_step_roles_desc_admin") || "Central Command identity. Allows instant one-click switching between Civil Protection (DGPC), Forest Conservation (DGF), and General Directorate to inspect multi-agency operational readiness.")
            : userRole === "CIVIL_PROTECTION"
            ? (t("tour_step_roles_desc_protection") || "Operational identity: Civil Protection Directorate (CODIS). Directly coordinates quick-response mobile columns, water bomber flight corridors, and evacuation dispatches.")
            : (t("tour_step_roles_desc_foret") || "Field operations identity: General Directorate of Forests (DGF). Connects lookout watchtowers, ranger teams, and early thermal detection sensors."),
        preferredPlacement: "bottom",
      },
      // 3. Operational Watch Status Bar
      {
        id: "status-bar",
        target: '[data-tour="status-bar"]',
        icon: Activity,
        title: t("tour_step_status_bar_title") || "Live Operational Telemetry Ribbon",
        desc: t("tour_step_status_bar_desc") || "Monitors live feeds from NASA FIRMS satellites (thermal hotspots), Open-Meteo aerological stations (Sirocco wind & humidity), and the live XGBoost AI model inference precision (95.4%).",
        preferredPlacement: "bottom",
      },
      // 4. Strategic Forest Massifs & Legend
      {
        id: "massifs",
        target: '[data-tour="massifs"]',
        icon: Trees,
        title: t("tour_step_massifs_title") || "Strategic Forest Massifs & [W. N°] Codes",
        desc: t("tour_step_massifs_desc") || "Quick inspection selector for 14 priority forest massifs (Yakouren, Akfadou, Chréa, etc.). The badge [W. N°] indicates the official Algerian Wilaya code (e.g. W.15 for Tizi Ouzou, W.06 for Béjaïa). Click any card to re-center the map and simulate localized hazard.",
        preferredPlacement: "bottom",
      },
      // 5. Navigation Bar & Workflows
      {
        id: "nav",
        target: '[data-tour="nav"]',
        icon: Radio,
        title: t("tour_step_nav_title") || "Operational Navigation & Workflows",
        desc:
          userRole === "ADMIN"
            ? (t("tour_step_nav_desc_admin") || "Direct access to Tactical Map, Active Alerts, ML Analytics, and Intercom dispatch. The '... More' dropdown houses User Accreditations, Model Health Telemetry, and Drones.")
            : (t("tour_step_nav_desc_field") || "Direct access to Tactical Map, Active Alerts, and Intercom dispatch. The '... More' dropdown provides access to FLIR Drones, IoT Vigies, History, and Citizen Reports."),
        preferredPlacement: "bottom",
      },
      // 6. Tactical Map & Environmental Controls
      {
        id: "map",
        target: '[data-tour="map"]',
        icon: Map,
        title: t("tour_step_map_title") || "Interactive Tactical Map & Environmental Controls",
        desc: t("tour_step_map_desc") || "Multi-layer cartography (Satellite, Dark, OSM Streets). Toggle live Sirocco wind vector flows, DGF watchtower radio relays, FLIR drone patrols, and download offline cached maps.",
        preferredPlacement: "bottom",
      },
      // 7. Dynamic Huygens Propagation Simulation
      {
        id: "simulation",
        target: '[data-tour="simulation"]',
        icon: Flame,
        title: t("tour_step_simulation_title") || "6-Hour Fire Spread Simulator",
        desc: t("tour_step_simulation_desc") || "Project fire perimeter expansion over a 6-hour horizon using elliptical Huygens wavelets calibrated to local slope, fuel type, and wind speed. Use the timeline to inspect hourly progression.",
        preferredPlacement: "top",
      },
      // 8. AI Risk Index & Transparent Factors
      {
        id: "risk-panel",
        target: '[data-tour="risk-panel"]',
        icon: BarChart3,
        title: t("tour_step_risk_title") || "AI Risk Index & Canadian FWI Panel",
        desc: t("tour_step_risk_desc") || "Real-time wildfire hazard percentage computed by the XGBoost v2.1 model and Canadian FWI system (FFMC, ISI, BUI). Transparent AI explanations break down contributing factors: temperature, wind velocity, and relative humidity. You can also simulate custom weather overrides.",
        preferredPlacement: "top",
      },
      // 9. Real-Time Alerts & Notification Center
      {
        id: "bell",
        target: '[data-tour="bell"]',
        icon: Bell,
        title: t("tour_step_bell_title") || "Real-Time Alerts & Notification Hub",
        desc: t("tour_step_bell_desc") || "Instant Server-Sent Events (SSE) notification stream. Listen for two-tone audio alerts on high-risk detections, review inter-agency dispatches, and delete or clear notifications.",
        preferredPlacement: "bottom",
      },
      // 10. Admin Governance & Security (ADMIN ONLY)
      ...(userRole === "ADMIN"
        ? [
            {
              id: "admin-tools",
              target: '[data-tour="nav"]',
              icon: ShieldAlert,
              title: t("tour_step_admin_tools_title") || "Central Administration & User Governance",
              desc: t("tour_step_admin_tools_desc") || "As Super Admin, you have dedicated access to User Management (provision personnel, suspend/block compromised accounts, log incident reports) and Model Health (track inference latency and API telemetry).",
              roles: ["ADMIN" as UserRole],
              preferredPlacement: "bottom" as const,
            },
          ]
        : []),
      // 11. Profile, Language & Instant Help
      {
        id: "profile",
        target: '[data-tour="profile"]',
        icon: HelpCircle,
        title: t("tour_step_profile_title") || "Profile, Languages & Instant Help",
        desc: t("tour_step_profile_desc") || "Manage your credentials, change language (English, Français, العربية), upload an official avatar, or click the Help (?) icon in the top bar anytime to replay this tour.",
        preferredPlacement: "bottom",
      },
    ];

    return steps;
  }, [t, userRole]);

  // Filter steps strictly available and visible on the current active page
  const availableSteps = useMemo(() => {
    if (typeof window === "undefined" || !mounted) return [];
    return allSteps.filter((step) => {
      // Role check
      if (step.roles && !step.roles.includes(userRole)) return false;

      const el = document.querySelector(step.target) as HTMLElement | null;
      return Boolean(el && (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0));
    });
  }, [allSteps, mounted, pathname, isOpen, userRole]);

  // Automatic launch on first login per role strictly on /dashboard
  useEffect(() => {
    if (typeof window === "undefined" || !mounted) return;
    if (pathname !== "/dashboard") return;

    const storageKey = `inkad_guide_seen_${userRole.toLowerCase()}`;
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      const timer = setTimeout(() => {
        const hasBrand = document.querySelector('[data-tour="brand"]');
        if (hasBrand) {
          setStepIndex(0);
          setIsOpen(true);
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [pathname, mounted, userRole]);

  // Update target positioning when step changes or on window resize/scroll
  const updatePosition = useCallback(() => {
    if (!isOpen) return;
    const currentStep = availableSteps[stepIndex];
    if (!currentStep) return;

    const el = document.querySelector(currentStep.target) as HTMLElement | null;
    if (!el) {
      setTargetRect(null);
      return;
    }

    // Scroll element smoothly into view
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    const tooltipWidth = Math.min(420, window.innerWidth - 32);
    const tooltipHeight = 260;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: "top" | "bottom" = "bottom";
    let top = 0;

    if (currentStep.preferredPlacement === "top" && spaceAbove > tooltipHeight + 16) {
      placement = "top";
      top = rect.top - tooltipHeight - 14;
    } else if (spaceBelow < tooltipHeight + 20 && spaceAbove > tooltipHeight + 16) {
      placement = "top";
      top = rect.top - tooltipHeight - 14;
    } else {
      placement = "bottom";
      top = rect.bottom + 14;
    }

    top = Math.max(16, Math.min(window.innerHeight - tooltipHeight - 16, top));

    const targetCenter = rect.left + rect.width / 2;
    let left = targetCenter - tooltipWidth / 2;
    left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left));

    const arrowLeft = Math.max(28, Math.min(tooltipWidth - 28, targetCenter - left));

    setCoords({
      top,
      left,
      placement,
      arrowLeft,
    });
  }, [isOpen, stepIndex, availableSteps]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(updatePosition, 120);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen, stepIndex, updatePosition]);

  // Keyboard navigation: Escape to close, Arrows to navigate
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        if (isRTL) handlePrev();
        else handleNext();
      } else if (e.key === "ArrowLeft") {
        if (isRTL) handleNext();
        else handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, stepIndex, availableSteps.length, isRTL]);

  const handleClose = () => {
    const storageKey = `inkad_guide_seen_${userRole.toLowerCase()}`;
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (stepIndex < availableSteps.length - 1) {
      setStepIndex((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((s) => s - 1);
    }
  };

  const handleRestart = () => {
    setStepIndex(0);
    setIsOpen(true);
  };

  if (!mounted) return null;
  if (!pathname || pathname === "/login" || pathname === "/" || !pathname.startsWith("/dashboard")) {
    return null;
  }

  if (availableSteps.length === 0) {
    return null;
  }

  const currentStep = availableSteps[stepIndex] || availableSteps[0];
  const StepIcon = currentStep?.icon || Shield;
  const isLast = stepIndex === availableSteps.length - 1;
  const progressPercent = Math.round(((stepIndex + 1) / availableSteps.length) * 100);

  const roleBadgeLabel =
    userRole === "ADMIN"
      ? (t("tour_role_badge_admin") || "ADMIN COMMAND GUIDE")
      : userRole === "CIVIL_PROTECTION"
      ? (t("tour_role_badge_protection") || "CIVIL PROTECTION GUIDE")
      : (t("tour_role_badge_foret") || "FOREST CONSERVATION GUIDE");

  return (
    <>
      {/* Floating trigger button in bottom right for returning users */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleRestart}
          title={t("tour_open_guide_tooltip") || "Start Interactive Guide"}
          className="fixed bottom-4 right-4 z-[2000] flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/80 text-slate-300 hover:text-white text-xs font-semibold shadow-2xl shadow-black/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 group"
        >
          <HelpCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <span>{t("tour_guide_btn") || "Guide"}</span>
        </button>
      )}

      {isOpen && (
        <>
          {/* Target Element Spotlight Ring & High-Z Cutout */}
          {targetRect && (
            <div
              className="fixed pointer-events-none transition-all duration-300 z-[2810] rounded-xl ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_0_9999px_rgba(2,6,23,0.78)]"
              style={{
                top: Math.max(0, targetRect.top - 6),
                left: Math.max(0, targetRect.left - 6),
                width: targetRect.width + 12,
                height: targetRect.height + 12,
              }}
            >
              {/* Pulsing corner beacon */}
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </div>
          )}

          {/* Fallback backdrop click dismiss */}
          {!targetRect && (
            <div
              onClick={handleClose}
              className="fixed inset-0 z-[2800] bg-slate-950/80 backdrop-blur-sm"
            />
          )}

          {/* Contextual Anchored Tooltip Box */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("tour_guide_title") || "INKAD Guide"}
            className="fixed z-[2900] w-[calc(100vw-32px)] max-w-[420px] bg-slate-900 border border-emerald-700/60 rounded-2xl p-5 text-slate-100 shadow-2xl shadow-black/90 transition-all duration-200"
            style={
              targetRect
                ? {
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                  }
                : {
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }
            }
          >
            {/* Directional pointer arrow */}
            {targetRect && coords.placement === "bottom" && (
              <div
                className="absolute -top-2 w-4 h-4 bg-slate-900 border-l border-t border-emerald-700/60 rotate-45 pointer-events-none"
                style={{
                  left: `${coords.arrowLeft}px`,
                  transform: "translateX(-50%) rotate(45deg)",
                }}
              />
            )}
            {targetRect && coords.placement === "top" && (
              <div
                className="absolute -bottom-2 w-4 h-4 bg-slate-900 border-r border-b border-emerald-700/60 rotate-45 pointer-events-none"
                style={{
                  left: `${coords.arrowLeft}px`,
                  transform: "translateX(-50%) rotate(45deg)",
                }}
              />
            )}

            {/* Header: Role Badge + Step Counter + Close */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-[10px] font-mono font-bold tracking-wider uppercase">
                  {roleBadgeLabel}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {t("tour_step_counter", { current: stepIndex + 1, total: availableSteps.length })}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label={t("close") || "Close"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden mt-2.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Content: Icon + Title & Description */}
            <div className="py-3.5 space-y-2">
              <div className="flex items-center gap-2.5 text-emerald-300">
                <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 shrink-0">
                  <StepIcon className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight leading-snug">
                  {currentStep.title}
                </h2>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {currentStep.desc}
              </p>
            </div>

            {/* Clickable Progress Dots */}
            <div className="flex items-center justify-start gap-1.5 py-1">
              {availableSteps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStepIndex(i)}
                  aria-label={`${t("tour_next")} ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === stepIndex
                      ? "w-6 bg-emerald-400 shadow-sm shadow-emerald-500/50"
                      : "w-2 bg-slate-700/80 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>

            {/* Accessible Footer Buttons (Fitts' Law) */}
            <div className="flex items-center justify-between pt-3.5 mt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-800 min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {t("tour_skip") || "Skip Tour"}
              </button>

              <div className="flex items-center gap-2">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                    <span>{t("tour_previous") || "Previous"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-all min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <span>{isLast ? (t("tour_finish") || "Complete Guide") : (t("tour_next") || "Next Step")}</span>
                  {!isLast && <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />}
                  {isLast && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
