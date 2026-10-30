"use client";

import React from "react";
import { Satellite, Radio, Shield, Compass } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export const MapSkeleton: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div 
      role="status" 
      aria-label={t("loading_cartography")}
      className="relative w-full h-full min-h-[520px] rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center overflow-hidden p-6 select-none"
    >
      {/* Tactical Grid Background */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
        aria-hidden="true"
      />

      {/* Radar Pulse Animation */}
      <div className="relative mb-6 flex items-center justify-center" aria-hidden="true">
        {/* Outer Ring */}
        <div className="w-32 h-32 rounded-full border border-red-500/20 animate-ping absolute" />
        {/* Mid Ring */}
        <div className="w-24 h-24 rounded-full border border-red-500/40 animate-pulse absolute" />
        {/* Core Center */}
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-red-500/60 flex items-center justify-center z-10 shadow-lg shadow-red-950/40">
          <Compass className="w-8 h-8 text-red-500 animate-spin" style={{ animationDuration: "8s" }} />
        </div>
      </div>

      {/* Status Headings */}
      <div className="relative z-10 text-center max-w-md space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 font-mono">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>{t("skeleton_title")}</span>
        </div>

        <h3 className="text-base font-bold text-white tracking-wide">
          {t("skeleton_loading_stream")}
        </h3>
        
        <p className="text-xs text-slate-400 font-mono">
          {t("skeleton_calibrating")}
        </p>
      </div>

      {/* Progress & Sensor Indicators */}
      <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-lg text-xs font-mono">
        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 text-slate-300">
          <Satellite className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <div className="text-[10px] text-slate-400">{t("skeleton_sat_stream")}</div>
            <div className="text-emerald-300 font-semibold truncate">NASA FIRMS</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 text-slate-300">
          <Radio className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="truncate">
            <div className="text-[10px] text-slate-400">{t("skeleton_ground_network")}</div>
            <div className="text-amber-300 font-semibold truncate">{t("skeleton_dgf_vigies")}</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2 text-slate-300">
          <Shield className="w-4 h-4 text-red-400 shrink-0" />
          <div className="truncate">
            <div className="text-[10px] text-slate-400">{t("skeleton_predictive_model")}</div>
            <div className="text-red-300 font-semibold truncate">XGBoost v2.1</div>
          </div>
        </div>
      </div>

      {/* Coordinates readout */}
      <div className="relative z-10 mt-5 text-[11px] font-mono text-slate-400 tabular-nums">
        [COORD: 36.7350° N, 4.4350° E] · [SRID: EPSG:4326] · [ESRI World Imagery]
      </div>
    </div>
  );
};
