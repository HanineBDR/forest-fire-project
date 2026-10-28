"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, Satellite, Wind, Layers, PhoneCall, BarChart3, ChevronDown, Lock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { DEMO_ACCOUNTS, setSession, AuthUser } from "@/lib/auth";

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const [isPanelsOpen, setIsPanelsOpen] = useState(false);
  const panelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelsRef.current && !panelsRef.current.contains(e.target as Node)) {
        setIsPanelsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEnterPanel = (acc: typeof DEMO_ACCOUNTS[0]) => {
    const mockUser: AuthUser = {
      id: `usr-${acc.role.toLowerCase()}`,
      email: acc.email,
      name: acc.officer,
      role: acc.role,
      organization: acc.org,
      organization_ar: acc.label.split(" ")[0],
    };
    setSession(`demo-token-${acc.role}`, mockUser);
    setIsPanelsOpen(false);
    router.push("/dashboard");
  };

  return (
    <header className="sticky top-0 z-[1500] bg-slate-900 border-b border-slate-800 shadow-md shadow-slate-950/60 px-4 py-3 sm:px-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div data-tour="brand" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="IN9AD Logo"
            width={40}
            height={40}
            className="w-10 h-10 shrink-0 select-none object-contain"
            priority
          />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                IN9AD <span className="text-xs font-semibold text-ember-400 font-mono">إنقاذ</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {t("platform_sub")}
            </p>
          </div>
        </div>

        {/* Priority Algerian Wilayas & Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Target Wilayas */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-300">
            <span className="text-slate-400 font-semibold">{t("national_corridor")}</span>
            <span className="font-semibold text-slate-200">Kabylie (15, 06, 10), Blida (09), El Tarf (36), Batna (05)</span>
          </div>

          {/* NASA FIRMS Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-300">
            <Satellite className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-mono text-[11px] tabular-nums">NASA FIRMS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
          </div>

          {/* Open-Meteo Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-300">
            <Wind className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-mono text-[11px]">Open-Meteo</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
          </div>

          {/* ML Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-mono text-[11px]">XGBoost + FWI</span>
          </div>

          {/* Analytics Page Link */}
          <Link
            href="/analytics"
            data-tour="analytics"
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{t("model_analytics")}</span>
          </Link>

          {/* Secure Access Portal & Direct Command Panel Entry */}
          <div ref={panelsRef} className="relative">
            <div className="flex items-center rounded-lg border border-red-700 bg-red-950/60 overflow-hidden">
              <Link
                href="/dashboard"
                data-tour="security-portal"
                className="flex items-center gap-1.5 px-2.5 py-1 text-white hover:bg-red-900/60 font-semibold transition-colors text-xs focus-visible:outline-none"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                <span>{t("secure_portal")}</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsPanelsOpen(!isPanelsOpen)}
                aria-haspopup="menu"
                aria-expanded={isPanelsOpen}
                data-tour="roles"
                aria-label="Accès direct aux 3 commandements"
                className="px-1.5 py-1 text-red-300 hover:text-white hover:bg-red-900/80 border-l border-red-800 transition-colors"
                title="Choisir un commandement opérationnel"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isPanelsOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {isPanelsOpen && (
              <div 
                role="menu"
                className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-lg py-1.5 z-[2500] focus:outline-none"
              >
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Accès Direct aux Commandements</span>
                  <span className="text-[10px] text-emerald-400 font-mono">1 Clic</span>
                </div>
                <div className="p-1 space-y-1">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleEnterPanel(acc)}
                      className="w-full text-left p-2 rounded-md hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 group-hover:text-white">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            acc.role === "CIVIL_PROTECTION" ? "bg-red-500" :
                            acc.role === "FOREST_GUARD" ? "bg-emerald-500" : "bg-blue-500"
                          }`} />
                          <span>{acc.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pl-4 font-mono truncate max-w-[210px]">
                          {acc.officer}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono group-hover:text-slate-200">Entrer</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Emergency Alert Hotline */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-red-950/50 border border-red-700/60 rounded-lg text-red-200 font-semibold">
            <PhoneCall className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
            <span>Protection Civile: 14</span>
          </div>

          {/* Real-time Notification Bell with unread badge & live popover */}
          <div data-tour="bell"><NotificationBell /></div>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Mobile toggle button */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label={isSidebarOpen ? "Switch to map view" : "Switch to telemetry view"}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-ember-600 hover:bg-ember-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 text-white font-medium rounded-lg text-xs transition-colors duration-150"
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isSidebarOpen ? "View map" : "Telemetry"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
