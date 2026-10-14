"use client";

import React from "react";
import { RegionPreset } from "@/types";
import { MapPin, Navigation, Trees } from "lucide-react";

interface QuickPresetsProps {
  regions: RegionPreset[];
  selectedRegionId?: string;
  onSelectRegion: (region: RegionPreset) => void;
  isLoading?: boolean;
}

export const QuickPresets: React.FC<QuickPresetsProps> = ({
  regions,
  selectedRegionId,
  onSelectRegion,
  isLoading,
}) => {
  return (
    <div className="bg-slatebg-900/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Trees className="w-3.5 h-3.5 text-emerald-400" />
          <span>Strategic Forest Massifs (Northern Algeria)</span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">Click to Inspect</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {regions.map((reg) => {
          const isSelected = selectedRegionId === reg.id;
          return (
            <button
              key={reg.id}
              disabled={isLoading}
              onClick={() => onSelectRegion(reg)}
              className={`flex flex-col text-left p-2 rounded-lg transition-all duration-200 border text-xs relative overflow-hidden group ${
                isSelected
                  ? "bg-ember-950/60 border-ember-500/80 text-ember-100 shadow-md shadow-ember-900/20"
                  : "bg-slate-800/50 hover:bg-slate-800/90 border-slate-700/50 hover:border-slate-600 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-semibold text-xs truncate group-hover:text-ember-300 transition-colors">
                  {reg.name.split(" ")[0]}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    reg.wilaya.includes("Tizi")
                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/40"
                      : reg.wilaya.includes("Bejaia")
                      ? "bg-cyan-950/80 text-cyan-300 border border-cyan-800/40"
                      : "bg-amber-950/80 text-amber-300 border border-amber-800/40"
                  }`}
                >
                  {reg.wilaya.split(" ")[0]}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <MapPin className="w-2.5 h-2.5 text-ember-400 shrink-0" />
                <span>{reg.lat.toFixed(2)}°, {reg.lon.toFixed(2)}°</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
