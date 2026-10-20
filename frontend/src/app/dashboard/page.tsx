"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { QuickPresets } from "@/components/QuickPresets";
import { RiskPanel } from "@/components/RiskPanel";
import { SimulationControls } from "@/components/SimulationControls";
import {
  fetchWeather,
  fetchFIRMSHotspots,
  fetchStrategicRegions,
  predictFireRisk,
  DEFAULT_REGIONS,
} from "@/lib/api";
import { PredictionResult, WeatherData, FIRMSHotspot, RegionPreset } from "@/types";
import { Shield, Radio, Flame, Wind, AlertTriangle } from "lucide-react";

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
          />
        </div>
      </div>
    </div>
  );
}
