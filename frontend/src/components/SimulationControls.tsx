"use client";

import React, { useState, useEffect } from "react";
import { SimulationResult, SimulationStep } from "@/types";
import { Play, Pause, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface SimulationControlsProps {
  simulation: SimulationResult | null;
  activeHorizonIndex: number;
  onSelectHorizon: (index: number) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  simulation,
  activeHorizonIndex,
  onSelectHorizon,
}) => {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && simulation && simulation.timesteps.length > 0) {
      interval = setInterval(() => {
        onSelectHorizon((activeHorizonIndex + 1) % simulation.timesteps.length);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeHorizonIndex, simulation, onSelectHorizon]);

  if (!simulation || !simulation.timesteps.length) {
    return null;
  }

  const activeStep: SimulationStep = simulation.timesteps[activeHorizonIndex] || simulation.timesteps[0];

  return (
    <div className="bg-slatebg-900/90 backdrop-blur-md border border-slate-800/80 rounded-lg p-4 text-xs space-y-3">
      {/* Title & Player Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
            <span>{t("sim_huygens_title")}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700/60">
              {t("sim_horizons_count", { n: simulation.timesteps.length })}
            </span>
          </h3>
          <p className="text-[11px] text-slate-400">
            {t("sim_wind_aligned", { deg: simulation.spread_azimuth_deg })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? "Pause simulation playback" : "Start simulation playback"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 ${
            isPlaying
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-ember-600 hover:bg-ember-500 text-white"
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span>{t("sim_pause")}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span>{t("sim_play")}</span>
            </>
          )}
        </button>
      </div>

      {/* Horizon Selection Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {simulation.timesteps.map((step, idx) => {
          const isActive = idx === activeHorizonIndex;
          return (
            <button
              type="button"
              key={step.hours}
              onClick={() => {
                setIsPlaying(false);
                onSelectHorizon(idx);
              }}
              aria-pressed={isActive}
              aria-label={`Select +${step.hours} hour horizon, ${step.burned_area_hectares} hectares`}
              className={`py-2 px-1 rounded-lg border font-mono transition-colors duration-150 flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 ${
                isActive
                  ? "bg-ember-600 border-ember-500 text-white"
                  : "bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-1 text-xs font-bold tabular-nums">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>+{step.hours}h</span>
              </div>
              <span className="text-[10px] opacity-80 mt-0.5 tabular-nums">{step.burned_area_hectares} ha</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Telemetry for the active timestep */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40">
          <span className="text-[10px] text-slate-400 block mb-0.5">{t("sim_burned_area_label")}</span>
          <span className="text-sm font-bold font-mono tabular-nums text-ember-400">
            {activeStep.burned_area_hectares} <span className="text-xs font-normal text-slate-300">ha</span>
          </span>
        </div>

        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40">
          <span className="text-[10px] text-slate-400 block mb-0.5">{t("sim_rate_of_spread")}</span>
          <span className="text-sm font-bold font-mono tabular-nums text-ember-400">
            {activeStep.rate_of_spread_m_h} <span className="text-xs font-normal text-slate-300">m/h</span>
          </span>
        </div>

        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40">
          <span className="text-[10px] text-slate-400 block mb-0.5">{t("sim_flame_length")}</span>
          <span className="text-sm font-bold font-mono tabular-nums text-ember-400">
            {simulation.estimated_flame_height_m} <span className="text-xs font-normal text-slate-300">m</span>
          </span>
        </div>

        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40">
          <span className="text-[10px] text-slate-400 block mb-0.5">{t("sim_evacuation_radius")}</span>
          <span className="text-sm font-bold font-mono tabular-nums text-ember-400">
            {simulation.recommended_evacuation_radius_km} <span className="text-xs font-normal text-slate-300">km</span>
          </span>
        </div>
      </div>
    </div>
  );
};
