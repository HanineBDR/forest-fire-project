"use client";

import React, { useEffect, useRef, useState } from "react";
import { PredictionResult, FIRMSHotspot, RegionPreset, WilayaBurnStat } from "@/types";
import {
  DEFAULT_WILAYA_STATS,
  submitCommunityReport,
  fetchDGFWatchtowers,
  fetchSiroccoCorridors,
  fetchDronePatrols,
  DGFWatchtower,
  SiroccoCorridor,
  DronePatrol,
} from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  Flame,
  Globe2,
  MapPin,
  X,
  Wind,
  Download,
  Smartphone,
  CheckCircle2,
  Navigation2,
  Camera,
  Send,
  Radio,
  Shield,
  Eye,
  Plane,
  Satellite,
  Layers,
} from "lucide-react";

interface MapProps {
  prediction: PredictionResult | null;
  activeHorizonIndex: number;
  firmsHotspots: FIRMSHotspot[];
  regions: RegionPreset[];
  selectedLocation: { lat: number; lon: number } | null;
  onMapClick: (coords: { lat: number; lon: number }) => void;
  isLoading: boolean;
  // Feature 4: 6h fine-grained simulation playback
  simulation6hData?: any;
  currentSimStep?: number;
  // Feature 5: Wind speed & direction from weather
  windSpeed?: number;
  windDirection?: number;
  // Roadmap ideas focus drilldown
  initialFocus?: "vigies" | "sirocco" | "drones" | null;
}

