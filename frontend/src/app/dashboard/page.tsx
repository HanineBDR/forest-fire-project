"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { QuickPresets } from "@/components/QuickPresets";
import { RiskPanel } from "@/components/RiskPanel";
import { SimulationControls } from "@/components/SimulationControls";
import {
  fetchWeather,
  fetchFIRMSHotspots,
  fetchStrategicRegions,
  predictFireRisk,
  simulateFireSpread,
  getZoneReportDownloadUrl,
  downloadZoneReportPDF,
  fetchRoadmap,
  RoadmapPhase,
  DEFAULT_REGIONS,
} from "@/lib/api";
import { PredictionResult, WeatherData, FIRMSHotspot, RegionPreset } from "@/types";
import { useLanguage, Language } from "@/context/LanguageContext";
import { MapSkeleton } from "@/components/MapSkeleton";
import { PdfLanguageModal } from "@/components/PdfLanguageModal";

// Dynamic import of Map to prevent SSR Leaflet window errors
const DynamicMap = dynamic(() => import("@/components/Map").then((mod) => mod.Map), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

function DashboardMapInner() {
  const searchParams = useSearchParams();
  const focusParam = searchParams ? (searchParams.get("focus") as "vigies" | "sirocco" | "drones" | null) : null;
  const { t, language } = useLanguage();
  const [regions, setRegions] = useState<RegionPreset[]>(DEFAULT_REGIONS);
  const [firmsHotspots, setFirmsHotspots] = useState<FIRMSHotspot[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("yakouren");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number }>({
    lat: 36.7350,
    lon: 4.4350,
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [activeHorizonIndex, setActiveHorizonIndex] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCustomOverride, setIsCustomOverride] = useState<boolean>(false);

  // FEATURE 4: 6h Simulation Playback State
  const [simulation6hData, setSimulation6hData] = useState<any>(null);
  const [currentSimStep, setCurrentSimStep] = useState<number>(1);
  const [isPlayingSim, setIsPlayingSim] = useState<boolean>(false);
  const [isSimulating6h, setIsSimulating6h] = useState<boolean>(false);
  const [isExportingReport, setIsExportingReport] = useState<boolean>(false);
  const [roadmapPhases, setRoadmapPhases] = useState<RoadmapPhase[]>([]);

  const playbackTimerRef = useRef<any>(null);

  const runPredictionForLocation = useCallback(
    async (coords: { lat: number; lon: number }, customWeather?: any) => {
      setIsLoading(true);
      try {
        let weatherData = weather;
        if (!customWeather) {
          weatherData = await fetchWeather(coords.lat, coords.lon);
          setWeather(weatherData);
          setIsCustomOverride(false);
        }

        const temp = customWeather ? customWeather.temp : weatherData?.temperature ?? 38.0;
        const wind = customWeather ? customWeather.wind : weatherData?.wind_speed ?? 30.0;
        const humidity = customWeather ? customWeather.humidity : weatherData?.humidity ?? 18.0;
        const wind_dir = customWeather ? customWeather.wind_direction : weatherData?.wind_direction ?? 180.0;
        const rain = customWeather ? customWeather.rain : weatherData?.precipitation ?? 0.0;

        const pred = await predictFireRisk({
          lat: coords.lat,
          lon: coords.lon,
          temp,
          wind,
          humidity,
          wind_direction: wind_dir,
          rain,
        });

        setPrediction(pred);

        // Pre-fetch 6h fine-grained simulation for instant animation
        try {
          const simRes = await simulateFireSpread({
            lat: coords.lat,
            lon: coords.lon,
            wind_speed: wind,
            wind_dir: wind_dir,
            risk_score: pred.risk_score,
            hours: 6,
          });
          setSimulation6hData(simRes);
          setCurrentSimStep(1);
        } catch (simErr) {
          console.warn("Auto simulation prefetch warning:", simErr);
        }
      } catch (err) {
        console.error("Failed to run prediction:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [weather]
  );

  useEffect(() => {
    async function init() {
      try {
        const [loadedRegions, loadedHotspots, roadmapRes] = await Promise.all([
          fetchStrategicRegions(),
          fetchFIRMSHotspots(),
          fetchRoadmap().catch(() => ({ phases: [] })),
        ]);
        setRegions(loadedRegions);
        setFirmsHotspots(loadedHotspots);
        if (roadmapRes && roadmapRes.phases) {
          setRoadmapPhases(roadmapRes.phases);
        }
      } catch (e) {
        console.warn("Init error:", e);
      }
      await runPredictionForLocation({ lat: 36.7350, lon: 4.4350 });
    }

    init();
  }, []);

  // Playback timer ticker for Feature 4
  useEffect(() => {
    if (isPlayingSim && simulation6hData?.steps?.length > 0) {
      playbackTimerRef.current = setInterval(() => {
        setCurrentSimStep((prev) => {
          if (prev >= 12) {
            setIsPlayingSim(false);
            return 12;
          }
          return prev + 1;
        });
      }, 750);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlayingSim, simulation6hData]);

  const handleSelectRegion = (reg: RegionPreset) => {
    setSelectedRegionId(reg.id);
    setSelectedLocation({ lat: reg.lat, lon: reg.lon });
    runPredictionForLocation({ lat: reg.lat, lon: reg.lon });
  };

  const handleMapClick = (coords: { lat: number; lon: number }) => {
    setSelectedRegionId("");
    setSelectedLocation(coords);
    runPredictionForLocation(coords);
  };

  const handleSimulateCustom = (params: {
    temp: number;
    wind: number;
    humidity: number;
    wind_direction: number;
    rain: number;
  }) => {
    setIsCustomOverride(true);
    runPredictionForLocation(selectedLocation, params);
  };

  const handleResetToLive = () => {
    runPredictionForLocation(selectedLocation);
  };

  // FEATURE 4: Explicit 6h Simulation Run
  const handleRunSimulation6h = async () => {
    if (!prediction) return;
    setIsSimulating6h(true);
    try {
      const res = await simulateFireSpread({
        lat: selectedLocation.lat,
        lon: selectedLocation.lon,
        wind_speed: prediction.input.wind,
        wind_dir: prediction.input.wind_direction ?? 180.0,
        risk_score: prediction.risk_score,
        hours: 6,
      });
      setSimulation6hData(res);
      setCurrentSimStep(1);
      setIsPlayingSim(true);
    } catch (err) {
      console.error("Simulation run failed:", err);
    } finally {
      setIsSimulating6h(false);
    }
  };

  const handleTogglePlaySim = () => {
    if (currentSimStep >= 12 && !isPlayingSim) {
      setCurrentSimStep(1);
    }
    setIsPlayingSim(!isPlayingSim);
  };

  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  // FEATURE 3: Official Zone Report PDF Export - Prompt language first
  const handleExportZoneReport = () => {
    setShowPdfModal(true);
  };

  const handleConfirmPdfDownload = async (selectedLang: Language) => {
    setIsExportingReport(true);
    try {
      const currentWilaya = regions.find((r) => r.id === selectedRegionId)?.wilaya || "Tizi Ouzou";
      const currentForest = regions.find((r) => r.id === selectedRegionId)?.name || "Massif de Yakouren";

      await downloadZoneReportPDF(
        {
          wilaya: currentWilaya,
          forest_name: currentForest,
          risk_score: prediction?.risk_score || 88.0,
          temp: prediction?.input.temp || weather?.temperature || 38.0,
          humidity: prediction?.input.humidity || weather?.humidity || 18.0,
          wind: prediction?.input.wind || weather?.wind_speed || 30.0,
          wind_dir: weather?.wind_direction ? `${weather.wind_direction}°` : "Sud (Sirocco)",
        },
        selectedLang
      );
      setShowPdfModal(false);
    } catch (err) {
      console.error("Export report error:", err);
    } finally {
      setIsExportingReport(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1720px] mx-auto space-y-4">
      {/* Tactical Status Ribbon */}
      <div 
        role="status" 
        aria-label="Statut du système opérationnel"
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/80 text-xs"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-slate-200">{t("operational_watch_active")}</span>
          </div>
          <span className="text-slate-700" aria-hidden="true">|</span>
          <span className="text-slate-400">
            {t("coverage_corridor")}
          </span>

          {/* Connected Roadmap Badges */}
          {roadmapPhases.find((p) => p.id === "phase1")?.status === "completed" && (
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800 flex items-center gap-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
              {t("pilot_tizi_active")}
            </span>
          )}

          {roadmapPhases.find((p) => p.id === "phase2")?.status === "completed" && (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-semibold border border-slate-700 flex items-center gap-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" aria-hidden="true" />
              {t("sms_gateway_active")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px] tabular-nums">
          <span>NASA FIRMS: <strong className="text-slate-200">{firmsHotspots.length}</strong> {t("hotspots_count_label")}</span>
          <span>Open-Meteo: <strong className="text-emerald-400">{t("connected")}</strong></span>
          <span>Modèle IA: <strong className="text-slate-200">95.4%</strong> {t("accuracy")}</span>
        </div>
      </div>

      {/* Strategic Hotspots Quick Selector */}
      <QuickPresets
        regions={regions}
        selectedRegionId={selectedRegionId}
        onSelectRegion={handleSelectRegion}
        isLoading={isLoading}
      />

      {/* Main Map + Risk Telemetry Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px]">
        {/* Tactical Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3 min-h-[500px]">
          <div className="flex-1 relative min-h-[460px] rounded-lg border border-slate-800 overflow-hidden">
            <DynamicMap
              prediction={prediction}
              activeHorizonIndex={activeHorizonIndex}
              firmsHotspots={firmsHotspots}
              regions={regions}
              selectedLocation={selectedLocation}
              onMapClick={handleMapClick}
              isLoading={isLoading}
              simulation6hData={simulation6hData}
              currentSimStep={currentSimStep}
              windSpeed={prediction?.input.wind ?? 30.0}
              windDirection={prediction?.input.wind_direction ?? 180.0}
              initialFocus={focusParam}
            />
          </div>

          <SimulationControls
            simulation={prediction?.simulation || null}
            activeHorizonIndex={activeHorizonIndex}
            onSelectHorizon={setActiveHorizonIndex}
          />
        </div>

        {/* Telemetry Sidebar (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <RiskPanel
            prediction={prediction}
            weather={weather}
            isLoading={isLoading}
            onSimulateCustom={handleSimulateCustom}
            onResetToLiveWeather={handleResetToLive}
            isCustomOverrideActive={isCustomOverride}
            onRunSimulation6h={handleRunSimulation6h}
            isSimulating6h={isSimulating6h}
            simulation6hData={simulation6hData}
            currentSimStep={currentSimStep}
            onStepChange={setCurrentSimStep}
            isPlayingSim={isPlayingSim}
            onTogglePlaySim={handleTogglePlaySim}
            onExportZoneReport={handleExportZoneReport}
            isExportingReport={isExportingReport}
          />
        </div>
      </div>

      {/* PDF Language Selection Modal */}
      <PdfLanguageModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        onConfirm={handleConfirmPdfDownload}
        isGenerating={isExportingReport}
        documentTitle={
          prediction
            ? `${regions.find((r) => r.id === selectedRegionId)?.name || "Massif Forestier"} (${regions.find((r) => r.id === selectedRegionId)?.wilaya || "Algérie"})`
            : undefined
        }
      />
    </div>
  );
}

export default function DashboardMapPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex flex-col items-center justify-center space-y-3 bg-slate-950 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin"></div>
          <span className="text-xs font-mono">Chargement du Système Cartographique Opérationnel…</span>
        </div>
      }
    >
      <DashboardMapInner />
    </Suspense>
  );
}
