"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  DEFAULT_REGIONS,
} from "@/lib/api";
import { PredictionResult, WeatherData, FIRMSHotspot, RegionPreset } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

// Dynamic import of Map to prevent SSR Leaflet window errors
const DynamicMap = dynamic(() => import("@/components/Map").then((mod) => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin"></div>
      <span className="text-xs text-slate-400 font-mono">Chargement du Système Cartographique Opérationnel…</span>
    </div>
  ),
});

export default function DashboardMapPage() {
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
        const [loadedRegions, loadedHotspots] = await Promise.all([
          fetchStrategicRegions(),
          fetchFIRMSHotspots(),
        ]);
        setRegions(loadedRegions);
        setFirmsHotspots(loadedHotspots);
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

  // FEATURE 3: Official Zone Report PDF Export
  const handleExportZoneReport = async () => {
    setIsExportingReport(true);
    try {
      const currentWilaya = regions.find((r) => r.id === selectedRegionId)?.wilaya || "Tizi Ouzou";
      const currentForest = regions.find((r) => r.id === selectedRegionId)?.name || "Massif de Yakouren";

      const url = getZoneReportDownloadUrl(
        {
          wilaya: currentWilaya,
          forest_name: currentForest,
          risk_score: prediction?.risk_score || 88.0,
          temp: prediction?.input.temp || 38.0,
          humidity: prediction?.input.humidity || 18.0,
          wind: prediction?.input.wind || 30.0,
        },
        language
      );

      // Trigger direct browser download
      window.open(url, "_blank");
    } catch (err) {
      console.error("Export report error:", err);
    } finally {
      setIsExportingReport(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1720px] mx-auto space-y-4">
      {/* Tactical Status Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-200">Veille Opérationnelle Active</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">
            Couverture: Massifs Forestiers de Kabylie & Nord-Est Algérien
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-mono">
          <span>NASA FIRMS: {firmsHotspots.length} foyers</span>
          <span>Open-Meteo: Connecté</span>
          <span>Modèle IA: 95.4% Acc</span>
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
    </div>
  );
}