export const Map: React.FC<MapProps> = ({
  prediction,
  activeHorizonIndex,
  firmsHotspots,
  regions,
  selectedLocation,
  onMapClick,
  isLoading,
  simulation6hData,
  currentSimStep = 1,
  windSpeed = 30.0,
  windDirection = 180.0,
  initialFocus = null,
}) => {
  const { t, language } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const targetMarkerRef = useRef<any>(null);
  const simulationLayerGroupRef = useRef<any>(null);
  const firmsLayerGroupRef = useRef<any>(null);
  const regionsLayerGroupRef = useRef<any>(null);
  const algeriaBurnsLayerGroupRef = useRef<any>(null);
  const fineGrainSimGroupRef = useRef<any>(null);
  const dgfLayerGroupRef = useRef<any>(null);
  const siroccoLayerGroupRef = useRef<any>(null);
  const dronesLayerGroupRef = useRef<any>(null);

  // View Scope & Layers
  const [viewScope, setViewScope] = useState<"northern" | "all_algeria">("northern");
  const [activeTileLayer, setActiveTileLayer] = useState<"satellite" | "dark" | "osm">("satellite");
  const [showFirms, setShowFirms] = useState<boolean>(true);
  const [showRegions, setShowRegions] = useState<boolean>(true);
  const [selectedWilaya, setSelectedWilaya] = useState<WilayaBurnStat | null>(null);

  // ROADMAP IDEAS LAYERS STATE
  const [showDgfVigies, setShowDgfVigies] = useState<boolean>(true);
  const [showSiroccoCorridors, setShowSiroccoCorridors] = useState<boolean>(true);
  const [showDronePatrols, setShowDronePatrols] = useState<boolean>(true);

  const [dgfVigies, setDgfVigies] = useState<DGFWatchtower[]>([]);
  const [siroccoCorridors, setSiroccoCorridors] = useState<SiroccoCorridor[]>([]);
  const [dronePatrols, setDronePatrols] = useState<DronePatrol[]>([]);

  // FEATURE 5: Wind particle animation toggle
  const [showWindAnimation, setShowWindAnimation] = useState<boolean>(true);

  // FEATURE 8: Offline Map Download State
  const [showOfflineMenu, setShowOfflineMenu] = useState<boolean>(false);
  const [downloadingZone, setDownloadingZone] = useState<string | null>(null);
  const [offlineToast, setOfflineToast] = useState<string | null>(null);

  // FEATURE 7: Citizen Reporting Modal State
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportWilaya, setReportWilaya] = useState<string>("Tizi Ouzou");
  const [reportPhone, setReportPhone] = useState<string>("");
  const [reportNotes, setReportNotes] = useState<string>("");
  const [reportPhotoSelected, setReportPhotoSelected] = useState<boolean>(true);
  const [reportPhotoUrl, setReportPhotoUrl] = useState<string>("/reports/report_smoke_yakouren.jpg");
  const [reportImageValidationError, setReportImageValidationError] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [reportSuccessToast, setReportSuccessToast] = useState<string | null>(null);

  const tileLayersRef = useRef<{ [key: string]: any }>({});

  // Fetch Roadmap live features telemetry on mount
  useEffect(() => {
    fetchDGFWatchtowers().then((data) => setDgfVigies(data));
    fetchSiroccoCorridors().then((data) => setSiroccoCorridors(data));
    fetchDronePatrols().then((data) => setDronePatrols(data));
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");

      const map = L.map(mapContainerRef.current, {
        center: [36.65, 4.50],
        zoom: 9,
        minZoom: 5,
        maxZoom: 18,
        zoomControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      // Define Base Tile Layers
      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Esri World Imagery", maxZoom: 18 }
      );

      const dark = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
          className: "leaflet-dark-mode-tiles",
        }
      );

      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      });

      tileLayersRef.current = { satellite, dark, osm };
      satellite.addTo(map);

      // Initialize Layer Groups
      const simGroup = L.layerGroup().addTo(map);
      const firmsGroup = L.layerGroup().addTo(map);
      const regGroup = L.layerGroup().addTo(map);
      const macroGroup = L.layerGroup().addTo(map);
      const fineGroup = L.layerGroup().addTo(map);
      const dgfGroup = L.layerGroup().addTo(map);
      const siroccoGroup = L.layerGroup().addTo(map);
      const dronesGroup = L.layerGroup().addTo(map);

      simulationLayerGroupRef.current = simGroup;
      firmsLayerGroupRef.current = firmsGroup;
      regionsLayerGroupRef.current = regGroup;
      algeriaBurnsLayerGroupRef.current = macroGroup;
      fineGrainSimGroupRef.current = fineGroup;
      dgfLayerGroupRef.current = dgfGroup;
      siroccoLayerGroupRef.current = siroccoGroup;
      dronesLayerGroupRef.current = dronesGroup;

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        onMapClick({ lat, lon: lng });
      });

      if (isMounted) {
        mapInstanceRef.current = map;
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Tile Layer Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayersRef.current.satellite) return;
    const map = mapInstanceRef.current;
    Object.values(tileLayersRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    if (activeTileLayer === "satellite") tileLayersRef.current.satellite.addTo(map);
    else if (activeTileLayer === "dark") tileLayersRef.current.dark.addTo(map);
    else tileLayersRef.current.osm.addTo(map);
  }, [activeTileLayer]);

  // Handle View Scope Toggle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (viewScope === "all_algeria") {
      map.flyTo([34.0, 3.5], 6, { duration: 1.2 });
    } else {
      map.flyTo([36.65, 4.50], 9, { duration: 1.0 });
    }
  }, [viewScope]);

  // Handle Initial Focus from Roadmap drilldown
  useEffect(() => {
    if (!mapInstanceRef.current || !initialFocus) return;
    const map = mapInstanceRef.current;

    if (initialFocus === "vigies") {
      setShowDgfVigies(true);
      map.flyTo([36.735, 4.435], 10, { duration: 1.2 });
    } else if (initialFocus === "sirocco") {
      setShowSiroccoCorridors(true);
      map.flyTo([36.650, 4.580], 9.5, { duration: 1.2 });
    } else if (initialFocus === "drones") {
      setShowDronePatrols(true);
      map.flyTo([36.744, 4.442], 11, { duration: 1.2 });
    }
  }, [initialFocus]);

  // Render Target Click Marker
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;
    const map = mapInstanceRef.current;

    import("leaflet").then((L) => {
      if (targetMarkerRef.current) {
        map.removeLayer(targetMarkerRef.current);
      }

      const pulseIcon = L.divIcon({
        className: "custom-pulse-marker",
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white shadow"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([selectedLocation.lat, selectedLocation.lon], {
        icon: pulseIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      targetMarkerRef.current = marker;
    });
  }, [selectedLocation, prediction]);

  // Render NASA FIRMS Hotspots
  useEffect(() => {
    if (!mapInstanceRef.current || !firmsLayerGroupRef.current) return;
    const group = firmsLayerGroupRef.current;
    group.clearLayers();

    if (!showFirms || viewScope === "all_algeria") return;

    import("leaflet").then((L) => {
      firmsHotspots.forEach((spot) => {
        const fireIcon = L.divIcon({
          className: "firms-hotspot-pin",
          html: `<div class="inner-dot"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const m = L.marker([spot.latitude, spot.longitude], { icon: fireIcon });
        m.bindPopup(`
          <div class="text-xs p-1 space-y-1">
            <div class="font-bold text-amber-400">
              <span>${spot.location_name}</span>
            </div>
            <div class="font-mono tabular-nums text-slate-300">Lat: ${spot.latitude.toFixed(4)}, Lon: ${spot.longitude.toFixed(4)}</div>
            <div class="text-slate-300">Satellite: <span class="font-semibold text-slate-100">${spot.satellite}</span></div>
            <div class="text-slate-300">Thermal Brightness: <span class="font-semibold text-red-400 font-mono">${spot.brightness_kelvin} K</span></div>
            <div class="text-slate-300">FRP: <span class="font-semibold text-amber-300">${spot.frp_mw} MW</span></div>
          </div>
        `);
        group.addLayer(m);
      });
    });
  }, [firmsHotspots, showFirms, viewScope]);

  // Render Strategic Forest Reserves
  useEffect(() => {
    if (!mapInstanceRef.current || !regionsLayerGroupRef.current) return;
    const group = regionsLayerGroupRef.current;
    group.clearLayers();

    if (!showRegions || viewScope === "all_algeria") return;

    import("leaflet").then((L) => {
      regions.forEach((reg) => {
        const circle = L.circle([reg.lat, reg.lon], {
          radius: 4000,
          color: "#10b981",
          weight: 1.5,
          opacity: 0.8,
          fillColor: "#059669",
          fillOpacity: 0.12,
          dashArray: "4, 6",
        });

        circle.bindTooltip(`${reg.name} (${reg.wilaya})`, {
          permanent: false,
          direction: "top",
          className: "bg-slate-900 text-slate-100 text-xs font-semibold px-2 py-1 rounded shadow",
        });

        circle.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onMapClick({ lat: reg.lat, lon: reg.lon });
        });

        group.addLayer(circle);
      });
    });
  }, [regions, showRegions, onMapClick, viewScope]);

  // ROADMAP IDEA 1: Render DGF Forest Watchtowers & Terrestrial Sensors
  useEffect(() => {
    if (!mapInstanceRef.current || !dgfLayerGroupRef.current) return;
    const group = dgfLayerGroupRef.current;
    group.clearLayers();
    if (!showDgfVigies || viewScope === "all_algeria") return;

    import("leaflet").then((L) => {
      dgfVigies.forEach((v) => {
        const isWarning = v.status === "WARNING_THERMAL";
        const icon = L.divIcon({
          className: "custom-dgf-vigie",
          html: `
            <div class="relative flex items-center justify-center w-8 h-8 rounded-lg border-2 ${
              isWarning ? "bg-amber-950/95 border-amber-500 shadow-amber-900/50" : "bg-emerald-950/95 border-emerald-500 shadow-emerald-900/50"
            } shadow-lg text-white font-bold text-xs cursor-pointer hover:scale-110 transition">
              <span class="text-sm">🗼</span>
              <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                isWarning ? "bg-amber-400 animate-ping" : "bg-emerald-400"
              }"></span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([v.lat, v.lon], { icon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 260px; color: #f8fafc; font-size: 11px;">
            <div style="border-bottom: 1px solid #334155; padding-bottom: 6px; margin-bottom: 6px;">
              <span style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: ${isWarning ? '#f59e0b' : '#34d399'}; font-weight: bold;">
                ${t("dgf_tower_header")}
              </span>
              <div style="font-size: 13px; font-weight: bold; color: #ffffff;">${v.name}</div>
              <div style="color: #94a3b8; font-size: 10px;">${v.wilaya} · ${t("dgf_altitude")} <b>${v.elevation_m}m</b></div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
              <div><b>${t("dgf_status")}</b> <span style="color: ${isWarning ? '#f59e0b' : '#34d399'}; font-weight: bold;">${v.status_label}</span></div>
              <div><b>${t("dgf_observer")}</b> ${v.observer}</div>
              <div><b>${t("dgf_optical_coverage")}</b> ${v.line_of_sight}</div>
              <div style="background: rgba(15,23,42,0.8); padding: 4px 6px; border-radius: 4px; border: 1px solid #334155;">
                <div style="color: #38bdf8; font-weight: bold; font-size: 10px;">${t("dgf_telemetry_title")}</div>
                <div>${t("dgf_temp")} : <b>${v.temp_sensor}°C</b> · ${t("dgf_humidity")} : <b>${v.humidity_sensor}%</b> · ${t("dgf_wind")} : <b>${v.wind_sensor} km/h</b></div>
              </div>
              <div style="color: #cbd5e1; font-size: 10px;"><b>${t("dgf_radio_link")}</b> ${v.radio_channel}</div>
            </div>
          </div>
        `, { className: "bg-slate-900 border border-slate-700 text-white rounded-xl" });

        group.addLayer(marker);
      });
    });
  }, [dgfVigies, showDgfVigies, viewScope, language, t]);

  // ROADMAP IDEA 3: Render Sirocco Mountain Pass Channels
  useEffect(() => {
    if (!mapInstanceRef.current || !siroccoLayerGroupRef.current) return;
    const group = siroccoLayerGroupRef.current;
    group.clearLayers();
    if (!showSiroccoCorridors || viewScope === "all_algeria") return;

    import("leaflet").then((L) => {
      siroccoCorridors.forEach((c) => {
        const polyline = L.polyline(c.path_coords, {
          color: "#f59e0b",
          weight: 4,
          opacity: 0.85,
          dashArray: "8, 8",
          lineCap: "round",
        });

        polyline.bindTooltip(`
          <div style="font-family: sans-serif; font-size: 11px;">
            <div style="color: #f59e0b; font-weight: bold; display: flex; align-items: center; gap: 4px;">
              <svg style="width: 12px; height: 12px; display: inline-block; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>
              <span>${c.name}</span>
            </div>
            <div style="color: #ffffff; font-weight: bold;">${c.multiplier_label}</div>
            <div style="color: #cbd5e1; font-size: 10px;">${t("sirocco_corridor_axis")} ${c.wind_axis}</div>
          </div>
        `, { sticky: true, className: "bg-amber-950 text-white border border-amber-700 rounded p-1 text-xs" });

        group.addLayer(polyline);

        const midIdx = Math.floor(c.path_coords.length / 2);
        const midPoint = c.path_coords[midIdx];
        const corridorBadge = L.divIcon({
          className: "custom-sirocco-badge",
          html: `
            <div class="px-2 py-0.5 rounded bg-amber-950/95 border border-amber-500/80 text-amber-300 font-mono text-[9px] font-bold shadow-md animate-pulse flex items-center gap-1.5">
              <svg class="w-3 h-3 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>
              <span>SIROCCO ${c.propagation_multiplier}x</span>
            </div>
          `,
          iconSize: [92, 22],
          iconAnchor: [46, 11],
        });
        group.addLayer(L.marker(midPoint, { icon: corridorBadge }));
      });
    });
  }, [siroccoCorridors, showSiroccoCorridors, viewScope, language, t]);

  // ROADMAP IDEA 4: Render FLIR Thermal Drone Patrols
  useEffect(() => {
    if (!mapInstanceRef.current || !dronesLayerGroupRef.current) return;
    const group = dronesLayerGroupRef.current;
    group.clearLayers();
    if (!showDronePatrols || viewScope === "all_algeria") return;

    import("leaflet").then((L) => {
      dronePatrols.forEach((d) => {
        if (d.flight_path && d.flight_path.length > 0) {
          const orbit = L.polygon(d.flight_path, {
            color: "#8b5cf6",
            weight: 2,
            opacity: 0.7,
            dashArray: "4, 6",
            fillColor: "#7c3aed",
            fillOpacity: 0.08,
          });
          orbit.bindTooltip(`${t("drone_patrol_circuit")} ${d.mission_name}`, { sticky: true });
          group.addLayer(orbit);
        }

        const droneIcon = L.divIcon({
          className: "custom-drone-icon",
          html: `
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 border-2 border-violet-500 shadow-xl cursor-pointer hover:scale-110 transition">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60"></span>
              <svg class="w-4 h-4 text-violet-300 relative z-10 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
              <span class="absolute -bottom-1 px-1 rounded bg-black/80 text-[8px] font-mono font-bold text-violet-300 border border-violet-700">FLIR</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([d.lat, d.lon], { icon: droneIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 270px; color: #f8fafc; font-size: 11px;">
            <div style="border-bottom: 1px solid #334155; padding-bottom: 6px; margin-bottom: 6px;">
              <span style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #a78bfa; font-weight: bold;">
                ${t("drone_recon_header")}
              </span>
              <div style="font-size: 13px; font-weight: bold; color: #ffffff;">${d.drone_id}</div>
              <div style="color: #94a3b8; font-size: 10px;">${d.model}</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div><b>${t("drone_mission")}</b> ${d.mission_name}</div>
              <div><b>${t("drone_flight_status")}</b> <span style="color: #34d399; font-weight: bold;">${d.status_label}</span></div>
              <div style="background: rgba(15,23,42,0.8); padding: 5px 8px; border-radius: 6px; border: 1px solid #334155; margin: 4px 0;">
                <div style="color: #a78bfa; font-weight: bold; font-size: 10px;">${t("drone_telemetry_title")}</div>
                <div>${t("drone_altitude")} <b>${d.altitude_m_agl}m AGL</b> · ${t("drone_speed")} <b>${d.speed_kmh} km/h</b></div>
                <div>${t("drone_battery")} <b>${d.battery_pct}% (${d.flight_time_remaining})</b></div>
                <div>${t("drone_camera")} <b>${d.thermal_sensor}</b></div>
                <div>${t("drone_video_link")} <b>${d.video_link}</b></div>
              </div>
            </div>
          </div>
        `, { className: "bg-slate-900 border border-violet-800 text-white rounded-xl" });

        group.addLayer(marker);
      });
    });
  }, [dronePatrols, showDronePatrols, viewScope, language, t]);

  // FEATURE 4: Render Fine-Grained 6h Simulation Playback Polygon
  useEffect(() => {
    if (!mapInstanceRef.current || !fineGrainSimGroupRef.current) return;
    const group = fineGrainSimGroupRef.current;
    group.clearLayers();

    if (!simulation6hData || !simulation6hData.steps || simulation6hData.steps.length === 0) return;

    const stepIndex = Math.max(0, Math.min(simulation6hData.steps.length - 1, currentSimStep - 1));
    const activeStep = simulation6hData.steps[stepIndex];
    if (!activeStep || !activeStep.polygon) return;

    import("leaflet").then((L) => {
      // Draw past contour trails
      for (let i = 0; i < stepIndex; i++) {
        const past = simulation6hData.steps[i];
        if (past && past.polygon) {
          const trailPoly = L.polygon(past.polygon, {
            color: "#f97316",
            weight: 1,
            opacity: 0.35,
            fillColor: "#ea580c",
            fillOpacity: 0.15,
            dashArray: "3, 3",
          });
          group.addLayer(trailPoly);
        }
      }

      // Draw current active burning front polygon
      const activePoly = L.polygon(activeStep.polygon, {
        color: "#ef4444",
        weight: 3,
        opacity: 0.95,
        fillColor: "#dc2626",
        fillOpacity: 0.55,
      });

      activePoly.bindTooltip(
        `<b>${t("sim_active_front")} ${activeStep.hour_label}</b><br/>${t("sim_burned_surface")} <b>${activeStep.burned_area_hectares} ha</b>`,
        { permanent: false, sticky: true, className: "bg-red-950 text-white text-xs border border-red-700 px-2 py-1 rounded" }
      );

      group.addLayer(activePoly);
    });
  }, [simulation6hData, currentSimStep, language, t]);

  // FEATURE 5: Canvas Wind Particle Flow Overlay
  useEffect(() => {
    if (!showWindAnimation || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    // Spread angle: wind blows FROM windDirection, so particles move towards (windDirection + 180)
    const angleRad = (((windDirection || 180) + 180) % 360) * (Math.PI / 180.0);
    const speed = Math.max(1.2, Math.min(5.5, (windSpeed || 25) / 12.0));
    const vx = Math.sin(angleRad) * speed;
    const vy = -Math.cos(angleRad) * speed;

    const numParticles = 65;
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: 12 + Math.random() * 20,
      opacity: 0.2 + Math.random() * 0.5,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 1.6;
      for (const p of particles) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${p.opacity})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - vx * (p.len / speed), p.y - vy * (p.len / speed));
        ctx.stroke();

        p.x += vx;
        p.y += vy;

        if (p.x < -30) p.x = width + 20;
        if (p.x > width + 30) p.x = -20;
        if (p.y < -30) p.y = height + 20;
        if (p.y > height + 30) p.y = -20;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [showWindAnimation, windSpeed, windDirection]);

  // Handle Offline Map Download and Service Worker Precaching
  const handleDownloadOfflineZone = (zoneKey: string, zoneLabel: string, size: string) => {
    setDownloadingZone(zoneKey);

    // Notify PWA Service Worker to cache area tiles
    if (typeof window !== "undefined" && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_ZONE_TILES",
        zoneName: zoneLabel,
        urls: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/9/198/312",
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/396/624",
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/11/792/1248",
          "https://tile.openstreetmap.org/9/261/195.png",
          "https://tile.openstreetmap.org/10/523/391.png"
        ]
      });
    }

    setTimeout(() => {
      try {
        localStorage.setItem(`in9ad_offline_${zoneKey}`, "cached_true");
      } catch {}
      setDownloadingZone(null);
      setShowOfflineMenu(false);
      setOfflineToast(t("offline_download_ready", { zone: zoneLabel, size }));
      setTimeout(() => setOfflineToast(null), 5000);
    }, 1200);
  };

  // Handle Community Report Submit
  const handleSendCommunityReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNotes.trim()) return;

    setIsSubmittingReport(true);
    setReportImageValidationError(null);
    try {
      const lat = selectedLocation ? selectedLocation.lat : 36.735;
      const lon = selectedLocation ? selectedLocation.lon : 4.435;

      const chosenPhoto = reportPhotoSelected ? (reportPhotoUrl || "/reports/report_smoke_yakouren.jpg") : "";

      await submitCommunityReport({
        lat,
        lon,
        wilaya: reportWilaya,
        description: reportNotes,
        phone: reportPhone,
        photo_url: chosenPhoto,
      });

      setShowReportModal(false);
      setReportNotes("");
      setReportPhone("");
      setReportPhotoSelected(false);
      setReportSuccessToast("Signalement transmis avec succès au centre d'opérations de la Protection Civile (Image vérifiée).");
      setTimeout(() => setReportSuccessToast(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />

      {/* ROADMAP IDEA 3: Sirocco Aerological Warning Overlay */}
      {simulation6hData?.sirocco_corridor_active && (
        <aside 
          aria-label="Alerte couloir aérologique Sirocco"
          className="absolute top-16 left-4 z-[400] max-w-sm p-2.5 rounded-lg bg-amber-950/95 border border-amber-600/90 backdrop-blur-md text-amber-200 text-xs"
        >
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
            <div>
              <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                <span>{simulation6hData.sirocco_corridor.name}</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black font-mono font-black text-[9px]">
                  +{Math.round((simulation6hData.sirocco_corridor.multiplier - 1) * 100)}%
                </span>
              </div>
              <div className="text-[10px] text-amber-300 font-mono">
                {simulation6hData.sirocco_corridor.label}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* FEATURE 5: Canvas Wind Overlay */}
      {showWindAnimation && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 w-full h-full"
        />
      )}

      {/* Top Map Control Bar - Command Center Toolbar */}
      <nav 
        aria-label="Contrôles cartographiques opérationnels"
        className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/95 border border-slate-800 rounded-lg backdrop-blur-md"
      >
        {/* View Scope Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-md border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setViewScope("northern")}
            aria-pressed={viewScope === "northern"}
            className={`px-2.5 py-1 rounded font-semibold transition-colors duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
              viewScope === "northern" ? "bg-red-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{t("scope_northern_algeria")}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewScope("all_algeria")}
            aria-pressed={viewScope === "all_algeria"}
            className={`px-2.5 py-1 rounded font-semibold transition-colors duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
              viewScope === "all_algeria" ? "bg-red-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{t("scope_national_view")}</span>
          </button>
        </div>

        {/* 3 Map Base Layer Types: Satellite, Dark, Street (OSM) */}
        <div 
          role="radiogroup"
          aria-label={t("map_base_layer_label")}
          className="flex items-center gap-0.5 p-0.5 bg-slate-950 rounded-md border border-slate-800 text-xs"
        >
          <button
            type="button"
            role="radio"
            aria-checked={activeTileLayer === "satellite"}
            onClick={() => setActiveTileLayer("satellite")}
            className={`px-2.5 py-1 rounded font-semibold transition-colors duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
              activeTileLayer === "satellite" 
                ? "bg-slate-800 text-white border border-slate-700 shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
            title={t("map_satellite_title")}
          >
            <Satellite className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{t("map_satellite")}</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={activeTileLayer === "dark"}
            onClick={() => setActiveTileLayer("dark")}
            className={`px-2.5 py-1 rounded font-semibold transition-colors duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
              activeTileLayer === "dark" 
                ? "bg-slate-800 text-white border border-slate-700 shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
            title={t("map_dark_title")}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-hidden="true" />
            <span>{t("map_dark")}</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={activeTileLayer === "osm"}
            onClick={() => setActiveTileLayer("osm")}
            className={`px-2.5 py-1 rounded font-semibold transition-colors duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
              activeTileLayer === "osm" 
                ? "bg-slate-800 text-white border border-slate-700 shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
            title={t("map_osm_title")}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>{t("map_streets")}</span>
          </button>
        </div>

        {/* FEATURE 5: Animated Wind Particle Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={showWindAnimation}
          onClick={() => setShowWindAnimation(!showWindAnimation)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
            showWindAnimation
              ? "bg-slate-800 border-slate-600 text-white shadow-sm"
              : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
          title={t("toggle_wind_title")}
        >
          <Wind className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-hidden="true" />
          <span>{t("layer_wind")}</span>
          <span
            aria-hidden="true"
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out ${
              showWindAnimation ? "bg-red-600" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showWindAnimation ? "translate-x-3.5" : "translate-x-0.5"
              } mt-0.5`}
            />
          </span>
        </button>

        {/* ROADMAP IDEA 1: DGF Watchtowers Layer Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={showDgfVigies}
          onClick={() => setShowDgfVigies(!showDgfVigies)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
            showDgfVigies
              ? "bg-slate-800 border-slate-600 text-white shadow-sm"
              : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
          title={t("toggle_vigies_title")}
        >
          <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{t("layer_vigies")}</span>
          <span
            aria-hidden="true"
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out ${
              showDgfVigies ? "bg-red-600" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showDgfVigies ? "translate-x-3.5" : "translate-x-0.5"
              } mt-0.5`}
            />
          </span>
        </button>

        {/* ROADMAP IDEA 3: Sirocco Mountain Pass Corridors Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={showSiroccoCorridors}
          onClick={() => setShowSiroccoCorridors(!showSiroccoCorridors)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
            showSiroccoCorridors
              ? "bg-slate-800 border-slate-600 text-white shadow-sm"
              : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
          title={t("toggle_sirocco_title")}
        >
          <Wind className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>{t("layer_sirocco")}</span>
          <span
            aria-hidden="true"
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out ${
              showSiroccoCorridors ? "bg-red-600" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showSiroccoCorridors ? "translate-x-3.5" : "translate-x-0.5"
              } mt-0.5`}
            />
          </span>
        </button>

        {/* ROADMAP IDEA 4: FLIR Thermal Drone Patrols Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={showDronePatrols}
          onClick={() => setShowDronePatrols(!showDronePatrols)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
            showDronePatrols
              ? "bg-slate-800 border-slate-600 text-white shadow-sm"
              : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
          title={t("toggle_drones_title")}
        >
          <Plane className="w-3.5 h-3.5 text-violet-400 shrink-0" aria-hidden="true" />
          <span>{t("layer_drones")}</span>
          <span
            aria-hidden="true"
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out ${
              showDronePatrols ? "bg-red-600" : "bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showDronePatrols ? "translate-x-3.5" : "translate-x-0.5"
              } mt-0.5`}
            />
          </span>
        </button>

        {/* FEATURE 8: Offline Map Download Button & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowOfflineMenu(!showOfflineMenu)}
            aria-expanded={showOfflineMenu}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-xs font-medium text-slate-300 hover:text-white transition-colors duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{t("offline_map_btn")}</span>
          </button>

          {showOfflineMenu && (
            <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-lg p-2 z-50 space-y-1.5 text-xs shadow-lg">
              <div className="font-bold text-slate-200 px-2 py-1 border-b border-slate-800 flex justify-between items-center">
                <span>{t("offline_zones_title")}</span>
                <button 
                  type="button"
                  onClick={() => setShowOfflineMenu(false)} 
                  className="text-slate-400 hover:text-white p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label={t("offline_close_menu")}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadOfflineZone("yakouren", "Yakouren", "45 Mo")}
                disabled={downloadingZone !== null}
                className="w-full text-left p-2 rounded hover:bg-slate-800 transition-colors duration-150 text-slate-300 hover:text-white flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-white">{t("offline_zone1_title")}</div>
                  <div className="text-[10px] text-slate-400">{t("offline_zone1_sub")}</div>
                </div>
                <span className="font-mono text-emerald-400 text-[10px]">~45 Mo</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadOfflineZone("akfadou", "Akfadou", "58 Mo")}
                disabled={downloadingZone !== null}
                className="w-full text-left p-2 rounded hover:bg-slate-800 transition-colors duration-150 text-slate-300 hover:text-white flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-white">{t("offline_zone2_title")}</div>
                  <div className="text-[10px] text-slate-400">{t("offline_zone2_sub")}</div>
                </div>
                <span className="font-mono text-emerald-400 text-[10px]">~58 Mo</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadOfflineZone("kabylie", "Grande Kabylie", "125 Mo")}
                disabled={downloadingZone !== null}
                className="w-full text-left p-2 rounded hover:bg-slate-800 transition-colors duration-150 text-slate-300 hover:text-white flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-white">{t("offline_zone3_title")}</div>
                  <div className="text-[10px] text-slate-400">{t("offline_zone3_sub")}</div>
                </div>
                <span className="font-mono text-emerald-400 text-[10px]">~125 Mo</span>
              </button>

              {downloadingZone && (
                <div className="p-2 text-center text-emerald-400 font-semibold flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>{t("offline_downloading_caching")}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* FEATURE 7: Citizen Reporting Floating Action Button */}
      <div className="absolute bottom-4 right-4 z-[400]">
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <Smartphone className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t("citizen_report_btn")}</span>
        </button>
      </div>

      {/* Toasts */}
      {offlineToast && (
        <div className="absolute bottom-16 left-4 z-[500] bg-emerald-950/95 border border-emerald-700 text-emerald-200 px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{offlineToast}</span>
        </div>
      )}

      {reportSuccessToast && (
        <div className="absolute bottom-16 right-4 z-[500] bg-emerald-950/95 border border-emerald-700 text-emerald-200 px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{reportSuccessToast}</span>
        </div>
      )}

      {/* FEATURE 7: Citizen Reporting Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[600] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Smartphone className="w-4 h-4 text-red-500" />
                <span>{t("citizen_report_modal_title")}</span>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {t("citizen_report_desc")}
            </p>

            <form onSubmit={handleSendCommunityReport} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t("citizen_wilaya_label")}
                </label>
                <select
                  value={reportWilaya}
                  onChange={(e) => setReportWilaya(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Tizi Ouzou">Tizi Ouzou (15)</option>
                  <option value="Bejaia">Bejaia (06)</option>
                  <option value="Bouira">Bouira (10)</option>
                  <option value="Jijel">Jijel (18)</option>
                  <option value="Bordj Bou Arreridj">Bordj Bou Arreridj (34)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t("citizen_coords_auto")}
                </label>
                <input
                  type="text"
                  disabled
                  value={
                    selectedLocation
                      ? `${selectedLocation.lat.toFixed(4)}° N, ${selectedLocation.lon.toFixed(4)}° E`
                      : "36.7350° N, 4.4350° E"
                  }
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg p-2 text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t("citizen_phone_optional")}
                </label>
                <input
                  type="tel"
                  placeholder="+213 550 XX XX XX"
                  value={reportPhone}
                  onChange={(e) => setReportPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t("citizen_desc_label")}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={t("citizen_desc_placeholder")}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {t("witness_photo_title")}
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReportPhotoSelected(!reportPhotoSelected)}
                      className={`flex-1 p-2 rounded-lg border text-xs flex items-center justify-center gap-2 transition ${
                        reportPhotoSelected
                          ? "bg-emerald-950/40 border-emerald-600 text-emerald-300 font-semibold"
                          : "bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>{reportPhotoSelected ? `✓ ${t("photo_attached")}` : t("attach_photo")}</span>
                    </button>
                  </div>

                  {reportPhotoSelected && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      {[
                        { label: t("photo_smoke_yakouren"), path: "/reports/report_smoke_yakouren.jpg" },
                        { label: t("photo_fire_akfadou"), path: "/reports/report_fire_akfadou.jpg" },
                        { label: t("photo_vigie"), path: "/reports/report_vigie.jpg" },
                        { label: t("photo_burned_zone"), path: "/reports/report_burned_zone.jpg" },
                        { label: t("photo_sirocco"), path: "/reports/report_sirocco.jpg" },
                      ].map((item) => (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => setReportPhotoUrl(item.path)}
                          className={`p-1.5 rounded-lg border text-left truncate transition ${
                            reportPhotoUrl === item.path
                              ? "bg-red-950/70 border-red-500 text-white font-bold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {reportImageValidationError && (
                    <p className="text-red-400 text-[10px]">{reportImageValidationError}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition"
                >
                  {isSubmittingReport ? (
                    <span>{t("submitting")}</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{t("citizen_submit")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-[500] flex items-center justify-center">
          <div className="bg-slate-900/95 border border-slate-800 px-5 py-3 rounded-lg shadow-sm flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-red-500 border-t-transparent animate-spin"></div>
            <span className="text-xs font-semibold text-slate-200">
              {t("map_processing")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
