"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, Satellite, Wind, Layers, PhoneCall, BarChart3 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-[1500] bg-slate-900 border-b border-slate-800 shadow-md shadow-slate-950/60 px-4 py-3 sm:px-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
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
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{t("model_analytics")}</span>
          </Link>

          {/* Secure Access Portal Link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 border border-red-500 rounded-lg text-white font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            <span>{t("secure_portal")}</span>
          </Link>

          {/* Emergency Alert Hotline */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-red-950/50 border border-red-700/60 rounded-lg text-red-200 font-semibold">
            <PhoneCall className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
            <span>{t("emergency_hotline")}</span>
          </div>

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
