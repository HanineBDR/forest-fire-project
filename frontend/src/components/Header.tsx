"use client";

import React from "react";
import Link from "next/link";
import { Flame, ShieldAlert, Satellite, Wind, Layers, PhoneCall, BarChart3 } from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  return (
    <header className="relative z-30 bg-slatebg-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <Flame className="w-6 h-6 text-ember-500 shrink-0" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                IN9AD <span className="text-xs font-semibold text-ember-400 font-mono">إنقاذ</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Forest fire risk and elliptical spread simulation, Northern Algeria
            </p>
          </div>
        </div>

        {/* Priority Algerian Wilayas & Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Target Wilayas */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-300">
            <span className="text-slate-400 font-semibold">Priority corridor:</span>
            <span className="font-semibold text-slate-200">Tizi Ouzou (15), Bejaia (06), Bouira (10)</span>
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
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white font-medium transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>Model Analytics</span>
          </Link>

          {/* Secure Access Portal Link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 border border-red-500 rounded-lg text-white font-semibold shadow-sm transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            <span>Portail Sécurisé</span>
          </Link>

          {/* Emergency Alert Hotline */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-red-950/50 border border-red-700/60 rounded-lg text-red-200 font-semibold">
            <PhoneCall className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
            <span>Protection Civile: 14</span>
          </div>

          {/* Mobile toggle button */}
          {onToggleSidebar && (
            <button
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
