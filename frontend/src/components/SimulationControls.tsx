"use client";

import React, { useState, useEffect } from "react";
import { SimulationResult, SimulationStep } from "@/types";
import { Play, Pause, Flame, Clock, Compass, Activity, AlertTriangle } from "lucide-react";

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
    <div className="bg-slatebg-900/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 shadow-xl text-xs space-y-3">
      {/* Title & Player Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-950/80 text-red-400 border border-red-800/50">
            <Flame className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <span>Huygens Elliptical Spread Simulation</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {simulation.timesteps.length} Horizons
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Fire perimeter projection aligned with wind azimuth ({simulation.spread_azimuth_deg}°)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all shadow-md ${
            isPlaying
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-ember-600 hover:bg-ember-500 text-white"
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Simulation</span>
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
              key={step.hours}
              onClick={() => {
                setIsPlaying(false);
                onSelectHorizon(idx);
              }}
              className={`py-2 px-1 rounded-lg border font-mono transition-all duration-150 flex flex-col items-center justify-center ${
                isActive
                  ? "bg-gradient-to-b from-red-600 to-ember-600 border-red-400 text-white shadow-lg shadow-red-900/30 scale-[1.02]"
                  : "bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-1 text-xs font-bold">
                <Clock className="w-3 h-3" />
                <span>+{step.hours}h</span>
              </div>
              <span className="text-[10px] opacity-80 mt-0.5">{step.burned_area_hectares} ha</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Telemetry for the active timestep */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40">
          <span className="text-[10px] text-slate-400 block mb-0.5">Projected Burned Area</span>
          <span className="text-sm font-bold font-mono text-ember-400">
            {activeStep.burned_area_hectares} <span className="text-xs font-normal text-slate-300">ha</span>
          </span>
        </div>

        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40">
          <span className="text-[10px] text-slate-400 block mb-0.5">Rate of Spread (Head)</span>
          <span className="text-sm font-bold font-mono text-red-400">
            {activeStep.rate_of_spread_m_h} <span className="text-xs font-normal text-slate-300">m/h</span>
          </span>
        </div>

        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40">
          <span className="text-[10px] text-slate-400 block mb-0.5">Flame Length Est.</span>
          <span className="text-sm font-bold font-mono text-amber-300">
            {simulation.estimated_flame_height_m} <span className="text-xs font-normal text-slate-300">m</span>
          </span>
        </div>

        <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40">
          <span className="text-[10px] text-slate-400 block mb-0.5">Evacuation Radius</span>
          <span className="text-sm font-bold font-mono text-cyan-300">
            {simulation.recommended_evacuation_radius_km} <span className="text-xs font-normal text-slate-300">km</span>
          </span>
        </div>
      </div>
    </div>
  );
};
