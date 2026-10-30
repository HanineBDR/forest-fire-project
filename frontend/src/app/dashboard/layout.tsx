"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  Map,
  AlertTriangle,
  History,
  Activity,
  Users,
  LogOut,
  Lock,
  BarChart3,
  ChevronDown,
  UserCheck,
  Settings,
  Radio,
  Plane,
  Cpu,
  MoreHorizontal,
  Menu,
  X,
  Camera,
} from "lucide-react";
import { 
  getStoredUser, 
  getStoredToken, 
  setSession, 
  logoutUser, 
  getRoleBadgeInfo, 
  getLocalizedUserName, 
  AuthUser, 
  DEMO_ACCOUNTS, 
  UserRole,
  ROLE_PERMISSIONS,
  hasPermission
} from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { useNotifications } from "@/contexts/NotificationContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [unauthToast, setUnauthToast] = useState<{ title: string; desc: string } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { setActiveRole } = useNotifications();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Enforce authentication: if no valid token or user, redirect immediately to /login
  useEffect(() => {
    const u = getStoredUser();
    const token = getStoredToken();

    if (!u || !token) {
      router.replace("/login");
      return;
    }
    setUser(u);
    setIsReady(true);
  }, [router]);

  // Check for unauthorized access flash toast
  useEffect(() => {
    try {
      const storedToast = sessionStorage.getItem("in9ad_auth_toast");
      if (storedToast) {
        setUnauthToast(JSON.parse(storedToast));
        sessionStorage.removeItem("in9ad_auth_toast");
        const timer = setTimeout(() => setUnauthToast(null), 5000);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, [pathname]);

  // Click outside to close profile, role switcher, more menu, and mobile drawer
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(target)) {
        setIsRoleSwitcherOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(target)) {
        setIsMoreOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        if (!target.closest('[data-mobile-menu-toggle="true"]')) {
          setIsMobileMenuOpen(false);
        }
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
        setIsRoleSwitcherOpen(false);
        setIsMoreOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsProfileOpen(false);
    setIsRoleSwitcherOpen(false);
    setIsMoreOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSwitchRole = (acc: typeof DEMO_ACCOUNTS[0]) => {
    const mockUser: AuthUser = {
      id: `usr-${acc.role.toLowerCase()}`,
      email: acc.email,
      name: acc.officer,
      role: acc.role,
      organization: acc.org,
      organization_ar: acc.label.split(" ")[0],
    };
    setSession(`demo-token-${acc.role}`, mockUser);
    setUser(mockUser);
    const mapped = acc.role === "CIVIL_PROTECTION" ? "protection_civile" : acc.role === "FOREST_GUARD" ? "mohafadat_ghabat" : "admin_centrale";
    setActiveRole(mapped);
    setIsProfileOpen(false);
    setIsRoleSwitcherOpen(false);
    setIsMoreOpen(false);
    setIsMobileMenuOpen(false);

    if (pathname === "/analytics" && acc.role !== "ADMIN") {
      router.replace("/dashboard");
    } else if (pathname.startsWith("/dashboard/admin/model-health") && acc.role !== "ADMIN") {
      router.replace("/dashboard");
    } else if (pathname.startsWith("/dashboard/admin/users") && acc.role !== "ADMIN") {
      router.replace("/dashboard");
    } else if (pathname.startsWith("/dashboard/admin/roadmap") && acc.role === "FOREST_GUARD") {
      router.replace("/dashboard");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/login");
  };

  const { t, isRTL, language } = useLanguage();

  if (!isReady || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span>{t("security_verification_loading")}</span>
        </div>
      </div>
    );
  }

  const badgeInfo = getRoleBadgeInfo(user.role, language);
  const fallbackRole = language === "ar" ? "المديرية العامة" : language === "en" ? "General Directorate" : "Direction Générale";
  const cleanRoleText = badgeInfo.text.replace(/^[🔒\s]+Secure\s+access\s*-\s*/i, "").trim() || fallbackRole;
  const cleanUserName = getLocalizedUserName(user.name, user.role, language);
  const isAdmin = user.role === "ADMIN";
  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  // PRIMARY OPERATIONAL ITEMS (always visible on desktop nav, filtered by role)
  const primaryNavItems = [
    { href: "/dashboard", label: t("nav_tactical_map") || "Carte Tactique", icon: Map, show: true },
    { href: "/dashboard/alerts", label: t("nav_alerts") || "Alertes Actives", icon: AlertTriangle, show: true },
    { href: "/analytics", label: t("nav_analytics") || "Analytics ML", icon: BarChart3, show: permissions?.canViewAnalytics ?? false },
  ].filter((item) => item.show);

  // SECONDARY ITEMS (collapsed into the "Plus" dropdown, filtered by role)
  const secondaryMoreItems = [
    { href: "/dashboard/notifications", label: t("nav_intercom_alerts"), icon: Radio, show: true },
    { href: "/dashboard/drones", label: t("nav_drones_flir"), icon: Plane, dataTour: "drones", show: permissions?.canAccessDrones ?? false },
    { href: "/dashboard/iot", label: t("nav_iot_sensors"), icon: Cpu, dataTour: "iot", show: permissions?.canAccessIoT ?? false },
    { href: "/dashboard/historique", label: t("nav_history") || "History & Audit", icon: History, show: permissions?.canAccessHistory ?? true },
  ].filter((item) => item.show);

  const isMoreActive = secondaryMoreItems.some(
    (item) => pathname === item.href || (item.href === "/dashboard/historique" && pathname === "/dashboard/history")
  );
  const moreLabel = t("nav_more");

  // SECONDARY / ADMINISTRATION ITEMS (in profile & settings menu)
  const secondaryNavItems = isAdmin
    ? [
        { href: "/dashboard/admin/model-health", label: t("nav_model_health") || "Model Health & API", icon: Activity },
        { href: "/dashboard/admin/roadmap", label: t("nav_community_reports") || "Citizen Reports", icon: Camera },
        { href: "/dashboard/admin/users", label: t("nav_users") || "User Management", icon: Users },
      ]
    : user?.role === "CIVIL_PROTECTION"
    ? [
        { href: "/dashboard/admin/roadmap", label: t("nav_community_reports") || "Citizen Reports", icon: Camera },
      ]
    : [];

  const isSecondaryActive = secondaryNavItems.some(item => pathname === item.href);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${isRTL ? "font-arabic" : ""}`}>
      {/* Top Security Header */}
      <header className="sticky top-0 z-[1500] bg-slate-900 border-b border-slate-800 shadow-md shadow-slate-950/60 w-full">
        {/* Unauthorized Flash Toast */}
        {unauthToast && (
          <div className="fixed top-20 right-4 z-[2000] p-4 bg-red-950/95 border border-red-700 text-red-200 rounded-xl shadow-2xl flex items-start gap-3 max-w-md animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-white">{unauthToast.title}</div>
              <div className="text-xs text-red-300 mt-0.5 leading-relaxed">{unauthToast.desc}</div>
            </div>
          </div>
        )}
        <div className="w-full px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 flex-nowrap">
          
          {/* Left: Brand Logo & Role Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link 
              href="/dashboard" 
              data-tour="brand"
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg p-1 transition-colors hover:bg-slate-800/60 shrink-0"
            >
              <Image
                src="/logo.png"
                alt="IN9AD Logo"
                width={36}
                height={36}
                className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 select-none object-contain"
                priority
              />
              <div>
                <div className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                  <span>IN9AD</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono font-medium">
                    v3.0
                  </span>
                </div>
                <div className="hidden sm:block text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">
                  {t("platform_sub") || "Système Opérationnel"}
                </div>
              </div>
            </Link>

            {/* Interactive Command Panel Switcher */}
            <div ref={roleDropdownRef} data-tour="roles" className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsRoleSwitcherOpen(!isRoleSwitcherOpen)}
                aria-haspopup="menu"
                aria-expanded={isRoleSwitcherOpen}
                className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${badgeInfo.colorClass} hover:brightness-110`}
                title={t("switch_command_title")}
              >
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                <span className="max-w-[110px] sm:max-w-[170px] truncate">{cleanRoleText}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${isRoleSwitcherOpen ? "rotate-180" : ""}`} />
              </button>

              {isRoleSwitcherOpen && (
                <div 
                  role="menu"
                  className="absolute start-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-lg py-1.5 z-[2100] shadow-2xl focus:outline-none"
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{t("command_panel_access")}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{t("one_click_access")}</span>
                  </div>
                  <div className="p-1 space-y-1">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isCurrent = user.role === acc.role;
                      return (
                        <button
                          key={acc.role}
                          type="button"
                          onClick={() => handleSwitchRole(acc)}
                          className={`w-full flex items-center justify-between p-2 rounded-md text-xs text-left transition-colors ${
                            isCurrent
                              ? "bg-slate-800 text-white font-semibold border border-slate-700"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                acc.role === "CIVIL_PROTECTION" ? "bg-red-500" :
                                acc.role === "FOREST_GUARD" ? "bg-emerald-500" : "bg-blue-500"
                              }`} />
                              <span>{acc.label}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 pl-4 font-mono truncate max-w-[200px]">
                              {acc.officer}
                            </div>
                          </div>
                          {isCurrent && <span className="text-emerald-400 text-xs font-mono font-bold">Actif</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Primary Operational Navigation + Plus (More) Dropdown */}
          <nav aria-label={t("nav_main_heading")} data-tour="nav" className="hidden md:flex items-center gap-1 lg:gap-1.5 min-w-0 flex-nowrap">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                    active
                      ? "bg-slate-800 text-white border border-slate-700 shadow-sm ring-1 ring-slate-700/60"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 ${active ? "text-red-400" : "text-slate-400"}`} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* "Plus" (More) Dropdown Menu */}
            <div ref={moreDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                aria-haspopup="menu"
                aria-expanded={isMoreOpen}
                aria-label={t("nav_operational_tools")}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                  isMoreOpen || isMoreActive
                    ? "bg-slate-800 text-white border border-slate-700 shadow-sm ring-1 ring-slate-700/60"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent"
                }`}
                title={moreLabel}
              >
                <MoreHorizontal className={`w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 ${isMoreActive ? "text-red-400" : "text-slate-400"}`} aria-hidden="true" />
                <span>{moreLabel}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-150 ${isMoreOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>

              {isMoreOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute start-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1.5 z-[2100] focus:outline-none animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{moreLabel} & {t("nav_operational_tools")}</span>
                    <span className="text-[10px] text-slate-500 font-mono">4</span>
                  </div>
                  <div className="p-1 space-y-0.5">
                    {secondaryMoreItems.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href || (item.href === "/dashboard/historique" && pathname === "/dashboard/history");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          data-tour={item.dataTour}
                          role="menuitem"
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                            active
                              ? "bg-slate-800 text-white font-semibold border border-slate-700"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 shrink-0 ${active ? "text-red-400" : "text-slate-400"}`} aria-hidden="true" />
                            <span>{item.label}</span>
                          </div>
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Notification Bell + Language Selector + User Profile + Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {/* Real-time Notification Bell */}
            <div data-tour="bell" className="shrink-0"><NotificationBell /></div>

            {/* Standard Clean Language Selector */}
            <div className="shrink-0"><LanguageSwitcher /></div>

            {/* Profile & Secondary Settings Dropdown */}
            <div ref={profileDropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
                aria-label={t("nav_system_supervision")}
                className={`flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                  isProfileOpen || isSecondaryActive
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <UserCheck className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
                </div>
                <div className="hidden xl:block text-left">
                  <div className="font-semibold text-xs leading-none truncate max-w-[120px]">{cleanUserName}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px] mt-0.5">
                    {cleanRoleText}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${isProfileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div 
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute end-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1.5 z-[2100] focus:outline-none"
                >
                  <div className="px-3.5 py-2.5 border-b border-slate-800">
                    <div className="font-semibold text-white truncate">{cleanUserName}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border bg-slate-800/80 border-slate-700 text-amber-300">
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
                      <span>{cleanRoleText}</span>
                    </div>
                  </div>

                  {/* Quick Role Switch in Profile Dropdown */}
                  <div className="py-1 border-b border-slate-800">
                    <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{t("switch_command_title") || "Changer de rôle"}</span>
                      <span className="text-[9px] text-emerald-400 font-mono">{t("one_click_access") || "Instantané"}</span>
                    </div>
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isCurrent = user.role === acc.role;
                      return (
                        <button
                          key={acc.role}
                          type="button"
                          onClick={() => handleSwitchRole(acc)}
                          className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-left transition-colors ${
                            isCurrent
                              ? "bg-slate-800 text-white font-semibold"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              acc.role === "CIVIL_PROTECTION" ? "bg-red-500" :
                              acc.role === "FOREST_GUARD" ? "bg-emerald-500" : "bg-blue-500"
                            }`} />
                            <span className="truncate">{acc.label}</span>
                          </div>
                          {isCurrent && <span className="text-[10px] text-emerald-400 font-mono">{language === "ar" ? "نشط" : language === "en" ? "Active" : "Actif"}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Secondary Admin Routes */}
                  {secondaryNavItems.length > 0 && (
                    <div className="py-1 border-b border-slate-800">
                      <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {t("nav_system_supervision")}
                      </div>
                      {secondaryNavItems.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            onClick={() => setIsProfileOpen(false)}
                            className={`flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors ${
                              active
                                ? "bg-slate-800 text-white font-semibold"
                                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${active ? "text-red-400" : "text-slate-400"}`} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Intercom Link */}
                  <div className="py-1 border-b border-slate-800">
                    <Link
                      href="/dashboard/notifications"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <Radio className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t("nav_intercom_national")}</span>
                    </Link>
                  </div>

                  {/* Logout Action */}
                  <div className="pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t("logout") || "Sign Out"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              data-mobile-menu-toggle="true"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? t("mobile_menu_close") : t("mobile_menu_open")}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-red-400" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 py-3 space-y-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 pb-1.5">
                {t("nav_main_heading")}
              </div>
              <div className="space-y-1">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                        active
                          ? "bg-slate-800 text-white border border-slate-700"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-red-400" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-2.5">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 pb-1.5">
                {moreLabel} & {t("nav_operational_tools")}
              </div>
              <div className="space-y-1">
                {secondaryMoreItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || (item.href === "/dashboard/historique" && pathname === "/dashboard/history");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                        active
                          ? "bg-slate-800 text-white border border-slate-700"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-red-400" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>

            {secondaryNavItems.length > 0 && (
              <div className="border-t border-slate-800/80 pt-2.5">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 pb-1.5">
                  {t("nav_system_supervision")}
                </div>
                <div className="space-y-1">
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                          active
                            ? "bg-slate-800 text-white border border-slate-700"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? "text-red-400" : "text-slate-400"}`} />
                          <span>{item.label}</span>
                        </div>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
