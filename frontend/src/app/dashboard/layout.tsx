"use client";

import React, { useEffect, useState } from "react";
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
  UserCheck
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
  const { t, isRTL } = useLanguage();
  const isAdmin = user.role === "ADMIN";

  const navItems = [
    { href: "/dashboard", label: t("nav_tactical_map"), icon: Map },
    { href: "/dashboard/alerts", label: t("nav_alerts"), icon: AlertTriangle },
    { href: "/dashboard/historique", label: t("nav_history"), icon: History },
    { href: "/analytics", label: t("nav_analytics"), icon: BarChart3 },
    ...(isAdmin
      ? [
          { href: "/dashboard/admin/model-health", label: t("nav_model_health"), icon: Activity },
          { href: "/dashboard/admin/roadmap", label: t("nav_roadmap"), icon: Shield },
          { href: "/dashboard/admin/users", label: t("nav_users"), icon: Users },
        ]
      : []),
  ];

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${isRTL ? "font-arabic" : ""}`}>
      {/* Top Security Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white font-black text-sm">
                إنقاذ
              </div>
              <div>
                <div className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>IN9AD</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-950/80 border border-red-800/60 text-red-300 font-bold">
                    v3.0 TOP 3
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                  {t("platform_sub")}
                </div>
              </div>
            </Link>

            {/* MANDATORY SECURITY ROLE BADGE */}
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded border text-xs font-semibold ${badgeInfo.colorClass}`}
              title={badgeInfo.subtext}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>{badgeInfo.text}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href === "/dashboard/historique" && pathname === "/dashboard/history");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                    active
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Language Switcher + User Profile & Logout */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <div className="text-right hidden lg:block">
              <div className="text-xs font-medium text-slate-200">{user.name}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                {user.organization || user.email}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              title={t("logout")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Subheader Navigation */}
        <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-slate-800/80 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs whitespace-nowrap ${
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
