"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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
  Settings
} from "lucide-react";
import { getStoredUser, getStoredToken, setSession, logoutUser, getRoleBadgeInfo, AuthUser } from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  if (!isReady || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Vérification des accréditations de sécurité...</span>
        </div>
      </div>
    );
  }

  const badgeInfo = getRoleBadgeInfo(user.role);
  // Clean role text without duplicate emoji
  const cleanRoleText = badgeInfo.text.replace(/^[🔒\s]+Secure\s+access\s*-\s*/i, "").trim() || "Sécurité Accréditée";
  const { t, isRTL } = useLanguage();
  const isAdmin = user.role === "ADMIN";

  // PRIMARY OPERATIONAL ITEMS (visible in main top bar)
  const primaryNavItems = [
    { href: "/dashboard", label: t("nav_tactical_map") || "Carte Tactique", icon: Map },
    { href: "/dashboard/alerts", label: t("nav_alerts") || "Alertes Actives", icon: AlertTriangle },
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
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg p-1 transition-colors hover:bg-slate-800/60"
            >
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-sm select-none shadow-sm">
                إنقاذ
              </div>
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

            {/* Compact Security Accreditation Pill (Doesn't overflow or wrap) */}
            <div
              className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${badgeInfo.colorClass}`}
              title={badgeInfo.subtext}
            >
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
              <span>{cleanRoleText}</span>
            </div>
          </div>

          {/* Center: Primary Operational Navigation (Fitts' Law: generous click targets) */}
          <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-1.5">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href === "/dashboard/historique" && pathname === "/dashboard/history");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
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

          {/* Right: Language Selector + User Profile / Administration Dropdown */}
          <div className="flex items-center gap-2.5 shrink-0">
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
                  <div className="font-semibold text-xs leading-none truncate max-w-[130px]">{user.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[130px] mt-0.5">
                    {cleanRoleText}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isProfileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>

              {/* Profile & Admin Dropdown Menu */}
              {isProfileOpen && (
                <div
                  role="menu"
                  aria-label="Options du compte et administration"
                  className="absolute right-0 mt-2 w-64 rounded-lg bg-slate-900 border border-slate-700 py-1.5 shadow-2xl z-50 text-xs focus:outline-none divide-y divide-slate-800"
                >
                  {/* Account Summary */}
                  <div className="px-3.5 py-2.5">
                    <div className="font-semibold text-white truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border bg-slate-800/80 border-slate-700 text-amber-300">
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
                      <span>{cleanRoleText}</span>
                    </div>
                  </div>

                  {/* Secondary Administration Links */}
                  {isAdmin && secondaryNavItems.length > 0 && (
                    <div className="py-1.5">
                      <div className="px-3.5 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {t("admin_system")}
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
                            className={`flex items-center gap-2.5 px-3.5 py-2 font-medium transition-colors duration-150 hover:bg-slate-800 ${
                              active ? "text-red-400 bg-slate-800/60 font-semibold" : "text-slate-300 hover:text-white"
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${active ? "text-red-400" : "text-slate-400"}`} aria-hidden="true" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Logout Button */}
                  <div className="pt-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-red-400 hover:bg-red-950/40 hover:text-red-300 font-medium transition-colors duration-150 text-left"
                    >
                      <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{t("logout") || "Déconnexion"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <nav aria-label="Navigation mobile" className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-slate-800 overflow-x-auto bg-slate-900">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors duration-150 ${
                  active
                    ? "bg-slate-800 text-white font-semibold border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
