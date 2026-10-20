"use client";

import React, { useEffect, useRef, useState } from "react";
import { PredictionResult, FIRMSHotspot, RegionPreset, WilayaBurnStat } from "@/types";
import { DEFAULT_WILAYA_STATS } from "@/lib/api";
import {
  Layers,
  Flame,
  Satellite,
  Eye,
  EyeOff,
  Navigation2,
  Globe2,
  MapPin,
  ShieldAlert,
  ChevronRight,
  X,
} from "lucide-react";

interface MapProps {
  prediction: PredictionResult | null;
  activeHorizonIndex: number;
  firmsHotspots: FIRMSHotspot[];
  regions: RegionPreset[];
  selectedLocation: { lat: number; lon: number } | null;
  onMapClick: (coords: { lat: number; lon: number }) => void;
  isLoading: boolean;
}

// Simulated national burn spots across Algeria (2023-2024 historical reference)
const ALGERIA_MACRO_BURNS = [
  // High density Kabylie cluster
  { lat: 36.72, lon: 4.15, wilaya: "Tizi Ouzou", k: 358, frp: 52 },
  { lat: 36.68, lon: 4.38, wilaya: "Tizi Ouzou", k: 365, frp: 74 },
  { lat: 36.75, lon: 4.45, wilaya: "Tizi Ouzou", k: 372, frp: 81 },
  { lat: 36.63, lon: 4.52, wilaya: "Bejaia", k: 360, frp: 68 },
  { lat: 36.76, lon: 5.08, wilaya: "Bejaia", k: 349, frp: 45 },
  { lat: 36.71, lon: 5.22, wilaya: "Bejaia", k: 364, frp: 62 },
  { lat: 36.42, lon: 3.92, wilaya: "Bouira", k: 352, frp: 49 },
  { lat: 36.48, lon: 4.12, wilaya: "Bouira", k: 368, frp: 78 },
  { lat: 36.81, lon: 5.75, wilaya: "Jijel", k: 355, frp: 54 },
  { lat: 36.69, lon: 5.88, wilaya: "Jijel", k: 361, frp: 66 },
  { lat: 36.12, lon: 4.78, wilaya: "Bordj Bou Arreridj", k: 342, frp: 38 },
  { lat: 36.22, lon: 5.39, wilaya: "Setif", k: 338, frp: 32 },
  { lat: 36.52, lon: 5.48, wilaya: "Setif", k: 345, frp: 41 },
  { lat: 36.75, lon: 8.28, wilaya: "El Tarf", k: 350, frp: 44 },
  { lat: 36.44, lon: 7.41, wilaya: "Guelma", k: 341, frp: 36 },
  // Southern / Steppe anomalies
  { lat: 34.85, lon: 5.72, wilaya: "Biskra Steppe", k: 322, frp: 18 },
  { lat: 33.25, lon: 1.15, wilaya: "El Bayadh", k: 318, frp: 15 },
  { lat: 31.95, lon: 5.32, wilaya: "Ouargla Anomaly", k: 326, frp: 22 },
  { lat: 29.25, lon: 2.50, wilaya: "In Salah Flare", k: 335, frp: 25 },
];

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
  const algeriaBurnsLayerGroupRef = useRef<any>(null);

  // View Scope Toggle: "Northern Algeria Risk" vs "View All Algeria Burns"
  const [viewScope, setViewScope] = useState<"northern" | "all_algeria">("northern");
  const [activeTileLayer, setActiveTileLayer] = useState<"satellite" | "dark" | "osm">("satellite");
  const [showFirms, setShowFirms] = useState<boolean>(true);
  const [showSimulations, setShowSimulations] = useState<boolean>(true);
  const [showRegions, setShowRegions] = useState<boolean>(true);
  const [selectedWilaya, setSelectedWilaya] = useState<WilayaBurnStat | null>(null);

  const tileLayersRef = useRef<{ [key: string]: any }>({});

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
        {
          attribution: "Esri World Imagery",
          maxZoom: 18,
        }
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

      simulationLayerGroupRef.current = simGroup;
      firmsLayerGroupRef.current = firmsGroup;
      regionsLayerGroupRef.current = regGroup;
      algeriaBurnsLayerGroupRef.current = macroGroup;

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

  // Handle View Scope Toggle (Northern Algeria Risk vs View All Algeria Burns)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (viewScope === "all_algeria") {
      map.flyTo([34.0, 3.5], 6, { duration: 1.2 });
    } else {
      map.flyTo([36.65, 4.50], 9, { duration: 1.0 });
    }
  }, [viewScope]);

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

      marker.bindPopup(`
        <div class="text-xs p-1">
          <div class="font-bold text-red-400 mb-0.5">Ignition Point</div>
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
            <div class="text-slate-300">Thermal Brightness: <span class="font-semibold text-red-400 font-mono tabular-nums">${spot.brightness_kelvin} K</span></div>
            <div class="text-slate-300">Confidence: <span class="font-semibold text-amber-300">${spot.confidence}</span></div>
            <div class="text-[10px] text-slate-400">FRP: ${spot.frp_mw} MW | ${spot.acq_date} ${spot.acq_time}</div>
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

  // Render Fire Spread Simulation Polygons
  useEffect(() => {
    if (!mapInstanceRef.current || !simulationLayerGroupRef.current) return;
    const group = simulationLayerGroupRef.current;
    group.clearLayers();

    if (!showSimulations || !prediction || !prediction.simulation || viewScope === "all_algeria") return;

    const sim = prediction.simulation;
    const steps = sim.timesteps;
    if (!steps || steps.length === 0) return;

    import("leaflet").then((L) => {
      const colors = [
        { stroke: "#facc15", fill: "#facc15", opacity: 0.45 },
        { stroke: "#fb923c", fill: "#fb923c", opacity: 0.5 },
        { stroke: "#f87171", fill: "#f87171", opacity: 0.55 },
        { stroke: "#ef4444", fill: "#dc2626", opacity: 0.65 },
      ];

      steps.forEach((step, idx) => {
        const color = colors[idx % colors.length];
        const isActive = idx === activeHorizonIndex;

        const polygon = L.polygon(step.polygon, {
          color: color.stroke,
          weight: isActive ? 2.5 : 1.2,
          opacity: isActive ? 0.95 : 0.45,
          fillColor: color.fill,
          fillOpacity: isActive ? color.opacity : color.opacity * 0.4,
          dashArray: isActive ? undefined : "4, 4",
        });

        polygon.bindTooltip(
          `Horizon +${step.hours}h: ${step.burned_area_hectares} ha (${step.rate_of_spread_m_h} m/h)`,
          { sticky: true, className: "bg-slate-900 text-slate-100 text-xs px-2 py-1 rounded" }
        );

        group.addLayer(polygon);
      });
    });
  }, [prediction, activeHorizonIndex, showSimulations, viewScope]);

  // Render All Algeria Macro Burn Detections & Wilaya Centroids
  useEffect(() => {
    if (!mapInstanceRef.current || !algeriaBurnsLayerGroupRef.current) return;
    const group = algeriaBurnsLayerGroupRef.current;
    group.clearLayers();

    if (viewScope !== "all_algeria") return;

    import("leaflet").then((L) => {
      // 1. Highlight Northern Algeria priority corridor bounding box
      const bbox = L.rectangle(
        [
          [35.5, 3.0],
          [37.5, 6.5],
        ],
        {
          color: "#ef4444",
          weight: 2,
          fill: true,
          fillColor: "#dc2626",
          fillOpacity: 0.08,
          dashArray: "6, 6",
        }
      );
      bbox.bindTooltip("Northern Algeria High Density Wildfire Zone (Kabylie & Babors)", {
        direction: "top",
        className: "bg-slate-900 text-red-300 text-xs font-semibold px-2 py-1 rounded",
      });
      group.addLayer(bbox);

      // 2. Macro burn detections across Algeria
      ALGERIA_MACRO_BURNS.forEach((spot) => {
        const dot = L.circleMarker([spot.lat, spot.lon], {
          radius: 5,
          color: "#ef4444",
          fillColor: "#dc2626",
          fillOpacity: 0.8,
          weight: 1,
        });

        dot.bindPopup(`
          <div class="text-xs p-1">
            <div class="font-bold text-red-400">Burn Hotspot: ${spot.wilaya}</div>
            <div class="font-mono text-slate-300">Lat: ${spot.lat.toFixed(2)}, Lon: ${spot.lon.toFixed(2)}</div>
            <div class="text-slate-200">Brightness: <span class="font-mono font-bold">${spot.k} K</span></div>
            <div class="text-slate-200">FRP: <span class="font-mono font-bold">${spot.frp} MW</span></div>
          </div>
        `);
        group.addLayer(dot);
      });

      // 3. Wilaya centroid markers with detailed statistics
      DEFAULT_WILAYA_STATS.forEach((w) => {
        const center = getWilayaCenter(w.wilaya_code);
        const marker = L.circleMarker([center.lat, center.lon], {
          radius: 10,
          color: "#fb923c",
          fillColor: "#ea580c",
          fillOpacity: 0.9,
          weight: 2,
        });

        marker.bindPopup(`
          <div class="text-xs p-1 space-y-1">
            <div class="font-bold text-white text-sm">${w.wilaya_name} (${w.wilaya_code})</div>
            <div class="text-slate-300">${w.region}</div>
            <div class="py-1 border-t border-b border-slate-700/80 my-1 font-mono">
              <div>Total Burn Points: <span class="font-bold text-ember-400">${w.total_burned_points} pts</span></div>
              <div>Estimated Area: <span class="font-bold text-white">${w.estimated_burned_area_ha.toLocaleString()} ha</span></div>
            </div>
            <div class="text-slate-300">Canopy: <span class="text-slate-100">${w.top_vegetation_type}</span></div>
          </div>
        `);

        marker.on("click", () => {
          setSelectedWilaya(w);
        });

        group.addLayer(marker);
      });
    });
  }, [viewScope]);

  const handleSelectWilayaFromCard = (w: WilayaBurnStat) => {
    setSelectedWilaya(w);
    const center = getWilayaCenter(w.wilaya_code);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([center.lat, center.lon], 9, { duration: 0.8 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden border border-slate-800">
      {/* Leaflet DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Primary Scope Toggle: Northern Algeria Risk vs View All Algeria Burns */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
        <div
          className="bg-slatebg-900/95 backdrop-blur-md border border-slate-700/90 rounded-lg p-1 shadow flex items-center gap-1 text-xs"
          role="group"
          aria-label="Map view mode"
        >
          <button
            onClick={() => {
              setViewScope("northern");
              setSelectedWilaya(null);
            }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              viewScope === "northern"
                ? "bg-ember-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Northern Algeria Risk</span>
          </button>

          <button
            onClick={() => setViewScope("all_algeria")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              viewScope === "all_algeria"
                ? "bg-ember-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>View All Algeria Burns</span>
          </button>
        </div>

        {/* Basemap Switcher */}
        <div
          className="bg-slatebg-900/90 backdrop-blur-md border border-slate-800/80 rounded-lg p-1.5 shadow-sm flex items-center gap-1 text-xs w-fit"
          role="group"
          aria-label="Map style switcher"
        >
          <button
            onClick={() => setActiveTileLayer("satellite")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTileLayer === "satellite" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setActiveTileLayer("dark")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTileLayer === "dark" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setActiveTileLayer("osm")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTileLayer === "osm" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Street
          </button>
        </div>
      </div>

      {/* Floating Wilaya Burn Statistics Card when in "View All Algeria Burns" mode */}
      {viewScope === "all_algeria" && (
        <div className="absolute top-4 right-4 z-[400] w-80 max-h-[calc(100%-2rem)] flex flex-col bg-slatebg-900/95 backdrop-blur-md border border-slate-800 rounded-lg p-3 shadow-lg text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <div className="text-[11px] text-ember-400 font-semibold uppercase tracking-wider">
                NASA FIRMS 2023-2024
              </div>
              <h3 className="text-sm font-bold text-white">Algeria Wilaya Burn Stats</h3>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-mono">
              88% Northern
            </span>
          </div>

          <div className="mt-2 text-slate-400 text-[11px] leading-tight">
            Click any wilaya to inspect historical burn density and canopy impact:
          </div>

          <div className="mt-2 space-y-1.5 overflow-y-auto max-h-[320px] pr-1">
            {DEFAULT_WILAYA_STATS.map((w) => {
              const isSelected = selectedWilaya?.wilaya_code === w.wilaya_code;
              return (
                <div
                  key={w.wilaya_code}
                  onClick={() => handleSelectWilayaFromCard(w)}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-slate-800 border-ember-500 text-white"
                      : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-ember-400" />
                      <span>{w.wilaya_name}</span>
                      <span className="text-slate-400 font-mono text-[10px]">({w.wilaya_code})</span>
                    </span>
                    <span className="font-mono text-ember-400">{w.total_burned_points} pts</span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{Math.round(w.estimated_burned_area_ha).toLocaleString()} ha</span>
                    <span className="text-red-300 text-[10px]">{w.risk_category}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedWilaya && (
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800">
              <div className="flex items-center justify-between text-slate-300 mb-1">
                <span className="font-semibold text-white">{selectedWilaya.wilaya_name} Details:</span>
                <button onClick={() => setSelectedWilaya(null)} className="text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="text-slate-400">
                Vegetation: <span className="text-slate-200">{selectedWilaya.top_vegetation_type}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Instructions Banner (when in Northern Algeria Risk mode) */}
      {viewScope === "northern" && (
        <div className="absolute bottom-4 left-4 z-[400] hidden sm:flex items-center gap-2 bg-slatebg-900/90 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-lg shadow-sm text-[11px] text-slate-300">
          <Navigation2 className="w-3.5 h-3.5 text-ember-400" aria-hidden="true" />
          <span>Click any forest coordinate in Northern Algeria to run XGBoost risk prediction and 6h spread</span>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slatebg-950/40 backdrop-blur-sm z-[500] flex items-center justify-center">
          <div className="bg-slatebg-900/95 border border-slate-800 px-5 py-3 rounded-lg shadow-sm flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-ember-500 border-t-transparent animate-spin"></div>
            <span className="text-xs font-semibold text-slate-200">Processing satellite and wind data</span>
          </div>
        </div>
      )}
    </div>
  );
};

function getWilayaCenter(code: number): { lat: number; lon: number } {
  switch (code) {
    case 15:
      return { lat: 36.7169, lon: 4.0497 }; // Tizi Ouzou
    case 6:
      return { lat: 36.7511, lon: 5.0567 }; // Bejaia
    case 10:
      return { lat: 36.3749, lon: 3.9020 }; // Bouira
    case 18:
      return { lat: 36.8206, lon: 5.7667 }; // Jijel
    case 34:
      return { lat: 36.0732, lon: 4.7611 }; // Bordj Bou Arreridj
    case 19:
      return { lat: 36.1911, lon: 5.4137 }; // Setif
    default:
      return { lat: 36.65, lon: 4.5 };
  }
}
