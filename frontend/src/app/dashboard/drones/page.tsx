"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Plane,
  AlertTriangle,
  Radio,
  Thermometer,
  Wind,
  Battery,
  Signal,
  WifiOff,
  Crosshair,
  Camera,
  Compass,
  MapPin,
  RefreshCw,
  PowerOff,
} from "lucide-react";
import { MapSkeleton } from "@/components/MapSkeleton";
import { DEFAULT_REGIONS } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const DynamicMap = dynamic(() => import("@/components/Map").then((mod) => mod.Map), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export default function DronesPage() {
  const { t } = useLanguage();
  const [selectedDroneId] = useState("UAV-DZ-01");
  const [flightStatus] = useState("DOCKED");

  return (
    <div data-tour="drones" className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl w-full mx-auto gap-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Plane className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("drones_page_title")}
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            {t("drones_page_subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" aria-hidden="true" />
            {t("drones_interface_ready")}
          </span>
        </div>
      </div>

      {/* Inactive Hardware Notice Banner */}
      <div className="rounded-lg border border-amber-800/80 bg-amber-950/40 p-4 flex items-start gap-3 text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            {t("drones_hardware_notice_title")}
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            {t("drones_hardware_notice_desc")}
          </p>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Flight Path Tactical Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <Crosshair className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>{t("drones_flight_path")}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {t("drones_base_yakouren")}
            </span>
          </div>

          <div className="relative min-h-[460px] flex-1 rounded-lg border border-slate-800 overflow-hidden bg-slate-900">
            <DynamicMap
              prediction={null}
              activeHorizonIndex={0}
              onMapClick={() => {}}
              regions={DEFAULT_REGIONS}
              selectedLocation={{ lat: 36.744, lon: 4.442 }}
              initialFocus="drones"
              isLoading={false}
              firmsHotspots={[]}
            />

            {/* Tactical flight status HUD overlay */}
            <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 backdrop-blur text-xs space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500" aria-hidden="true" />
                <span className="font-mono font-bold text-white">ID: {selectedDroneId}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {t("drones_status_label")} <span className="text-amber-400 font-semibold">{flightStatus}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {t("drones_dock_station")}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry & Hardware Specification (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>{t("drones_live_telemetry")}</span>
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <WifiOff className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>{t("drones_disconnected")}</span>
              </span>
            </div>

            {/* Telemetry Metric Cards in Monospace */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                  <span>{t("drones_altitude_agl")}</span>
                  <Compass className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-500">-- m</div>
                <div className="text-[10px] text-slate-600 font-mono">{t("drones_ceiling")}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                  <span>{t("drones_autonomy")}</span>
                  <Battery className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-500">-- %</div>
                <div className="text-[10px] text-slate-600 font-mono">{t("drones_battery_type")}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                  <span>{t("drones_flir_sensor")}</span>
                  <Thermometer className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-500">-- °C</div>
                <div className="text-[10px] text-slate-600 font-mono">{t("drones_hotspot_max")}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                  <span>{t("drones_c2_link")}</span>
                  <Signal className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-500">0 bps</div>
                <div className="text-[10px] text-slate-600 font-mono">OcuSync Enterprise</div>
              </div>
            </div>

            {/* Hardware Specification Sheet */}
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {t("drones_spec_sheet")}
              </div>
              <div className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t("drones_vector")}</span>
                  <span className="text-slate-200">DJI Matrice 300 RTK</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t("drones_payload")}</span>
                  <span className="text-slate-200">Zenmuse H20T (LWIR + 20MP Zoom)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t("drones_range")}</span>
                  <span className="text-slate-200">15 km (AES-256)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t("drones_wind_resistance")}</span>
                  <span className="text-slate-200">15 m/s (54 km/h)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t("drones_ground_station")}</span>
                  <span className="text-slate-200">{t("drones_base_yakouren")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: FLIR Video Feed Placeholder */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t("drones_flir_feed_title")}</h2>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              RTSP / H.265
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">0 FPS · {t("drones_disconnected")}</span>
        </div>

        {/* 16:9 Video Canvas Placeholder */}
        <div className="relative aspect-video w-full rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
          {/* Subtle grid reticle */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* Crosshair graphic */}
          <div className="w-16 h-16 rounded-full border border-slate-700/60 flex items-center justify-center mb-3 text-slate-600">
            <PowerOff className="w-6 h-6" aria-hidden="true" />
          </div>

          <p className="text-sm font-semibold text-slate-300">
            {t("drones_waiting_connection")}
          </p>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            {t("drones_waiting_desc")}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              disabled
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
            >
              {t("drones_connect_btn")}
            </button>
            <button
              type="button"
              disabled
              className="px-3 py-2 text-xs text-slate-500 border border-slate-800 rounded-lg cursor-not-allowed opacity-60 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t("drones_test_rtsp_btn")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
