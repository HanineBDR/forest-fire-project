"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/Header";
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
import { MapSkeleton } from "@/components/MapSkeleton";

// Dynamic import of Map to prevent SSR Leaflet window errors
const DynamicMap = dynamic(() => import("@/components/Map").then((mod) => mod.Map), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export default function Home() {
  const [regions, setRegions] = useState<RegionPreset[]>(DEFAULT_REGIONS);
  const [firmsHotspots, setFirmsHotspots] = useState<FIRMSHotspot[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("yakouren");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number }>({
    lat: 36.7350,
    lon: 4.4350,
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [activeHorizonIndex, setActiveHorizonIndex] = useState<number>(1); // Default to +3h view
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCustomOverride, setIsCustomOverride] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Load initial data and run prediction on primary hot zone (Yakouren Forest)
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

        const temp = customWeather ? customWeather.temp : weatherData?.temperature ?? 36.0;
        const wind = customWeather ? customWeather.wind : weatherData?.wind_speed ?? 24.0;
        const humidity = customWeather ? customWeather.humidity : weatherData?.humidity ?? 22.0;
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
      // Initialize with Yakouren Forest
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
    <main className="min-h-screen flex flex-col bg-slatebg-950 text-slate-100">
      {/* Top Navigation Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex flex-col p-3 sm:p-5 max-w-[1680px] w-full mx-auto gap-4">
        {/* Strategic Regions Fast Jump Bar */}
        <QuickPresets
          regions={regions}
          selectedRegionId={selectedRegionId}
          onSelectRegion={handleSelectRegion}
          isLoading={isLoading}
        />

        {/* Main Work Area: Map + Telemetry Dashboard */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[600px]">
          {/* Map & Spread Controls Column (7 Cols on desktop) */}
          <div
            className={`lg:col-span-7 flex flex-col gap-3 min-h-[500px] ${
              isSidebarOpen ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="flex-1 relative min-h-[440px]">
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

            {/* Fire Spread Timeline Scrubber */}
            <SimulationControls
              simulation={prediction?.simulation || null}
              activeHorizonIndex={activeHorizonIndex}
              onSelectHorizon={setActiveHorizonIndex}
            />
          </div>

          {/* Telemetry Sidebar Column (5 Cols on desktop) */}
          <div
            className={`lg:col-span-5 flex flex-col ${
              isSidebarOpen ? "flex" : "hidden lg:flex"
            }`}
          >
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
    </main>
  );
}
