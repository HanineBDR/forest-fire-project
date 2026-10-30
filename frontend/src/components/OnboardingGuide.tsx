"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
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
  Search,
  Loader2,
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
  category: "field" | "admin";
  duration: number; // in minutes
  roles: UserRole[];
  icon: React.ComponentType<{ className?: string }>;
  themeColor: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  steps: TutorialStep[];
}

export const OnboardingGuide: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const { showToast, dismissToast } = useNotifications();
  const pathname = usePathname();

  // State
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("CIVIL_PROTECTION");
  const [userId, setUserId] = useState<string>("default");

  // Modal & Tutorial state
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<TutorialDef | null>(null);
  const [isFullTourActive, setIsFullTourActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "field" | "admin">("all");

  // Progress Tracking in LocalStorage
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  const [hasCompletedFullTour, setHasCompletedFullTour] = useState(false);

  // Target positioning & Spotlight
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [activeTargetSelector, setActiveTargetSelector] = useState<string>("");
  const [shakeWarning, setShakeWarning] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);

  // Load user info & saved progress
  useEffect(() => {
    setMounted(true);
    const u = getStoredUser();
    const effectiveRole = u?.role || "CIVIL_PROTECTION";
    const effectiveId = u?.id || effectiveRole.toLowerCase();
    setUserRole(effectiveRole);
    setUserId(effectiveId);

    try {
      const storageKey = `completed_tutorials_${effectiveId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCompletedTutorials(JSON.parse(saved));
      }
      const tourSaved = localStorage.getItem(`tour_completed_${effectiveId}`);
      if (tourSaved === "true") {
        setHasCompletedFullTour(true);
      }
    } catch (e) {
      console.error("Error reading tutorial progress from localStorage", e);
    }
  }, []);

  // Listen for role updates or custom tour triggers from header / buttons
  useEffect(() => {
    const handleUserUpdate = (e: any) => {
      const u = e.detail || getStoredUser();
      if (u?.role) {
        setUserRole(u.role);
        const effectiveId = u.id || u.role.toLowerCase();
        setUserId(effectiveId);
        try {
          const saved = localStorage.getItem(`completed_tutorials_${effectiveId}`);
          setCompletedTutorials(saved ? JSON.parse(saved) : []);
          const tourSaved = localStorage.getItem(`tour_completed_${effectiveId}`);
          setHasCompletedFullTour(tourSaved === "true");
        } catch {
          setCompletedTutorials([]);
        }
      }
    };

    const handleStartTour = (e: any) => {
      dismissToast(); // Clean up existing toasts
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
  }, [userRole, dismissToast]);

  // Clean up toasts when help center opens
  useEffect(() => {
    if (isHelpCenterOpen) {
      dismissToast();
    }
  }, [isHelpCenterOpen, dismissToast]);

  // Cancel guide only if user navigates to public/login pages
  useEffect(() => {
    if (pathname === "/login" || pathname === "/") {
      setIsHelpCenterOpen(false);
      setActiveTutorial(null);
      setIsFullTourActive(false);
    }
  }, [pathname]);

  // -------------------------------------------------------------
  // Role-Aware Tutorial Definitions
  // -------------------------------------------------------------
  const allTutorials: TutorialDef[] = useMemo(() => [
    // 1. Tactical Map (All Roles: ADMIN, CIVIL_PROTECTION, FOREST_GUARD)
    {
      id: "tactical_map",
      titleKey: "tut_map_title",
      descKey: "tut_map_desc",
      category: "field",
      duration: 3,
      roles: ["ADMIN", "CIVIL_PROTECTION", "FOREST_GUARD"],
      icon: Map,
      themeColor: {
        bg: "bg-emerald-950/60",
        border: "border-emerald-700/60",
        text: "text-emerald-400",
        badge: "bg-emerald-950/80 border-emerald-800 text-emerald-300",
      },
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

    // 2. Alert Dispatch: SMS / Email (ADMIN & CIVIL_PROTECTION ONLY)
    {
      id: "dispatch_alert",
      titleKey: "tut_dispatch_title",
      descKey: "tut_dispatch_desc",
      category: "field",
      duration: 3,
      roles: ["CIVIL_PROTECTION", "ADMIN"],
      icon: Radio,
      themeColor: {
        bg: "bg-red-950/60",
        border: "border-red-700/60",
        text: "text-red-400",
        badge: "bg-red-950/80 border-red-800 text-red-300",
      },
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

    // 3. Citizen Signals & Email Reports (ADMIN & CIVIL_PROTECTION ONLY)
    {
      id: "citizen_signal",
      titleKey: "tut_citizen_title",
      descKey: "tut_citizen_desc",
      category: "field",
      duration: 3,
      roles: ["CIVIL_PROTECTION", "ADMIN"],
      icon: Camera,
      themeColor: {
        bg: "bg-amber-950/60",
        border: "border-amber-700/60",
        text: "text-amber-400",
        badge: "bg-amber-950/80 border-amber-800 text-amber-300",
      },
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

    // 4. IoT Vigies & Thermal Drones (ADMIN & FOREST_GUARD ONLY)
    {
      id: "iot_drones",
      titleKey: "tut_iot_title",
      descKey: "tut_iot_desc",
      category: "field",
      duration: 3,
      roles: ["FOREST_GUARD", "ADMIN"],
      icon: Plane,
      themeColor: {
        bg: "bg-cyan-950/60",
        border: "border-cyan-700/60",
        text: "text-cyan-400",
        badge: "bg-cyan-950/80 border-cyan-800 text-cyan-300",
      },
      steps: [
        {
          id: "more_tools",
          target: '[data-tour="nav-more"]',
          fallbackTarget: '[data-tour="nav"]',
          titleKey: "tut_iot_s1_title",
          descKey: "tut_iot_s1_desc",
          hintKey: "tut_iot_s1_hint",
        },
        {
          id: "iot_vigies",
          target: '[data-tour="iot"]',
          fallbackTarget: '[data-tour="nav-more"]',
          titleKey: "tut_iot_s2_title",
          descKey: "tut_iot_s2_desc",
          hintKey: "tut_iot_s2_hint",
        },
        {
          id: "massif_telemetry",
          target: '[data-tour="status-bar"]',
          titleKey: "tut_iot_s3_title",
          descKey: "tut_iot_s3_desc",
          hintKey: "tut_iot_s3_hint",
        },
      ],
    },

    // 5. AI Model Health & Telemetry (ADMIN ONLY)
    {
      id: "ai_model_health",
      titleKey: "tut_ai_title",
      descKey: "tut_ai_desc",
      category: "admin",
      duration: 4,
      roles: ["ADMIN"],
      icon: Activity,
      themeColor: {
        bg: "bg-purple-950/60",
        border: "border-purple-700/60",
        text: "text-purple-400",
        badge: "bg-purple-950/80 border-purple-800 text-purple-300",
      },
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

    // 6. User Management & Institutional Accreditations (ADMIN ONLY)
    {
      id: "user_management",
      titleKey: "tut_users_title",
      descKey: "tut_users_desc",
      category: "admin",
      duration: 3,
      roles: ["ADMIN"],
      icon: Users,
      themeColor: {
        bg: "bg-blue-950/60",
        border: "border-blue-700/60",
        text: "text-blue-400",
        badge: "bg-blue-950/80 border-blue-800 text-blue-300",
      },
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

  // -------------------------------------------------------------
  // STRICT RBAC FILTERING: Remove unauthorized tutorials from DOM
  // -------------------------------------------------------------
  const roleTutorials = useMemo(() => {
    return allTutorials.filter((tut) => tut.roles.includes(userRole));
  }, [allTutorials, userRole]);

  // Categories strictly present in the accessible tutorials
  const availableCategories = useMemo(() => {
    const cats = new Set(roleTutorials.map((tut) => tut.category));
    return Array.from(cats);
  }, [roleTutorials]);

  // Reset category tab to 'all' if active tab becomes unavailable
  useEffect(() => {
    if (selectedCategory !== "all" && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [availableCategories, selectedCategory]);

  // Dynamic category filtering
  const categoryTutorials = useMemo(() => {
    if (selectedCategory === "all") return roleTutorials;
    return roleTutorials.filter((tut) => tut.category === selectedCategory);
  }, [roleTutorials, selectedCategory]);

  // Dynamic search query filtering
  const displayedTutorials = useMemo(() => {
    if (!searchQuery.trim()) return categoryTutorials;
    const q = searchQuery.toLowerCase().trim();
    return categoryTutorials.filter((tut) => {
      const title = (t(tut.titleKey) || "").toLowerCase();
      const desc = (t(tut.descKey) || "").toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [categoryTutorials, searchQuery, t]);

  // Progress metrics
  const completedCount = useMemo(() => {
    return roleTutorials.filter((tut) => completedTutorials.includes(tut.id)).length;
  }, [roleTutorials, completedTutorials]);

  const totalCount = roleTutorials.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // LocalStorage record helpers
  const recordTutorialCompletion = useCallback((tutId: string) => {
    const currentUserId = userId || "default";
    const storageKey = `completed_tutorials_${currentUserId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      const set = new Set<string>(saved ? JSON.parse(saved) : []);
      set.add(tutId);
      const updated = Array.from(set);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setCompletedTutorials(updated);
    } catch (e) {
      console.error("Failed to save completed tutorial", e);
    }
  }, [userId]);

  const recordFullTourCompletion = useCallback(() => {
    const currentUserId = userId || "default";
    try {
      localStorage.setItem(`tour_completed_${currentUserId}`, "true");
      setHasCompletedFullTour(true);
      recordTutorialCompletion("full_tour");
    } catch (e) {
      console.error("Failed to save full tour completion", e);
    }
  }, [userId, recordTutorialCompletion]);

  // Full Tour Steps
  const fullTourSteps: TutorialStep[] = useMemo(() => {
    return [
      {
        id: "tour_brand",
        target: '[data-tour="brand"]',
        titleKey: "tour_step_brand_title",
        descKey: "tour_step_brand_desc",
        hintKey: "tut_map_s1_hint",
      },
      {
        id: "tour_roles",
        target: '[data-tour="roles"]',
        titleKey: "tour_step_roles_title",
        descKey: "tour_step_roles_desc",
        hintKey: "tut_settings_s2_hint",
      },
      {
        id: "tour_nav",
        target: '[data-tour="nav"]',
        titleKey: "tour_step_nav_title",
        descKey: "tour_step_nav_desc",
        hintKey: "tut_dispatch_s1_hint",
      },
      {
        id: "tour_status_bar",
        target: '[data-tour="status-bar"]',
        titleKey: "tut_map_s2_title",
        descKey: "tut_map_s2_desc",
        hintKey: "tut_map_s2_hint",
      },
      {
        id: "tour_massifs",
        target: '[data-tour="massifs"]',
        titleKey: "tut_map_s3_title",
        descKey: "tut_map_s3_desc",
        hintKey: "tut_map_s3_hint",
      },
      {
        id: "tour_map",
        target: '[data-tour="map"]',
        titleKey: "tut_map_s1_title",
        descKey: "tut_map_s1_desc",
        hintKey: "tut_map_s1_hint",
      },
      {
        id: "tour_risk_panel",
        target: '[data-tour="risk-panel"]',
        titleKey: "tut_map_s4_title",
        descKey: "tut_map_s4_desc",
        hintKey: "tut_map_s4_hint",
      },
      {
        id: "tour_bell",
        target: '[data-tour="bell"]',
        titleKey: "tut_settings_s3_title",
        descKey: "tut_settings_s3_desc",
        hintKey: "tut_settings_s3_hint",
      },
      {
        id: "tour_profile",
        target: '[data-tour="profile"]',
        titleKey: "tut_settings_s2_title",
        descKey: "tut_settings_s2_desc",
        hintKey: "tut_settings_s2_hint",
      },
    ];
  }, []);

  const currentStepList: TutorialStep[] = useMemo(() => {
    if (activeTutorial) return activeTutorial.steps;
    if (isFullTourActive) return fullTourSteps;
    return [];
  }, [activeTutorial, isFullTourActive, fullTourSteps]);

  const currentStep = currentStepList[stepIndex] || null;

  // Resolve target element and bounding rect
  const updateTargetPosition = useCallback(() => {
    if (!currentStep) {
      setTargetRect(null);
      setActiveTargetSelector("");
      return;
    }

    let el = document.querySelector(currentStep.target) as HTMLElement | null;
    let chosenSelector = currentStep.target;

    if ((!el || el.offsetParent === null) && currentStep.fallbackTarget) {
      const fallbackEl = document.querySelector(currentStep.fallbackTarget) as HTMLElement | null;
      if (fallbackEl && fallbackEl.offsetParent !== null) {
        el = fallbackEl;
        chosenSelector = currentStep.fallbackTarget;
      }
    }

    if (el) {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      } catch {}
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      setActiveTargetSelector(chosenSelector);
    } else {
      setTargetRect(null);
      setActiveTargetSelector("");
    }
  }, [currentStep]);

  // Re-calculate target position on step change, resize, scroll
  useEffect(() => {
    updateTargetPosition();
    const handleEvents = () => updateTargetPosition();
    window.addEventListener("resize", handleEvents);
    window.addEventListener("scroll", handleEvents, true);
    return () => {
      window.removeEventListener("resize", handleEvents);
      window.removeEventListener("scroll", handleEvents, true);
    };
  }, [updateTargetPosition]);

  // SMART STATE DETECTION: Observe DOM mutations (e.g. dropdowns opening/closing)
  useEffect(() => {
    if (!currentStep) return;

    const observer = new MutationObserver(() => {
      updateTargetPosition();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "aria-expanded"],
    });

    return () => observer.disconnect();
  }, [currentStep, updateTargetPosition]);

  // Guard against rapid duplicate step advances
  const isAdvancingRef = useRef(false);

  const finishTutorial = useCallback(() => {
    const completedName = activeTutorial 
      ? t(activeTutorial.titleKey) 
      : t("help_center_general_tour_title");

    if (activeTutorial) {
      recordTutorialCompletion(activeTutorial.id);
    } else if (isFullTourActive) {
      recordFullTourCompletion();
    }

    setActiveTutorial(null);
    setIsFullTourActive(false);
    setStepIndex(0);

    // Trigger success notification toast
    showToast({
      title: t("tutorial_toast_completed_title"),
      message: t("tutorial_toast_completed_msg", { name: completedName }),
      risk_level: "low",
      sender_role: "INKAD System",
    });
  }, [activeTutorial, isFullTourActive, t, recordTutorialCompletion, recordFullTourCompletion, showToast]);

  // Advance step, with option to programmatically trigger target action
  const advanceStep = useCallback((autoTriggerTarget: boolean = false) => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    if (autoTriggerTarget && currentStep) {
      let targetEl = document.querySelector(currentStep.target) as HTMLElement | null;
      if ((!targetEl || targetEl.offsetParent === null) && currentStep.fallbackTarget) {
        targetEl = document.querySelector(currentStep.fallbackTarget) as HTMLElement | null;
      }
      if (targetEl) {
        try {
          targetEl.click();
        } catch (err) {
          console.warn("Auto-trigger target click error", err);
        }
      }
    }

    if (stepIndex < currentStepList.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      finishTutorial();
    }

    setTimeout(() => {
      isAdvancingRef.current = false;
    }, 350);
  }, [currentStep, stepIndex, currentStepList, finishTutorial]);

  // SMART MENU STATE DETECTION: If target is "nav-more" but the menu is ALREADY OPEN, automatically advance to Step 2
  useEffect(() => {
    if (!currentStep || stepIndex !== 0) return;

    if (currentStep.target === '[data-tour="nav-more"]') {
      const openMenu = document.querySelector('[role="menu"]');
      if (openMenu) {
        const timer = setTimeout(() => {
          advanceStep(false);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentStep, stepIndex, advanceStep]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    // Clicking "Next Step" automatically triggers the target button's action (Nielsen Heuristic #1)
    advanceStep(true);
  }, [advanceStep]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  }, [stepIndex]);

  const handleSkip = useCallback(() => {
    setActiveTutorial(null);
    setIsFullTourActive(false);
    setStepIndex(0);
    dismissToast();
  }, [dismissToast]);

  // Wrong Click Handling: Show friendly red toast and trigger shake
  const handleWrongClick = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShakeWarning(true);
    setTimeout(() => setShakeWarning(false), 800);

    showToast({
      title: t("tutorial_wrong_target_title"),
      message: t("tutorial_wrong_target_hint"),
      risk_level: "critical",
      sender_role: "INKAD System",
    });
  }, [showToast, t]);

  // DIRECT ELEMENT TARGETING & CLICK ATTACHMENT:
  // Elevates the active element with z-index and pointer-events: auto, and attaches a direct click listener
  useEffect(() => {
    const isRunner = (activeTutorial !== null || isFullTourActive) && currentStep !== null;
    if (!isRunner || !currentStep) return;

    let targetEl = document.querySelector(currentStep.target) as HTMLElement | null;
    if ((!targetEl || targetEl.offsetParent === null) && currentStep.fallbackTarget) {
      targetEl = document.querySelector(currentStep.fallbackTarget) as HTMLElement | null;
    }

    if (!targetEl) return;

    const originalZIndex = targetEl.style.zIndex;
    const originalPosition = targetEl.style.position;
    const originalPointerEvents = targetEl.style.pointerEvents;

    targetEl.style.position = targetEl.style.position || "relative";
    targetEl.style.zIndex = "2850";
    targetEl.style.pointerEvents = "auto";

    const onTargetClick = () => {
      if (isAdvancingRef.current) return;
      setTimeout(() => {
        advanceStep(false);
      }, 100);
    };

    targetEl.addEventListener("click", onTargetClick, { capture: true });

    return () => {
      targetEl.removeEventListener("click", onTargetClick, { capture: true });
      targetEl.style.zIndex = originalZIndex;
      targetEl.style.position = originalPosition;
      targetEl.style.pointerEvents = originalPointerEvents;
    };
  }, [activeTutorial, isFullTourActive, currentStep, stepIndex, advanceStep]);

  // Start specific task tutorial
  const startTutorial = (tut: TutorialDef) => {
    dismissToast(); // Clear clutter toasts
    setIsHelpCenterOpen(false);
    setIsFullTourActive(false);
    setActiveTutorial(tut);
    setStepIndex(0);
  };

  // Start Full Tour from catalog
  const startFullTour = () => {
    dismissToast(); // Clear clutter toasts
    setIsHelpCenterOpen(false);
    setActiveTutorial(null);
    setIsFullTourActive(true);
    setStepIndex(0);
  };

  if (!mounted) return null;

  const isRunnerActive = (activeTutorial !== null || isFullTourActive) && currentStep !== null;
  const isLast = stepIndex === currentStepList.length - 1;

  // Determine pointer direction and panel placement
  const isTargetBottomRight =
    targetRect &&
    targetRect.bottom > (typeof window !== "undefined" ? window.innerHeight * 0.55 : 500) &&
    targetRect.right > (typeof window !== "undefined" ? window.innerWidth * 0.55 : 500);

  // Is target in menu fallback mode?
  const isFallbackActive = activeTargetSelector === currentStep?.fallbackTarget;

  return (
    <>
      {/* ============================================================ */}
      {/* 1. ADVANCED HELP CENTER & TUTORIAL CATALOG MODAL            */}
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
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-4">
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

            {/* Overall Tutorial Progress Bar */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-300">
                  {t("help_center_progress_title")}:
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {completedCount} / {totalCount}
                </span>
                <span className="text-[11px] text-slate-400">
                  ({progressPercent}%)
                </span>
              </div>

              <div className="flex-1 max-w-xs sm:max-w-sm flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {completedCount === totalCount && totalCount > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                    {t("help_center_all_completed")}
                  </span>
                )}
              </div>
            </div>

            {/* General Tour Hero Banner */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    {t("help_center_general_tour_title")}
                  </h3>
                  {hasCompletedFullTour && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-700/80 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t("help_center_completed_badge")}</span>
                    </span>
                  )}
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
                {hasCompletedFullTour ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 text-white" />
                    <span>{t("help_center_resume_tour")}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t("help_center_start_tour")}</span>
                  </>
                )}
              </button>
            </div>

            {/* Search Bar & Category Filter Tabs */}
            <div className="p-4 sm:px-6 sm:py-3.5 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search Input with Clear Button */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("help_center_search_placeholder")}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-emerald-500/80 rounded-xl pl-9 pr-9 rtl:pl-9 rtl:pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label={t("help_center_clear_search")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rtl:right-auto rtl:left-2.5 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Strict Category Tabs (Administration tab is strictly removed for non-admin) */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === "all"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {t("help_center_tab_all")} ({roleTutorials.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("field")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === "field"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {t("help_center_tab_field")} ({roleTutorials.filter((t) => t.category === "field").length})
                </button>
                {availableCategories.includes("admin") && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("admin")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === "admin"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {t("help_center_tab_admin")} ({roleTutorials.filter((t) => t.category === "admin").length})
                  </button>
                )}
              </div>
            </div>

            {/* Tutorial Cards Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {displayedTutorials.length === 0 ? (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center gap-3">
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">
                    {searchQuery.trim() ? t("help_center_no_results") : t("help_center_no_tutorials_role")}
                  </h4>
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-emerald-400 hover:underline font-semibold"
                    >
                      {t("help_center_clear_search")}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {displayedTutorials.map((tut) => {
                    const Icon = tut.icon;
                    const isDone = completedTutorials.includes(tut.id);

                    return (
                      <div
                        key={tut.id}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-black/50 transition-all duration-200 flex flex-col justify-between gap-3.5 group"
                      >
                        <div className="space-y-2.5">
                          {/* Top Row: Icon, Title, and Completed Badge */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl border ${tut.themeColor.bg} ${tut.themeColor.border} ${tut.themeColor.text} group-hover:scale-105 transition-transform`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide group-hover:text-emerald-300 transition-colors">
                                  {t(tut.titleKey)}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tut.themeColor.badge}`}>
                                    {tut.category === "admin" ? t("help_center_category_badge_admin") : t("help_center_category_badge_field")}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {tut.steps.length} {t("help_center_steps_label")}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isDone && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-800 px-2 py-0.5 rounded-full shadow-sm shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{t("help_center_completed_badge")}</span>
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-300 leading-relaxed pl-0.5">
                            {t(tut.descKey)}
                          </p>
                        </div>

                        {/* Footer: Duration estimate & Action Button */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>~{tut.duration} {t("tutorial_min")}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => startTutorial(tut)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-md min-h-[36px] ${
                              isDone
                                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500/50"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60"
                            }`}
                          >
                            {isDone ? (
                              <>
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{t("help_center_btn_replay")}</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>{t("help_center_btn_start")}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. 4-PANEL SPOTLIGHT OVERLAY WITH ZERO-OBSTRUCTION CUTOUT   */}
      {/* ============================================================ */}
      {isRunnerActive && targetRect && (
        <div className="fixed inset-0 z-[2800] pointer-events-none select-none" style={{ width: "100vw", height: "100vh" }}>
          {/* Top dark backdrop */}
          <div
            className="absolute top-0 left-0 w-full bg-slate-950/80 backdrop-blur-[2px] transition-all duration-150 pointer-events-none"
            style={{ height: Math.max(0, targetRect.top - 6) }}
          />
          {/* Bottom dark backdrop */}
          <div
            className="absolute left-0 w-full bg-slate-950/80 backdrop-blur-[2px] transition-all duration-150 pointer-events-none"
            style={{
              top: targetRect.bottom + 6,
              height: Math.max(0, (typeof window !== "undefined" ? window.innerHeight : 800) - (targetRect.bottom + 6)),
            }}
          />
          {/* Left dark backdrop */}
          <div
            className="absolute bg-slate-950/80 backdrop-blur-[2px] transition-all duration-150 pointer-events-none"
            style={{
              top: Math.max(0, targetRect.top - 6),
              left: 0,
              width: Math.max(0, targetRect.left - 6),
              height: targetRect.height + 12,
            }}
          />
          {/* Right dark backdrop */}
          <div
            className="absolute bg-slate-950/80 backdrop-blur-[2px] transition-all duration-150 pointer-events-none"
            style={{
              top: Math.max(0, targetRect.top - 6),
              left: targetRect.right + 6,
              width: Math.max(0, (typeof window !== "undefined" ? window.innerWidth : 1200) - (targetRect.right + 6)),
              height: targetRect.height + 12,
            }}
          />

          {/* Pulsing glowing focus ring directly framing target (pointer-events-none so real element receives click) */}
          <div
            className="absolute pointer-events-none rounded-xl border-2 border-emerald-400 ring-4 ring-emerald-500/30 transition-all duration-150 animate-pulse shadow-[0_0_25px_rgba(16,185,129,0.5)] z-[2810]"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
          />

          {/* Animated Bouncing Pointer Arrow with prompt */}
          <div
            className="absolute pointer-events-none flex flex-col items-center z-[2820] transition-all duration-150"
            style={{
              left: Math.max(10, Math.min(
                (typeof window !== "undefined" ? window.innerWidth - 180 : 800),
                targetRect.left + (targetRect.width / 2) - 80
              )),
              top: (targetRect.bottom + 65 < (typeof window !== "undefined" ? window.innerHeight : 800))
                ? targetRect.bottom + 12
                : Math.max(10, targetRect.top - 58),
              width: 160,
            }}
          >
            {(targetRect.bottom + 65 < (typeof window !== "undefined" ? window.innerHeight : 800)) ? (
              <div className="flex flex-col items-center animate-bounce">
                <div className="w-0 h-0 border-x-[6px] border-x-transparent border-b-[8px] border-b-emerald-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                <div className="bg-emerald-500 text-slate-950 text-[11px] font-black px-3 py-1 rounded-full shadow-xl shadow-black/90 flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                  <MousePointerClick className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                  <span>{t("tutorial_click_target_prompt")}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-bounce">
                <div className="bg-emerald-500 text-slate-950 text-[11px] font-black px-3 py-1 rounded-full shadow-xl shadow-black/90 flex items-center gap-1.5 mb-0.5 whitespace-nowrap">
                  <MousePointerClick className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                  <span>{t("tutorial_click_target_prompt")}</span>
                </div>
                <div className="w-0 h-0 border-x-[6px] border-x-transparent border-t-[8px] border-t-emerald-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. NON-BLOCKING FLOATING SIDE PANEL (SUPER-DEVELOPED UX)    */}
      {/* ============================================================ */}
      {isRunnerActive && (
        <aside
          ref={panelRef}
          role="region"
          aria-label={t("tour_guide_title")}
          className={`fixed z-[2850] w-[92vw] sm:w-[420px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/80 transition-all duration-300 ease-out pointer-events-auto ${
            shakeWarning ? "animate-bounce ring-2 ring-red-500 shadow-red-950/60" : ""
          } ${
            isTargetBottomRight
              ? "top-6 right-4 sm:right-6 rtl:right-auto rtl:left-4 sm:rtl:left-6"
              : "bottom-6 right-4 sm:right-6 rtl:right-auto rtl:left-4 sm:rtl:left-6"
          }`}
        >
          {/* Header row: badge + step count + close */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                {activeTutorial ? t(activeTutorial.titleKey) : t("help_center_general_tour_title")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                {stepIndex + 1} / {currentStepList.length}
              </span>
              <button
                type="button"
                onClick={handleSkip}
                aria-label={t("tutorial_exit")}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / currentStepList.length) * 100}%` }}
            />
          </div>

          {/* Step content */}
          <div className="py-3.5 space-y-2.5">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{t(currentStep.titleKey)}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t(currentStep.descKey)}
            </p>

            {/* "Action Required" Prompt & "Waiting for your click..." progress indicator */}
            <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <MousePointerClick className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-xs text-emerald-300 leading-snug">
                  <span className="font-bold text-emerald-400">
                    {t("tutorial_action_required")}:{" "}
                  </span>
                  <span>
                    {isFallbackActive ? t("tutorial_reopen_menu_hint") : t(currentStep.hintKey)}
                  </span>
                </div>
              </div>

              {/* Visual "Waiting for your click..." progress state indicator */}
              <div className="flex items-center gap-2 pt-2 border-t border-emerald-900/60 text-[11px] text-emerald-400/90 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                <span>{t("tutorial_waiting_click")}</span>
              </div>
            </div>

            {/* Wrong click alert notice if user clicked outside */}
            {shakeWarning && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-700/80 text-red-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <Info className="w-4 h-4 shrink-0 text-red-400" />
                <span>{t("tutorial_wrong_target_hint")}</span>
              </div>
            )}

            {/* Step navigation dots */}
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
          onClick={() => {
            dismissToast();
            setIsHelpCenterOpen(true);
          }}
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
