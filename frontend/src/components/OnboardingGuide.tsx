"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  BarChart3,
  Users,
  Bell,
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
  Sparkles,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  MousePointerClick,
  Info,
  Clock,
  Layers,
  Camera,
  History,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getStoredUser, UserRole } from "@/lib/auth";
import { useNotifications } from "@/contexts/NotificationContext";

interface TutorialStep {
  id: string;
  target: string;
  fallbackTarget?: string;
  titleKey: string;
  descKey: string;
  hintKey: string;
}

interface TutorialDef {
  id: string;
  titleKey: string;
  descKey: string;
  category: "operational" | "admin";
  duration: number; // in minutes
  roles: UserRole[];
  icon: React.ComponentType<{ className?: string }>;
  steps: TutorialStep[];
}

export const OnboardingGuide: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const { showToast } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();

  // Dialog & Active State
  const [mounted, setMounted] = useState(false);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<TutorialDef | null>(null);
  const [isFullTourActive, setIsFullTourActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [userRole, setUserRole] = useState<UserRole>("CIVIL_PROTECTION");
  const [activeTab, setActiveTab] = useState<"all" | "operational" | "admin">("all");
  
  // Interactive spotlight state
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [wrongClickShake, setWrongClickShake] = useState(false);
  const [actionSuccessPulse, setActionSuccessPulse] = useState(false);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);

  // Load user role and completed tutorials from localStorage
  useEffect(() => {
    setMounted(true);
    const u = getStoredUser();
    if (u?.role) {
      setUserRole(u.role);
    }
    try {
      const stored = localStorage.getItem("inkad_completed_tutorials");
      if (stored) {
        setCompletedTutorials(JSON.parse(stored));
      }
    } catch {
      // storage unavailable
    }
  }, []);

  // Listen for custom trigger events from the header Help button
  useEffect(() => {
    const handleUserUpdate = (e: any) => {
      const u = e.detail || getStoredUser();
      if (u?.role) setUserRole(u.role);
    };

    const handleStartTour = (e: any) => {
      const explicitRole = e?.detail?.role || getStoredUser()?.role || userRole;
      if (explicitRole) setUserRole(explicitRole);
      
      const specificTutId = e?.detail?.tutorialId;
      if (specificTutId) {
        const found = allTutorials.find((tut) => tut.id === specificTutId);
        if (found) {
          startTutorial(found);
          return;
        }
      }
      
      // Default: Open the Help Center Catalog
      setIsHelpCenterOpen(true);
    };

    window.addEventListener("inkad_user_updated", handleUserUpdate);
    window.addEventListener("inkad_start_tour", handleStartTour);
    return () => {
      window.removeEventListener("inkad_user_updated", handleUserUpdate);
      window.removeEventListener("inkad_start_tour", handleStartTour);
    };
  }, [userRole]);

  // Close tutorial runner on route changes
  useEffect(() => {
    setIsHelpCenterOpen(false);
    setActiveTutorial(null);
    setIsFullTourActive(false);
  }, [pathname]);

  // -------------------------------------------------------------
  // Role-Aware Tutorial Definitions
  // -------------------------------------------------------------
  const allTutorials: TutorialDef[] = useMemo(() => [
    // 1. Tactical Map (All Roles)
    {
      id: "tactical_map",
      titleKey: "tut_map_title",
      descKey: "tut_map_desc",
      category: "operational",
      duration: 3,
      roles: ["ADMIN", "CIVIL_PROTECTION", "FOREST_GUARD"],
      icon: Map,
      steps: [
        {
          id: "map_surface",
          target: '[data-tour="map"]',
          titleKey: "tut_map_s1_title",
          descKey: "tut_map_s1_desc",
          hintKey: "tut_map_s1_hint",
        },
        {
          id: "status_ribbon",
          target: '[data-tour="status-bar"]',
          titleKey: "tut_map_s2_title",
          descKey: "tut_map_s2_desc",
          hintKey: "tut_map_s2_hint",
        },
        {
          id: "massifs_presets",
          target: '[data-tour="massifs"]',
          titleKey: "tut_map_s3_title",
          descKey: "tut_map_s3_desc",
          hintKey: "tut_map_s3_hint",
        },
        {
          id: "risk_telemetry",
          target: '[data-tour="risk-panel"]',
          titleKey: "tut_map_s4_title",
          descKey: "tut_map_s4_desc",
          hintKey: "tut_map_s4_hint",
        },
      ],
    },

    // 2. Language & Settings (All Roles)
    {
      id: "settings_profile",
      titleKey: "tut_settings_title",
      descKey: "tut_settings_desc",
      category: "operational",
      duration: 2,
      roles: ["ADMIN", "CIVIL_PROTECTION", "FOREST_GUARD"],
      icon: Sliders,
      steps: [
        {
          id: "lang_switcher",
          target: '[data-tour="lang-switcher"]',
          titleKey: "tut_settings_s1_title",
          descKey: "tut_settings_s1_desc",
          hintKey: "tut_settings_s1_hint",
        },
        {
          id: "profile_avatar",
          target: '[data-tour="profile"]',
          titleKey: "tut_settings_s2_title",
          descKey: "tut_settings_s2_desc",
          hintKey: "tut_settings_s2_hint",
        },
        {
          id: "notif_bell",
          target: '[data-tour="bell"]',
          titleKey: "tut_settings_s3_title",
          descKey: "tut_settings_s3_desc",
          hintKey: "tut_settings_s3_hint",
        },
      ],
    },

    // 3. Dispatch Alert: SMS / Email (Civil Protection & Forest Guard & Admin)
    {
      id: "dispatch_alert",
      titleKey: "tut_dispatch_title",
      descKey: "tut_dispatch_desc",
      category: "operational",
      duration: 3,
      roles: ["CIVIL_PROTECTION", "FOREST_GUARD", "ADMIN"],
      icon: Radio,
      steps: [
        {
          id: "active_alerts",
          target: '[data-tour="nav-alerts"]',
          fallbackTarget: '[data-tour="nav"]',
          titleKey: "tut_dispatch_s1_title",
          descKey: "tut_dispatch_s1_desc",
          hintKey: "tut_dispatch_s1_hint",
        },
        {
          id: "intercom_nav",
          target: '[data-tour="nav-intercom"]',
          fallbackTarget: '[data-tour="nav"]',
          titleKey: "tut_dispatch_s2_title",
          descKey: "tut_dispatch_s2_desc",
          hintKey: "tut_dispatch_s2_hint",
        },
        {
          id: "dispatch_channels",
          target: '[data-tour="nav"]',
          titleKey: "tut_dispatch_s3_title",
          descKey: "tut_dispatch_s3_desc",
          hintKey: "tut_dispatch_s3_hint",
        },
      ],
    },

    // 4. Report Citizen Signal (Civil Protection & Forest Guard & Admin)
    {
      id: "citizen_signal",
      titleKey: "tut_citizen_title",
      descKey: "tut_citizen_desc",
      category: "operational",
      duration: 3,
      roles: ["CIVIL_PROTECTION", "FOREST_GUARD", "ADMIN"],
      icon: Camera,
      steps: [
        {
          id: "more_menu",
          target: '[data-tour="nav-more"]',
          fallbackTarget: '[data-tour="nav"]',
          titleKey: "tut_citizen_s1_title",
          descKey: "tut_citizen_s1_desc",
          hintKey: "tut_citizen_s1_hint",
        },
        {
          id: "citizen_reports",
          target: '[data-tour="nav-citizen"]',
          fallbackTarget: '[data-tour="nav-more"]',
          titleKey: "tut_citizen_s2_title",
          descKey: "tut_citizen_s2_desc",
          hintKey: "tut_citizen_s2_hint",
        },
        {
          id: "escalation_panel",
          target: '[data-tour="roles"]',
          titleKey: "tut_citizen_s3_title",
          descKey: "tut_citizen_s3_desc",
          hintKey: "tut_citizen_s3_hint",
        },
      ],
    },

    // 5. AI Model Health (ADMIN ONLY)
    {
      id: "ai_model_health",
      titleKey: "tut_ai_title",
      descKey: "tut_ai_desc",
      category: "admin",
      duration: 4,
      roles: ["ADMIN"],
      icon: Activity,
      steps: [
        {
          id: "ml_analytics_nav",
          target: '[data-tour="nav-analytics"]',
          fallbackTarget: '[data-tour="nav"]',
          titleKey: "tut_ai_s1_title",
          descKey: "tut_ai_s1_desc",
          hintKey: "tut_ai_s1_hint",
        },
        {
          id: "model_health_nav",
          target: '[data-tour="nav-more"]',
          titleKey: "tut_ai_s2_title",
          descKey: "tut_ai_s2_desc",
          hintKey: "tut_ai_s2_hint",
        },
        {
          id: "live_benchmark",
          target: '[data-tour="brand"]',
          titleKey: "tut_ai_s3_title",
          descKey: "tut_ai_s3_desc",
          hintKey: "tut_ai_s3_hint",
        },
      ],
    },

    // 6. User Management & Accreditations (ADMIN ONLY)
    {
      id: "user_management",
      titleKey: "tut_users_title",
      descKey: "tut_users_desc",
      category: "admin",
      duration: 3,
      roles: ["ADMIN"],
      icon: Users,
      steps: [
        {
          id: "admin_more_nav",
          target: '[data-tour="nav-more"]',
          titleKey: "tut_users_s1_title",
          descKey: "tut_users_s1_desc",
          hintKey: "tut_users_s1_hint",
        },
        {
          id: "users_accreditations",
          target: '[data-tour="nav-users"]',
          fallbackTarget: '[data-tour="nav-more"]',
          titleKey: "tut_users_s2_title",
          descKey: "tut_users_s2_desc",
          hintKey: "tut_users_s2_hint",
        },
        {
          id: "security_rules",
          target: '[data-tour="roles"]',
          titleKey: "tut_users_s3_title",
          descKey: "tut_users_s3_desc",
          hintKey: "tut_users_s3_hint",
        },
      ],
    },
  ], []);

  // Filter tutorials strictly accessible by current user role (RBAC compliance)
  const accessibleTutorials = useMemo(() => {
    return allTutorials.filter((tut) => tut.roles.includes(userRole));
  }, [allTutorials, userRole]);

  // Tab-filtered list in Help Center
  const displayedTutorials = useMemo(() => {
    if (activeTab === "operational") {
      return accessibleTutorials.filter((t) => t.category === "operational");
    }
    if (activeTab === "admin") {
      return accessibleTutorials.filter((t) => t.category === "admin");
    }
    return accessibleTutorials;
  }, [accessibleTutorials, activeTab]);

  // -------------------------------------------------------------
  // Full Onboarding Tour Fallback Steps
  // -------------------------------------------------------------
  const fullTourSteps: TutorialStep[] = useMemo(() => {
    const list: TutorialStep[] = [
      {
        id: "ft_roles",
        target: '[data-tour="roles"]',
        titleKey: "tour_step_roles_title",
        descKey: userRole === "ADMIN" ? "tour_step_roles_desc_admin" : userRole === "CIVIL_PROTECTION" ? "tour_step_roles_desc_protection" : "tour_step_roles_desc_foret",
        hintKey: "tut_map_s2_hint",
      },
      {
        id: "ft_status",
        target: '[data-tour="status-bar"]',
        titleKey: "tour_step_status_bar_title",
        descKey: "tour_step_status_bar_desc",
        hintKey: "tut_map_s2_hint",
      },
      {
        id: "ft_massifs",
        target: '[data-tour="massifs"]',
        titleKey: "tour_step_massifs_title",
        descKey: "tour_step_massifs_desc",
        hintKey: "tut_map_s3_hint",
      },
      {
        id: "ft_map",
        target: '[data-tour="map"]',
        titleKey: "tour_step_map_title",
        descKey: "tour_step_map_desc",
        hintKey: "tut_map_s1_hint",
      },
      {
        id: "ft_risk",
        target: '[data-tour="risk-panel"]',
        titleKey: "tour_step_risk_title",
        descKey: "tour_step_risk_desc",
        hintKey: "tut_map_s4_hint",
      },
      {
        id: "ft_bell",
        target: '[data-tour="bell"]',
        titleKey: "tour_step_bell_title",
        descKey: "tour_step_bell_desc",
        hintKey: "tut_settings_s3_hint",
      },
      {
        id: "ft_profile",
        target: '[data-tour="profile"]',
        titleKey: "tour_step_profile_title",
        descKey: "tour_step_profile_desc",
        hintKey: "tut_settings_s2_hint",
      },
    ];
    return list;
  }, [userRole]);

  // Active steps array
  const currentStepList: TutorialStep[] = useMemo(() => {
    if (activeTutorial) return activeTutorial.steps;
    if (isFullTourActive) return fullTourSteps;
    return [];
  }, [activeTutorial, isFullTourActive, fullTourSteps]);

  const currentStep = currentStepList[stepIndex] || null;

  // -------------------------------------------------------------
  // Measure and Spotlight Target Element
  // -------------------------------------------------------------
  const updateTargetPosition = useCallback(() => {
    if (!currentStep) {
      setTargetRect(null);
      return;
    }

    let el = document.querySelector(currentStep.target) as HTMLElement | null;
    if (!el && currentStep.fallbackTarget) {
      el = document.querySelector(currentStep.fallbackTarget) as HTMLElement | null;
    }

    if (!el) {
      setTargetRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    // Scroll smoothly into view if offscreen
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentStep]);

  useEffect(() => {
    if (!currentStep) return;
    updateTargetPosition();

    const handleResize = () => updateTargetPosition();
    const handleScroll = () => updateTargetPosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [currentStep, updateTargetPosition]);

  // -------------------------------------------------------------
  // Interactive Action Detection ("Try it now" click listener)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!currentStep) return;

    let el = document.querySelector(currentStep.target) as HTMLElement | null;
    if (!el && currentStep.fallbackTarget) {
      el = document.querySelector(currentStep.fallbackTarget) as HTMLElement | null;
    }

    if (!el) return;

    const handleActionClick = () => {
      setActionSuccessPulse(true);
      setTimeout(() => setActionSuccessPulse(false), 500);

      // Automatically advance to the next step when clicked
      setTimeout(() => {
        handleNext();
      }, 350);
    };

    el.addEventListener("click", handleActionClick, { once: true });
    return () => {
      el?.removeEventListener("click", handleActionClick);
    };
  }, [currentStep, stepIndex]);

  // -------------------------------------------------------------
  // Navigation Controls
  // -------------------------------------------------------------
  const handleNext = () => {
    if (stepIndex < currentStepList.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      finishTutorial();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const finishTutorial = () => {
    if (activeTutorial) {
      const tutId = activeTutorial.id;
      const updated = Array.from(new Set([...completedTutorials, tutId]));
      setCompletedTutorials(updated);
      try {
        localStorage.setItem("inkad_completed_tutorials", JSON.stringify(updated));
      } catch {
        // storage unavailable
      }

      showToast({
        title: t("tutorial_toast_completed_title"),
        message: t("tutorial_toast_completed_msg", { name: t(activeTutorial.titleKey) }),
        risk_level: "low",
      });
    }

    setActiveTutorial(null);
    setIsFullTourActive(false);
    setStepIndex(0);
    setTargetRect(null);
  };

  const handleSkip = () => {
    setActiveTutorial(null);
    setIsFullTourActive(false);
    setStepIndex(0);
    setTargetRect(null);
  };

  // Wrong click prompt
  const handleOverlayWrongClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWrongClickShake(true);
    setTimeout(() => setWrongClickShake(false), 450);
  };

  // Start specific tutorial from catalog
  const startTutorial = (tut: TutorialDef) => {
    setIsHelpCenterOpen(false);
    setIsFullTourActive(false);
    setActiveTutorial(tut);
    setStepIndex(0);
  };

  // Start Full Tour from catalog
  const startFullTour = () => {
    setIsHelpCenterOpen(false);
    setActiveTutorial(null);
    setIsFullTourActive(true);
    setStepIndex(0);
  };

  if (!mounted) return null;

  const isRunnerActive = (activeTutorial !== null || isFullTourActive) && currentStep !== null;
  const isLast = stepIndex === currentStepList.length - 1;

  // Smart floating position for the non-blocking side panel
  // If target element is in bottom right, shift panel to top or left
  const isTargetBottomRight = targetRect && targetRect.bottom > window.innerHeight * 0.55 && targetRect.right > window.innerWidth * 0.55;

  return (
    <>
      {/* ============================================================ */}
      {/* 1. HELP CENTER & TUTORIAL CATALOG MODAL */}
      {/* ============================================================ */}
      {isHelpCenterOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-center-heading"
          className="fixed inset-0 z-[2900] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setIsHelpCenterOpen(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 shrink-0">
                  <BookOpen className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="help-center-heading" className="text-base sm:text-lg font-bold text-white tracking-wide">
                      {t("help_center_title")}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-800 border border-slate-700 text-slate-300">
                      {userRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {t("help_center_subtitle")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpCenterOpen(false)}
                aria-label={t("help_center_close")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Tour Hero Banner */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    {t("help_center_general_tour_title")}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  {t("help_center_general_tour_desc")}
                </p>
              </div>
              <button
                type="button"
                onClick={startFullTour}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition-all shrink-0 min-h-[38px]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t("help_center_start_tour")}</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 sm:px-6 pt-4 pb-2 border-b border-slate-800/60 flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === "all"
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t("help_center_tab_all")} ({accessibleTutorials.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("operational")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === "operational"
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t("help_center_tab_operational")}
              </button>
              {userRole === "ADMIN" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("admin")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    activeTab === "admin"
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t("help_center_tab_admin")}
                </button>
              )}
            </div>

            {/* Tutorial Cards Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {displayedTutorials.map((tut) => {
                  const Icon = tut.icon;
                  const isDone = completedTutorials.includes(tut.id);

                  return (
                    <div
                      key={tut.id}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 group-hover:text-emerald-400 transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                              {t(tut.titleKey)}
                            </h4>
                          </div>
                          {isDone && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t("help_center_completed_badge")}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {t(tut.descKey)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{t("help_center_duration", { min: tut.duration })}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-500" />
                            <span>{t("help_center_steps_count", { count: tut.steps.length })}</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => startTutorial(tut)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500 transition-all"
                        >
                          {isDone ? (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              <span>{t("help_center_restart_tutorial")}</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>{t("help_center_start_tutorial")}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. INTERACTIVE SPOTLIGHT CUTOUT OVERLAY */}
      {/* ============================================================ */}
      {isRunnerActive && targetRect && (
        <div
          role="presentation"
          onClick={handleOverlayWrongClick}
          className="fixed inset-0 z-[2500] pointer-events-auto cursor-default transition-all duration-200"
          style={{ width: "100vw", height: "100vh" }}
        >
          <svg
            className="w-full h-full"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            <defs>
              <mask id="tutorial-spotlight-mask">
                {/* Opaque white covers entire screen */}
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {/* Cutout rectangle exposing target element */}
                <rect
                  x={Math.max(0, targetRect.left - 6)}
                  y={Math.max(0, targetRect.top - 6)}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="12"
                  ry="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(2, 6, 23, 0.78)"
              mask="url(#tutorial-spotlight-mask)"
            />
          </svg>

          {/* Glowing Beacon Ring around targeted element */}
          <div
            className={`fixed rounded-xl border-2 pointer-events-none transition-all duration-300 ${
              actionSuccessPulse
                ? "border-emerald-300 ring-8 ring-emerald-400/50 scale-105"
                : wrongClickShake
                ? "border-amber-400 ring-4 ring-amber-400/40"
                : "border-emerald-400 ring-4 ring-emerald-500/20"
            }`}
            style={{
              top: Math.max(0, targetRect.top - 6),
              left: Math.max(0, targetRect.left - 6),
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              zIndex: 2510,
            }}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. NON-BLOCKING FLOATING TUTORIAL PANEL */}
      {/* ============================================================ */}
      {isRunnerActive && currentStep && (
        <aside
          role="dialog"
          aria-label={t(currentStep.titleKey)}
          className={`fixed z-[2600] max-w-sm sm:max-w-md w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all duration-200 ${
            wrongClickShake ? "animate-[bounce_0.4s_ease-in-out]" : ""
          } ${
            isTargetBottomRight ? "top-20" : "bottom-6"
          } ${
            isRTL ? "left-4 sm:left-6" : "right-4 sm:right-6"
          }`}
          style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
        >
          {/* Panel Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {activeTutorial ? t(activeTutorial.titleKey) : t("help_center_general_tour_title")}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {t("tutorial_step_counter", { current: stepIndex + 1, total: currentStepList.length })}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              aria-label={t("tutorial_exit")}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Body */}
          <div className="py-3.5 space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {t(currentStep.titleKey)}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t(currentStep.descKey)}
            </p>

            {/* Interactive "Try it now" Action Prompt Banner */}
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
                actionSuccessPulse
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-400/50"
                  : wrongClickShake
                  ? "bg-amber-950/80 border-amber-500 text-amber-200"
                  : "bg-slate-950/70 border-slate-800 text-slate-200"
              }`}
            >
              <MousePointerClick
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  actionSuccessPulse ? "text-emerald-400 animate-spin" : "text-emerald-400"
                }`}
              />
              <div className="text-xs space-y-0.5">
                <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-400 block">
                  {t("tutorial_try_it_now")}
                </span>
                <p className="leading-snug">
                  {wrongClickShake
                    ? t("tutorial_wrong_target_prompt")
                    : t(currentStep.hintKey)}
                </p>
              </div>
            </div>

            {/* Clickable Step Progress Dots */}
            <div className="flex items-center justify-start gap-1.5 pt-1">
              {currentStepList.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStepIndex(i)}
                  aria-label={`${t("tutorial_next")} ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === stepIndex
                      ? "w-6 bg-emerald-400 shadow-sm shadow-emerald-500/50"
                      : "w-2 bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Accessible Footer Buttons (Fitts' Law) */}
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors min-h-[38px]"
            >
              {t("tutorial_skip")}
            </button>

            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors min-h-[38px]"
                >
                  <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span>{t("tutorial_back")}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition-all min-h-[38px]"
              >
                <span>{isLast ? t("tutorial_complete") : t("tutorial_next")}</span>
                {!isLast && <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />}
                {isLast && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </aside>
      )}
      {/* Floating launcher trigger button (accessible at all times when modal/runner not active) */}
      {!isHelpCenterOpen && !isRunnerActive && (
        <button
          type="button"
          onClick={() => setIsHelpCenterOpen(true)}
          title={t("tour_open_guide_tooltip") || "Tutorials"}
          aria-label={t("tour_open_guide_tooltip") || "Tutorials"}
          className="fixed bottom-4 right-4 rtl:right-auto rtl:left-4 z-[2000] flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/80 text-slate-300 hover:text-white text-xs font-semibold shadow-2xl shadow-black/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 group"
        >
          <HelpCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <span>{t("tour_guide_btn") || "Guide"}</span>
        </button>
      )}
    </>
  );
};
