"use client";

import React, { useEffect, useRef, useState } from "react";
import { PredictionResult, FIRMSHotspot, RegionPreset, SimulationStep } from "@/types";
import { Layers, Flame, Satellite, Eye, EyeOff, Navigation2, Compass } from "lucide-react";

interface MapProps {
  prediction: PredictionResult | null;
  activeHorizonIndex: number;
  firmsHotspots: FIRMSHotspot[];
  regions: RegionPreset[];
  selectedLocation: { lat: number; lon: number } | null;
  onMapClick: (coords: { lat: number; lon: number }) => void;
  isLoading: boolean;
}

export const Map: React.FC<MapProps> = ({
  prediction,
  activeHorizonIndex,
  firmsHotspots,
  regions,
  selectedLocation,
  onMapClick,
  isLoading,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const targetMarkerRef = useRef<any>(null);
  const simulationLayerGroupRef = useRef<any>(null);
  const firmsLayerGroupRef = useRef<any>(null);
  const regionsLayerGroupRef = useRef<any>(null);

  const [activeTileLayer, setActiveTileLayer] = useState<"satellite" | "dark" | "osm">("satellite");
  const [showFirms, setShowFirms] = useState<boolean>(true);
  const [showSimulations, setShowSimulations] = useState<boolean>(true);
  const [showRegions, setShowRegions] = useState<boolean>(true);

  const tileLayersRef = useRef<{ [key: string]: any }>({});

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");

      // Default center: Between Tizi Ouzou (36.71, 4.04), Bejaia (36.75, 5.05), and Bouira (36.37, 3.90)
      const map = L.map(mapContainerRef.current, {
        center: [36.65, 4.50],
        zoom: 9,
        minZoom: 7,
        maxZoom: 18,
        zoomControl: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      // Define Base Tile Layers
      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Esri World Imagery",
          maxZoom: 18,
        }
      );

      const dark = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; CartoDB",
          maxZoom: 19,
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

      simulationLayerGroupRef.current = simGroup;
      firmsLayerGroupRef.current = firmsGroup;
      regionsLayerGroupRef.current = regGroup;

      // Click listener
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

  // Handle Target Click Marker
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;
    const map = mapInstanceRef.current;

    import("leaflet").then((L) => {
      if (targetMarkerRef.current) {
        map.removeLayer(targetMarkerRef.current);
      }

      const pulseIcon = L.divIcon({
        className: "pulse-fire-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([selectedLocation.lat, selectedLocation.lon], {
        icon: pulseIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.bindPopup(`
        <div class="text-xs p-1">
          <div class="font-bold text-red-400 mb-0.5">🎯 Ignition Origin / Target</div>
          <div class="font-mono text-slate-300">${selectedLocation.lat.toFixed(4)}°N, ${selectedLocation.lon.toFixed(4)}°E</div>
          ${prediction ? `<div class="mt-1 font-bold" style="color: ${prediction.theme_color}">Risk: ${prediction.risk_score}% (${prediction.risk_level})</div>` : ""}
        </div>
      `);

      targetMarkerRef.current = marker;
    });
  }, [selectedLocation, prediction]);

  // Render NASA FIRMS Hotspots
  useEffect(() => {
    if (!mapInstanceRef.current || !firmsLayerGroupRef.current) return;
    const group = firmsLayerGroupRef.current;
    group.clearLayers();

    if (!showFirms) return;

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
            <div class="flex items-center gap-1 font-bold text-amber-400">
              <span>🔥 ${spot.location_name}</span>
            </div>
            <div class="font-mono text-slate-300">Lat: ${spot.latitude.toFixed(4)}, Lon: ${spot.longitude.toFixed(4)}</div>
            <div class="text-slate-300">Satellite: <span class="font-semibold text-slate-100">${spot.satellite}</span></div>
            <div class="text-slate-300">Thermal Brightness: <span class="font-semibold text-red-400 font-mono">${spot.brightness_kelvin} K</span></div>
            <div class="text-slate-300">Confidence: <span class="font-semibold text-amber-300 uppercase">${spot.confidence}</span></div>
            <div class="text-[10px] text-slate-400">FRP: ${spot.frp_mw} MW | ${spot.acq_date} ${spot.acq_time}</div>
          </div>
        `);
        group.addLayer(m);
      });
    });
  }, [firmsHotspots, showFirms]);

  // Render Strategic Forest Reserves
  useEffect(() => {
    if (!mapInstanceRef.current || !regionsLayerGroupRef.current) return;
    const group = regionsLayerGroupRef.current;
    group.clearLayers();

    if (!showRegions) return;

    import("leaflet").then((L) => {
      regions.forEach((reg) => {
        // Circle indicating forest zone perimeter
        const circle = L.circle([reg.lat, reg.lon], {
          radius: 4000,
          color: "#10b981",
          weight: 1.5,
          opacity: 0.8,
          fillColor: "#059669",
          fillOpacity: 0.12,
          dashArray: "4, 6",
        });

        circle.bindTooltip(`🌲 ${reg.name} (${reg.wilaya})`, {
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
  }, [regions, showRegions, onMapClick]);

  // Render Fire Spread Simulation Elliptical Polygons
  useEffect(() => {
    if (!mapInstanceRef.current || !simulationLayerGroupRef.current) return;
    const group = simulationLayerGroupRef.current;
    group.clearLayers();

    if (!showSimulations || !prediction || !prediction.simulation) return;

    const sim = prediction.simulation;
    const steps = sim.timesteps;
    if (!steps || steps.length === 0) return;

    import("leaflet").then((L) => {
      const colors = [
        { stroke: "#facc15", fill: "#facc15", opacity: 0.45 }, // 1h (Yellow)
        { stroke: "#fb923c", fill: "#f97316", opacity: 0.35 }, // 3h (Orange)
        { stroke: "#ef4444", fill: "#dc2626", opacity: 0.28 }, // 6h (Red)
        { stroke: "#7f1d1d", fill: "#991b1b", opacity: 0.22 }, // 12h (Dark Crimson)
      ];

      // Draw each step polygon up to active horizon
      steps.forEach((step: SimulationStep, idx: number) => {
        if (idx > activeHorizonIndex) return; // Only show up to current selected timestep
        const c = colors[idx] || colors[colors.length - 1];

        const polygon = L.polygon(step.polygon, {
          color: c.stroke,
          weight: idx === activeHorizonIndex ? 2.5 : 1.2,
          opacity: 0.9,
          fillColor: c.fill,
          fillOpacity: idx === activeHorizonIndex ? 0.5 : c.opacity,
          dashArray: idx === activeHorizonIndex ? undefined : "3, 5",
        });

        polygon.bindPopup(`
          <div class="text-xs p-1">
            <div class="font-bold text-red-400 mb-0.5">Fire Perimeter Horizon: +${step.hours}h</div>
            <div class="text-slate-300">Projected Burned Area: <span class="font-mono font-bold text-amber-300">${step.burned_area_hectares} ha</span></div>
            <div class="text-slate-300">Rate of Spread: <span class="font-mono font-bold text-slate-100">${step.rate_of_spread_m_h} m/h</span></div>
            <div class="text-slate-300">Head Distance: <span class="font-mono font-bold text-slate-100">${step.head_distance_meters} m</span></div>
          </div>
        `);

        group.addLayer(polygon);
      });

      // Draw wind vector arrow from ignition point
      if (sim.ignition_point) {
        const spreadRad = ((sim.spread_azimuth_deg) * Math.PI) / 180.0;
        const arrowLengthMeters = Math.min(6000, 1000 + sim.wind_speed_kmh * 80);
        const endLat = sim.ignition_point.lat + (arrowLengthMeters * Math.cos(spreadRad)) / 111139.0;
        const endLon =
          sim.ignition_point.lon +
          (arrowLengthMeters * Math.sin(spreadRad)) /
            (111139.0 * Math.cos((sim.ignition_point.lat * Math.PI) / 180.0));

        const windLine = L.polyline(
          [
            [sim.ignition_point.lat, sim.ignition_point.lon],
            [endLat, endLon],
          ],
          {
            color: "#38bdf8",
            weight: 2.5,
            opacity: 0.85,
            dashArray: "6, 6",
          }
        );

        windLine.bindTooltip(`💨 Wind Spread Vector: ${sim.spread_azimuth_deg}° (${sim.wind_speed_kmh} km/h)`, {
          sticky: true,
          className: "bg-slate-900 text-sky-300 text-xs font-mono px-2 py-0.5 rounded",
        });

        group.addLayer(windLine);
      }
    });
  }, [prediction, activeHorizonIndex, showSimulations]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Basemap & Layer Control Bar */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
        {/* Basemap Switcher */}
        <div className="bg-slatebg-900/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-1.5 shadow-xl flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTileLayer("satellite")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              activeTileLayer === "satellite"
                ? "bg-ember-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🛰️ Satellite
          </button>
          <button
            onClick={() => setActiveTileLayer("dark")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              activeTileLayer === "dark"
                ? "bg-ember-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🌑 Tactical Dark
          </button>
          <button
            onClick={() => setActiveTileLayer("osm")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              activeTileLayer === "osm"
                ? "bg-ember-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🗺️ Street
          </button>
        </div>

        {/* Feature Layer Toggles */}
        <div className="bg-slatebg-900/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-2 shadow-xl flex flex-col gap-1.5 text-xs">
          {/* FIRMS Hotspots */}
          <button
            onClick={() => setShowFirms(!showFirms)}
            className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg transition-colors ${
              showFirms ? "text-amber-400 font-semibold" : "text-slate-500"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Satellite className="w-3.5 h-3.5" />
              <span>NASA FIRMS Hotspots</span>
            </div>
            {showFirms ? <Eye className="w-3 h-3 text-amber-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
          </button>

          {/* Simulation Polygons */}
          <button
            onClick={() => setShowSimulations(!showSimulations)}
            className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg transition-colors ${
              showSimulations ? "text-red-400 font-semibold" : "text-slate-500"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Fire Spread Perimeters</span>
            </div>
            {showSimulations ? <Eye className="w-3 h-3 text-red-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
          </button>

          {/* Forest Reserves */}
          <button
            onClick={() => setShowRegions(!showRegions)}
            className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg transition-colors ${
              showRegions ? "text-emerald-400 font-semibold" : "text-slate-500"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Kabylie Forest Massifs</span>
            </div>
            {showRegions ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Floating Instructions Banner */}
      <div className="absolute bottom-4 left-4 z-[400] hidden sm:flex items-center gap-2 bg-slatebg-900/90 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-xl shadow-lg text-[11px] text-slate-300">
        <Navigation2 className="w-3.5 h-3.5 text-ember-400 animate-spin" />
        <span>Click any location in Northern Algeria to run AI risk prediction & Huygens spread simulation</span>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slatebg-950/40 backdrop-blur-sm z-[500] flex items-center justify-center">
          <div className="bg-slatebg-900/95 border border-slate-800 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-ember-500 border-t-transparent animate-spin"></div>
            <span className="text-xs font-semibold text-slate-200">Processing Satellite & Wind Propagation...</span>
          </div>
        </div>
      )}
    </div>
  );
};
