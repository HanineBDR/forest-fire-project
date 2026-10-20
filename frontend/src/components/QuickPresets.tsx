"use client";

import React from "react";
import { RegionPreset } from "@/types";
import { MapPin } from "lucide-react";

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
    <div className="bg-slatebg-900/80 backdrop-blur-md border border-slate-800/80 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-300">
          Strategic forest massifs (Northern Algeria)
        </span>
        <span className="text-[11px] text-slate-500 font-medium">Click to inspect</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {regions.map((reg) => {
          const isSelected = selectedRegionId === reg.id;
          return (
            <button
              key={reg.id}
              disabled={isLoading}
              onClick={() => onSelectRegion(reg)}
              className={`flex flex-col text-left p-2 rounded-lg transition-colors duration-150 border text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 ${
                isSelected
                  ? "bg-ember-950/60 border-ember-500/80 text-ember-100"
                  : "bg-slate-800/50 hover:bg-slate-800/90 border-slate-700/50 hover:border-slate-600 text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-semibold text-xs truncate" title={reg.name}>
                  {reg.name.split(" ")[0]}
                </span>
                <span className="text-[10px] px-1 py-0.5 rounded font-mono bg-slate-800/80 text-slate-300 border border-slate-700/40 shrink-0">
                  {reg.wilaya.match(/\((.*?)\)/)?.[1] || reg.wilaya.split(" ")[0]}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono tabular-nums">
                <MapPin className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                <span>{reg.lat.toFixed(2)}°, {reg.lon.toFixed(2)}°</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
