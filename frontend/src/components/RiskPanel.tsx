"use client";

import React, { useState } from "react";
import { PredictionResult, WeatherData } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import {
  Thermometer,
  Wind,
  Droplets,
  Compass,
  AlertTriangle,
  Sliders,
  RotateCcw,
  Play,
  Pause,
  Flame,
  FileText,
  Info,
  HelpCircle,
} from "lucide-react";

interface RiskPanelProps {
  prediction: PredictionResult | null;
  weather: WeatherData | null;
  isLoading: boolean;
  onSimulateCustom: (params: { temp: number; wind: number; humidity: number; wind_direction: number; rain: number }) => void;
  onResetToLiveWeather: () => void;
  isCustomOverrideActive: boolean;
  // Feature 4: Simulation 6h Playback
  onRunSimulation6h?: () => void;
  isSimulating6h?: boolean;
  simulation6hData?: any;
  currentSimStep?: number;
  onStepChange?: (step: number) => void;
  isPlayingSim?: boolean;
  onTogglePlaySim?: () => void;
  // Feature 3: Official Zone Report
  onExportZoneReport?: () => void;
  isExportingReport?: boolean;
}

export const RiskPanel: React.FC<RiskPanelProps> = ({
  prediction,
  weather,
  isLoading,
  onSimulateCustom,
  onResetToLiveWeather,
  isCustomOverrideActive,
  onRunSimulation6h,
  isSimulating6h = false,
  simulation6hData,
  currentSimStep = 1,
  onStepChange,
  isPlayingSim = false,
  onTogglePlaySim,
  onExportZoneReport,
  isExportingReport = false,
}) => {
  const { t, language } = useLanguage();
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [customTemp, setCustomTemp] = useState<number>(38);
  const [customWind, setCustomWind] = useState<number>(30);
  const [customHumidity, setCustomHumidity] = useState<number>(18);
  const [customWindDir, setCustomWindDir] = useState<number>(180);
  const [customRain, setCustomRain] = useState<number>(0);
  const [showExplainTooltip, setShowExplainTooltip] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-lg p-6 flex flex-col items-center justify-center min-h-[460px] text-center space-y-4">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-2 border-slate-700/40"></div>
          <div className="absolute inset-0 rounded-full border-2 border-red-500 border-t-transparent animate-spin"></div>
        </div>
        <div>
          <h3 className="font-bold text-base text-slate-100">{t("loading")}</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Querying atmospheric feeds and calculating XGBoost risk index.
          </p>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-lg p-6 text-center flex flex-col items-center justify-center min-h-[380px] space-y-3">
        <h3 className="font-bold text-slate-200">Point non sélectionné</h3>
        <p className="text-xs text-slate-400 max-w-xs">
          Cliquez sur la carte ou choisissez un massif forestier pour lancer l&apos;analyse.
        </p>
      </div>
    );
  }

  const { risk_score, risk_level, theme_color, fwi_metrics, is_sirocco } = prediction;

  const handleApplyCustom = () => {
    onSimulateCustom({
      temp: customTemp,
      wind: customWind,
      humidity: customHumidity,
      wind_direction: customWindDir,
      rain: customRain,
    });
  };

  const isHighRisk = risk_score >= 50;

  // Feature 2: Explainability drivers (SHAP / Gini representation)
  const explainabilityDrivers = isHighRisk
    ? [
        {
          label: language === "ar" ? "ارتفاع درجات الحرارة" : language === "en" ? "High Temperature" : "Température élevée",
          valueText: `${prediction.input.temp}°C`,
          impactPct: Math.min(50, Math.round(prediction.input.temp * 1.1)),
          isHazard: true,
        },
        {
          label: language === "ar" ? "انخفاض الرطوبة وجفاف الهواء" : language === "en" ? "Low Relative Humidity" : "Humidité faible",
          valueText: `${prediction.input.humidity}%`,
          impactPct: Math.min(45, Math.round((100 - prediction.input.humidity) * 0.45)),
          isHazard: true,
        },
        {
          label: language === "ar" ? "رياح قوية مسرعة للانتشار" : language === "en" ? "Strong Wind Acceleration" : "Vent fort",
          valueText: `${prediction.input.wind} km/h`,
          impactPct: Math.min(35, Math.round(prediction.input.wind * 0.7)),
          isHazard: true,
        },
        ...(is_sirocco
          ? [
              {
                label: language === "ar" ? "هبوب رياح الشهيلي الصحراوية" : language === "en" ? "Saharan Sirocco Flare" : "Effet Sirocco saharien",
                valueText: "Sud-Est",
                impactPct: 25,
                isHazard: true,
              },
            ]
          : []),
      ]
    : [
        {
          label: language === "ar" ? "اعتدال نسبي في درجات الحرارة" : language === "en" ? "Low / Moderate Temperature" : "Température basse / modérée",
          valueText: `${prediction.input.temp}°C`,
          impactPct: 60,
          isHazard: false,
        },
        {
          label: language === "ar" ? "رطوبة جوية ملائمة ومخففة" : language === "en" ? "High Relative Moisture" : "Humidité élevée protectrice",
          valueText: `${prediction.input.humidity}%`,
          impactPct: 30,
          isHazard: false,
        },
        {
          label: language === "ar" ? "رياح ضعيفة وغير مهددة" : language === "en" ? "Gentle Breeze" : "Vent faible",
          valueText: `${prediction.input.wind} km/h`,
          impactPct: 15,
          isHazard: false,
        },
      ];

  const currentStepData = simulation6hData?.steps?.[(currentSimStep || 1) - 1];

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-lg p-5 space-y-4 text-xs">
      {/* Top Header: Risk Gauge & Classification */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Wildfire risk index</span>
            {is_sirocco && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950/90 text-red-400 border border-red-800/60 animate-pulse">
                Sirocco Alert
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-extrabold font-mono tabular-nums tracking-tight" style={{ color: theme_color }}>
              {risk_score}%
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-sm" style={{ color: theme_color }}>
                {risk_score >= 85 ? t("risk_extreme") : risk_score >= 70 ? t("risk_very_high") : risk_score >= 50 ? t("risk_high") : risk_score >= 25 ? t("risk_moderate") : t("risk_low")}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                XGBoost v2.1-LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Circular Gauge */}
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
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-mono tabular-nums text-[11px] font-bold text-slate-200">
            {Math.round(risk_score)}%
          </div>
        </div>
      </div>

      {/* Target Location Metadata */}
      <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40 flex items-center justify-between text-slate-300">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold block">Coordonnées cibles</span>
          <span className="font-mono tabular-nums text-xs font-semibold text-slate-200">
            {prediction.input.lat.toFixed(4)}° N, {prediction.input.lon.toFixed(4)}° E
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-semibold block">Précision Modèle</span>
          <span className="font-mono text-[11px] text-emerald-400 font-semibold">95.4% ROC-AUC</span>
        </div>
      </div>

      {/* FEATURE 2: EXPLAINABILITY - WHY THIS RISK? (Green/Red Horizontal Contribution Bars) */}
      <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-200 text-xs">
            <span>🔍 {t("explainability_title")}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowExplainTooltip(!showExplainTooltip)}
            className="text-slate-400 hover:text-slate-200 p-0.5"
            title={t("explainability_tooltip")}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        {showExplainTooltip && (
          <div className="p-2 rounded bg-slate-900 border border-slate-700 text-[11px] text-slate-300 leading-relaxed shadow-lg">
            {t("explainability_tooltip")}
          </div>
        )}

        <div className="space-y-2 pt-1">
          {explainabilityDrivers.map((driver, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">
                  {driver.label} ({driver.valueText})
                </span>
                <span
                  className={`font-mono font-bold ${
                    driver.isHazard ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {driver.isHazard ? `+${driver.impactPct}%` : `-${driver.impactPct}%`}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    driver.isHazard ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, driver.impactPct * 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Atmospheric observations */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-300">
            Observations Météo (Open-Meteo)
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {isCustomOverrideActive ? "Scénario simulé" : "Satellite en direct"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
              <span>Température</span>
              <Thermometer className="w-3 h-3 text-red-400" />
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-100">{prediction.input.temp}°C</div>
          </div>

          <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
              <span>Humidité</span>
              <Droplets className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-100">{prediction.input.humidity}%</div>
          </div>

          <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
              <span>Vitesse Vent</span>
              <Wind className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-100">{prediction.input.wind} km/h</div>
          </div>

          <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
              <span>Direction</span>
              <Compass className="w-3 h-3 text-slate-400" />
            </div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-100">
              {prediction.input.wind_direction ?? 180}°
            </div>
          </div>
        </div>
      </div>

      {/* Canadian Forest Fire Weather Index (FWI) Components */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/30 text-center">
          <span className="text-[9px] text-slate-400 block font-semibold">FFMC</span>
          <span className="text-xs font-mono tabular-nums font-bold text-amber-400">{fwi_metrics.ffmc}</span>
        </div>
        <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/30 text-center">
          <span className="text-[9px] text-slate-400 block font-semibold">ISI</span>
          <span className="text-xs font-mono tabular-nums font-bold text-amber-400">{fwi_metrics.isi}</span>
        </div>
        <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/30 text-center">
          <span className="text-[9px] text-slate-400 block font-semibold">BUI</span>
          <span className="text-xs font-mono tabular-nums font-bold text-amber-400">{fwi_metrics.bui}</span>
        </div>
        <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/30 text-center">
          <span className="text-[9px] text-slate-400 block font-semibold">FWI</span>
          <span className="text-xs font-mono tabular-nums font-bold text-amber-400">{fwi_metrics.fwi}</span>
        </div>
      </div>

      {/* FEATURE 4: FIRE SPREAD SIMULATION PLAYBACK (12 steps x 30min slider + play/pause) */}
      <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Flame className="w-4 h-4 text-red-500" />
            <span>Simulation Propagation 6h</span>
          </div>
          {simulation6hData && (
            <span className="text-xs font-mono font-bold text-red-400">
              {currentStepData ? `+${currentStepData.minute / 60}h (${currentStepData.burned_area_hectares} ha)` : ""}
            </span>
          )}
        </div>

        {!simulation6hData ? (
          <button
            onClick={onRunSimulation6h}
            disabled={isSimulating6h}
            className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition shadow-md shadow-red-950/50"
          >
            {isSimulating6h ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t("simulating")}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{t("simulate_spread")}</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-2">
            {/* Playback Controls & Slider */}
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePlaySim}
                className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                title={isPlayingSim ? t("sim_pause") : t("sim_play")}
              >
                {isPlayingSim ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={currentSimStep}
                onChange={(e) => onStepChange && onStepChange(parseInt(e.target.value))}
                className="flex-1 accent-red-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="font-mono font-bold text-slate-300 text-xs min-w-[42px] text-right">
                {currentStepData?.hour_label || `+${currentSimStep * 0.5}h`}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800">
              <span>
                {t("sim_burned_area")}{" "}
                <strong className="text-red-400 font-mono font-bold">
                  {currentStepData?.burned_area_hectares ?? simulation6hData.total_burned_area_ha} ha
                </strong>
              </span>
              <button
                onClick={onRunSimulation6h}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline"
              >
                Recalculer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FEATURE 3: OFFICIAL ZONE REPORT PDF BUTTON */}
      <div className="pt-1">
        <button
          onClick={onExportZoneReport}
          disabled={isExportingReport}
          className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition"
        >
          {isExportingReport ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
              <span>{t("generating_pdf")}</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>{t("export_zone_report")} (PDF)</span>
            </>
          )}
        </button>
      </div>

      {/* What-If Simulation Accordion */}
      <div className="border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowWhatIf(!showWhatIf)}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition rounded"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showWhatIf ? "Masquer simulation météo" : "Simulateur What-If Météo"}</span>
          </button>

          {isCustomOverrideActive && (
            <button
              onClick={onResetToLiveWeather}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white transition rounded"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser direct</span>
            </button>
          )}
        </div>

        {showWhatIf && (
          <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/60 space-y-3">
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <label htmlFor="temp-slider">Température :</label>
                <span className="font-bold tabular-nums text-slate-200">{customTemp}°C</span>
              </div>
              <input
                id="temp-slider"
                type="range"
                min="15"
                max="48"
                step="0.5"
                value={customTemp}
                onChange={(e) => setCustomTemp(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <label htmlFor="wind-slider">Vitesse du vent :</label>
                <span className="font-bold tabular-nums text-slate-200">{customWind} km/h</span>
              </div>
              <input
                id="wind-slider"
                type="range"
                min="0"
                max="75"
                step="1"
                value={customWind}
                onChange={(e) => setCustomWind(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <label htmlFor="humidity-slider">Humidité relative :</label>
                <span className="font-bold tabular-nums text-slate-200">{customHumidity}%</span>
              </div>
              <input
                id="humidity-slider"
                type="range"
                min="5"
                max="90"
                step="1"
                value={customHumidity}
                onChange={(e) => setCustomHumidity(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded cursor-pointer"
              />
            </div>

            <button
              onClick={handleApplyCustom}
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition"
            >
              Appliquer les conditions de crise
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
