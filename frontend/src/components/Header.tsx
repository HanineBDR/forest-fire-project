"use client";

import React from "react";
import { Flame, ShieldAlert, Satellite, Wind, Layers, PhoneCall } from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  return (
    <header className="relative z-30 bg-slatebg-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6 shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-ember-500 via-red-600 to-amber-600 shadow-lg shadow-ember-500/25 ring-1 ring-white/20">
            <Flame className="w-6 h-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-ember-400 bg-clip-text text-transparent">
                IN9AD <span className="text-xs font-semibold text-ember-400 font-mono">إنقاذ</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-red-950/80 text-red-400 border border-red-800/50 rounded-full">
                AI Early Warning
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Forest Fire Risk & Elliptical Spread Simulation • Northern Algeria
            </p>
          </div>
        </div>

        {/* Priority Algerian Wilayas & Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Target Wilayas */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-300">
            <span className="text-slate-400 font-semibold">Priority Corridor:</span>
            <span className="font-semibold text-emerald-400">Tizi Ouzou (15)</span>
            <span className="text-slate-600">•</span>
            <span className="font-semibold text-cyan-400">Bejaia (06)</span>
            <span className="text-slate-600">•</span>
            <span className="font-semibold text-amber-400">Bouira (10)</span>
          </div>

          {/* NASA FIRMS Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-300">
            <Satellite className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px]">NASA FIRMS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          {/* Open-Meteo Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-950/40 border border-sky-800/40 rounded-lg text-sky-300">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-[11px]">Open-Meteo</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>

          {/* ML Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-emerald-300">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[11px]">XGBoost + FWI</span>
          </div>

          {/* Emergency Alert Hotline */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-red-950/50 border border-red-700/60 rounded-lg text-red-200 font-semibold">
            <PhoneCall className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            <span>Protection Civile: 14</span>
          </div>

          {/* Mobile toggle button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-ember-600 hover:bg-ember-500 text-white font-medium rounded-lg text-xs transition-colors shadow-md"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isSidebarOpen ? "View Map" : "Telemetry"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
