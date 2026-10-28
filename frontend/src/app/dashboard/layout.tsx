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
} from "lucide-react";
import { getStoredUser, getStoredToken, setSession, logoutUser, getRoleBadgeInfo, getLocalizedUserName, AuthUser, DEMO_ACCOUNTS, UserRole } from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { useNotifications } from "@/contexts/NotificationContext";

const DEFAULT_ADMIN: AuthUser = {
  id: "usr-admin",
  email: "admin@in9ad.dz",
  name: "Direction Générale - Super Admin",
  role: "ADMIN",
  organization: "Ministère de l'Intérieur / IN9AD Admin",
  organization_ar: "الإدارة",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser>(DEFAULT_ADMIN);
  const [isReady, setIsReady] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const { setActiveRole } = useNotifications();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = getStoredUser();
    const token = getStoredToken();

    if (!u || !token) {
      setSession("demo-token-ADMIN-auto", DEFAULT_ADMIN);
      setUser(DEFAULT_ADMIN);
    } else {
      setUser(u);
    }
  }, []);

  // Click outside to close profile/admin dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setIsRoleSwitcherOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
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
  const { t, isRTL } = useLanguage();
  const isAdmin = user.role === "ADMIN";

  // PRIMARY OPERATIONAL ITEMS (visible in main top bar)
  const primaryNavItems = [
    { href: "/dashboard", label: t("nav_tactical_map") || "Carte Tactique", icon: Map },
    { href: "/dashboard/alerts", label: t("nav_alerts") || "Alertes Actives", icon: AlertTriangle },
    { href: "/dashboard/notifications", label: "Intercom & Alertes", icon: Radio },
    { href: "/analytics", label: t("nav_analytics") || "Analytics ML", icon: BarChart3 },
    { href: "/dashboard/historique", label: t("nav_history") || "Historique", icon: History },
  ];

  // SECONDARY / ADMINISTRATION ITEMS (in profile & settings menu)
  const secondaryNavItems = isAdmin
    ? [
        { href: "/dashboard/admin/model-health", label: t("nav_model_health") || "Santé Modèle & API", icon: Activity },
        { href: "/dashboard/admin/roadmap", label: t("nav_roadmap") || "Feuille de Route 2026", icon: Shield },
        { href: "/dashboard/admin/users", label: t("nav_users") || "Gestion Comptes", icon: Users },
      ]
    : [];

  const isSecondaryActive = secondaryNavItems.some(item => pathname === item.href);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${isRTL ? "font-arabic" : ""}`}>
      {/* Top Security Header */}
      <header className="sticky top-0 z-[1500] bg-slate-900 border-b border-slate-800 shadow-md shadow-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Role Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <Link 
              href="/dashboard" 
              data-tour="brand"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg p-1 transition-colors hover:bg-slate-800/60"
            >
              <Image
                src="/logo.png"
                alt="IN9AD Logo"
                width={36}
                height={36}
                className="w-9 h-9 shrink-0 select-none object-contain"
                priority
              />
              <div>
                <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                  <span>IN9AD</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono font-medium">
                    v3.0
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-0.5">
                  {t("platform_sub") || "Système Opérationnel"}
                </div>
              </div>
            </Link>

            {/* Interactive Command Panel Switcher */}
            <div ref={roleDropdownRef} data-tour="roles" className="relative">
              <button
                type="button"
                onClick={() => setIsRoleSwitcherOpen(!isRoleSwitcherOpen)}
                aria-haspopup="menu"
                aria-expanded={isRoleSwitcherOpen}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${badgeInfo.colorClass} hover:brightness-110`}
                title="Cliquer pour changer de commandement opérationnel"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                <span>{cleanRoleText}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isRoleSwitcherOpen ? "rotate-180" : ""}`} />
              </button>

              {isRoleSwitcherOpen && (
                <div 
                  role="menu"
                  className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-lg py-1.5 z-[2000] focus:outline-none"
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Accès Commandements</span>
                    <span className="text-[10px] text-emerald-400 font-mono">1 Clic</span>
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

          {/* Center: Primary Operational Navigation */}
          <nav aria-label="Navigation principale" data-tour="nav" className="hidden md:flex items-center gap-1.5">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href === "/dashboard/historique" && pathname === "/dashboard/history");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                    active
                      ? "bg-slate-800 text-white border border-slate-700 shadow-sm ring-1 ring-slate-700/60"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-red-400" : "text-slate-400"}`} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Notification Bell + Language Selector + User Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Real-time Notification Bell */}
            <div data-tour="bell"><NotificationBell /></div>

            {/* Standard Clean Language Selector */}
            <LanguageSwitcher />

            {/* Profile & Secondary Settings Dropdown */}
            <div ref={profileDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
                aria-label="Menu du profil et administration"
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                  isProfileOpen || isSecondaryActive
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
                </div>
                <div className="hidden lg:block text-left">
                  <div className="font-semibold text-xs leading-none truncate max-w-[130px]">{cleanUserName}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[130px] mt-0.5">
                    {cleanRoleText}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isProfileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div 
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.06)] py-1.5 z-[2000] focus:outline-none"
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
                      <span>Changer de rôle</span>
                      <span className="text-[9px] text-emerald-400 font-mono">Instantané</span>
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
                          {isCurrent && <span className="text-[10px] text-emerald-400 font-mono">Actif</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Secondary Admin Routes */}
                  {secondaryNavItems.length > 0 && (
                    <div className="py-1 border-b border-slate-800">
                      <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Supervision Système
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
                      <span>Intercom Opérationnel National</span>
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
                      <span>{t("logout") || "Déconnexion"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
