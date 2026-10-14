"use client";

import React, { useState } from "react";
import { PredictionResult, WeatherData } from "@/types";
import {
  Thermometer,
  Wind,
  Droplets,
  CloudRain,
  Compass,
  AlertTriangle,
  Info,
  ShieldCheck,
  Zap,
  Sliders,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface RiskPanelProps {
  prediction: PredictionResult | null;
  weather: WeatherData | null;
  isLoading: boolean;
  onSimulateCustom: (params: { temp: number; wind: number; humidity: number; wind_direction: number; rain: number }) => void;
  onResetToLiveWeather: () => void;
  isCustomOverrideActive: boolean;
}

export const RiskPanel: React.FC<RiskPanelProps> = ({
  prediction,
  weather,
  isLoading,
  onSimulateCustom,
  onResetToLiveWeather,
  isCustomOverrideActive,
}) => {
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [customTemp, setCustomTemp] = useState<number>(38);
  const [customWind, setCustomWind] = useState<number>(30);
  const [customHumidity, setCustomHumidity] = useState<number>(18);
  const [customWindDir, setCustomWindDir] = useState<number>(180);
  const [customRain, setCustomRain] = useState<number>(0);

  if (isLoading) {
    return (
      <div className="bg-slatebg-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center min-h-[460px] text-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-700/40"></div>
          <div className="absolute inset-0 rounded-full border-4 border-ember-500 border-t-transparent animate-spin"></div>
        </div>
        <div>
          <h3 className="font-bold text-base text-slate-100">Calculating Wildfire Telemetry...</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Querying Open-Meteo satellite atmospheric feed and executing XGBoost FWI inference engine.
          </p>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-slatebg-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-2xl text-center flex flex-col items-center justify-center min-h-[380px] space-y-3">
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
          <Zap className="w-6 h-6 text-ember-400" />
        </div>
        <h3 className="font-bold text-slate-200">No Target Coordinate Selected</h3>
        <p className="text-xs text-slate-400 max-w-xs">
          Click anywhere on the map (Tizi Ouzou, Bejaia, Bouira) or select a forest preset to trigger real-time AI fire risk analysis.
        </p>
      </div>
    );
  }

  const { risk_score, risk_level, risk_level_fr, risk_level_ar, theme_color, fwi_metrics, contributing_factors, civil_protection_advisory, is_sirocco } = prediction;

  const handleApplyCustom = () => {
    onSimulateCustom({
      temp: customTemp,
      wind: customWind,
      humidity: customHumidity,
      wind_direction: customWindDir,
      rain: customRain,
    });
  };

  return (
    <div className="bg-slatebg-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4 text-xs">
      {/* Top Header: Risk Gauge & Classification */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Wildfire Risk Index</span>
            {is_sirocco && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950/90 text-red-400 border border-red-800/60 animate-pulse">
                SIROCCO ALERT
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-extrabold font-mono tracking-tight" style={{ color: theme_color }}>
              {risk_score}%
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-sm" style={{ color: theme_color }}>
                {risk_level}
              </span>
              <span className="text-[11px] text-slate-400">
                {risk_level_fr} • {risk_level_ar}
              </span>
            </div>
          </div>
        </div>

        {/* Circular Progress Bar Indicator */}
        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle cx="32" cy="32" r="26" stroke="#1e293b" strokeWidth="5" fill="none" />
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke={theme_color}
              strokeWidth="5"
              fill="none"
              strokeDasharray={163.36}
              strokeDashoffset={163.36 - (163.36 * risk_score) / 100}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-bold text-slate-200">
            {Math.round(risk_score)}%
          </div>
        </div>
      </div>

      {/* Target Location Metadata */}
      <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40 flex items-center justify-between text-slate-300">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Coordinates</span>
          <span className="font-mono text-xs font-semibold text-slate-200">
            {prediction.input.lat.toFixed(4)}° N, {prediction.input.lon.toFixed(4)}° E
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Model Engine</span>
          <span className="font-mono text-[11px] text-emerald-400 font-semibold">{prediction.engine.split(" ")[0]} ML</span>
        </div>
      </div>

      {/* Meteorological Conditions (Open-Meteo) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-ember-400" />
            <span>Atmospheric Observations (Open-Meteo)</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {isCustomOverrideActive ? "🧪 Simulated Override" : "🛰️ Live Satellite"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Temperature */}
          <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
              <span>Temperature</span>
              <Thermometer className="w-3 h-3 text-red-400" />
            </div>
            <div className="text-sm font-bold font-mono text-slate-100">{prediction.input.temp}°C</div>
          </div>

          {/* Humidity */}
          <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
              <span>Humidity</span>
              <Droplets className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-sm font-bold font-mono text-slate-100">{prediction.input.humidity}%</div>
          </div>

          {/* Wind Speed */}
          <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
              <span>Wind Speed</span>
              <Wind className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-sm font-bold font-mono text-slate-100">{prediction.input.wind} km/h</div>
          </div>

          {/* Wind Direction */}
          <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
              <span>Direction</span>
              <Compass className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-sm font-bold font-mono text-slate-100">
              {prediction.input.wind_direction ?? 180}°
            </div>
          </div>
        </div>
      </div>

      {/* Canadian Forest Fire Weather Index (FWI) Components */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Canadian FWI System Telemetry
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Calibrated</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/30 text-center">
            <span className="text-[9px] text-slate-400 block font-semibold">FFMC</span>
            <span className="text-xs font-mono font-bold text-amber-300">{fwi_metrics.ffmc}</span>
          </div>
          <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/30 text-center">
            <span className="text-[9px] text-slate-400 block font-semibold">ISI</span>
            <span className="text-xs font-mono font-bold text-orange-400">{fwi_metrics.isi}</span>
          </div>
          <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/30 text-center">
            <span className="text-[9px] text-slate-400 block font-semibold">BUI</span>
            <span className="text-xs font-mono font-bold text-red-400">{fwi_metrics.bui}</span>
          </div>
          <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/30 text-center">
            <span className="text-[9px] text-slate-400 block font-semibold">FWI</span>
            <span className="text-xs font-mono font-bold text-purple-400">{fwi_metrics.fwi}</span>
          </div>
        </div>
      </div>

      {/* Contributing Factors & AI Explainability */}
      <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Key Risk Drivers (Explainable AI)
        </span>
        <ul className="space-y-1">
          {contributing_factors.map((factor, idx) => (
            <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug">
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Algerian Civil Protection Advisory Alert */}
      <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3 text-red-200">
        <div className="flex items-center gap-1.5 font-bold text-xs text-red-300 mb-1">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>Protection Civile Algérienne / DGF Protocol</span>
        </div>
        <p className="text-[11px] leading-relaxed text-red-200/90">{civil_protection_advisory}</p>
      </div>

      {/* What-If Simulation Accordion */}
      <div className="border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowWhatIf(!showWhatIf)}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showWhatIf ? "Hide Weather Simulation Lab" : "Simulate What-If Weather Scenario"}</span>
          </button>

          {isCustomOverrideActive && (
            <button
              onClick={onResetToLiveWeather}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Live</span>
            </button>
          )}
        </div>

        {showWhatIf && (
          <div className="mt-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-3">
            <p className="text-[11px] text-slate-400">
              Adjust meteorological controls to test extreme heatwaves, Sirocco desert winds, and dry spells.
            </p>

            {/* Temp Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span>Temperature:</span>
                <span className="font-bold text-red-400">{customTemp}°C</span>
              </div>
              <input
                type="range"
                min="15"
                max="48"
                step="0.5"
                value={customTemp}
                onChange={(e) => setCustomTemp(parseFloat(e.target.value))}
                className="w-full accent-ember-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Wind Speed Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span>Wind Speed:</span>
                <span className="font-bold text-emerald-400">{customWind} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="75"
                step="1"
                value={customWind}
                onChange={(e) => setCustomWind(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Humidity Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span>Relative Humidity:</span>
                <span className="font-bold text-cyan-400">{customHumidity}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="90"
                step="1"
                value={customHumidity}
                onChange={(e) => setCustomHumidity(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Wind Direction Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span>Wind Direction (Sirocco = 180°):</span>
                <span className="font-bold text-amber-400">{customWindDir}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={customWindDir}
                onChange={(e) => setCustomWindDir(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            <button
              onClick={handleApplyCustom}
              className="w-full py-2 bg-gradient-to-r from-ember-600 to-red-600 hover:from-ember-500 hover:to-red-500 text-white font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Scenario Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
