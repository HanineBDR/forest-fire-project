"use client";

import React, { useEffect, useRef, useState } from "react";
import { PredictionResult, FIRMSHotspot, RegionPreset, WilayaBurnStat } from "@/types";
import { DEFAULT_WILAYA_STATS, submitCommunityReport } from "@/lib/api";
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
}) => {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const targetMarkerRef = useRef<any>(null);
  const simulationLayerGroupRef = useRef<any>(null);
  const firmsLayerGroupRef = useRef<any>(null);
  const regionsLayerGroupRef = useRef<any>(null);
  const algeriaBurnsLayerGroupRef = useRef<any>(null);
  const fineGrainSimGroupRef = useRef<any>(null);

  // View Scope & Layers
  const [viewScope, setViewScope] = useState<"northern" | "all_algeria">("northern");
  const [activeTileLayer, setActiveTileLayer] = useState<"satellite" | "dark" | "osm">("satellite");
  const [showFirms, setShowFirms] = useState<boolean>(true);
  const [showRegions, setShowRegions] = useState<boolean>(true);
  const [selectedWilaya, setSelectedWilaya] = useState<WilayaBurnStat | null>(null);

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
  const [reportPhotoSelected, setReportPhotoSelected] = useState<boolean>(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [reportSuccessToast, setReportSuccessToast] = useState<string | null>(null);

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

      simulationLayerGroupRef.current = simGroup;
      firmsLayerGroupRef.current = firmsGroup;
      regionsLayerGroupRef.current = regGroup;
      algeriaBurnsLayerGroupRef.current = macroGroup;
      fineGrainSimGroupRef.current = fineGroup;

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
        `<b>Front d'incendie simulé : ${activeStep.hour_label}</b><br/>Surface détruite : <b>${activeStep.burned_area_hectares} ha</b>`,
        { permanent: false, sticky: true, className: "bg-red-950 text-white text-xs border border-red-700 px-2 py-1 rounded" }
      );

      group.addLayer(activePoly);
    });
  }, [simulation6hData, currentSimStep]);

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

  // Handle Offline Map Download Simulation
  const handleDownloadOfflineZone = (zoneKey: string, zoneLabel: string, size: string) => {
    setDownloadingZone(zoneKey);
    setTimeout(() => {
      try {
        localStorage.setItem(`in9ad_offline_${zoneKey}`, "cached_true");
      } catch {}
      setDownloadingZone(null);
      setShowOfflineMenu(false);
      setOfflineToast(`Carte ${zoneLabel} téléchargée (${size}) - Utilisable sans internet.`);
      setTimeout(() => setOfflineToast(null), 5000);
    }, 1200);
  };

  // Handle Community Report Submit
  const handleSendCommunityReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNotes.trim()) return;

    setIsSubmittingReport(true);
    try {
      const lat = selectedLocation ? selectedLocation.lat : 36.735;
      const lon = selectedLocation ? selectedLocation.lon : 4.435;

      await submitCommunityReport({
        lat,
        lon,
        wilaya: reportWilaya,
        description: reportNotes,
        phone: reportPhone,
        photo_url: reportPhotoSelected ? "https://images.unsplash.com/photo-1542385151-efd9000785a0?w=600" : "",
      });

      setShowReportModal(false);
      setReportNotes("");
      setReportPhone("");
      setReportPhotoSelected(false);
      setReportSuccessToast("Signalement transmis avec succès au centre d'opérations de la Protection Civile.");
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

      {/* FEATURE 5: Canvas Wind Overlay */}
      {showWindAnimation && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-20 w-full h-full"
        />
      )}

      {/* Top Map Control Bar */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2">
        {/* View Scope Switcher */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 shadow flex items-center gap-1 text-xs">
          <button
            onClick={() => setViewScope("northern")}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
              viewScope === "northern" ? "bg-red-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Nord Algérie</span>
          </button>

          <button
            onClick={() => setViewScope("all_algeria")}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
              viewScope === "all_algeria" ? "bg-red-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Vue Nationale</span>
          </button>
        </div>

        {/* FEATURE 5: Animated Wind Particle Toggle */}
        <button
          onClick={() => setShowWindAnimation(!showWindAnimation)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold backdrop-blur-md transition flex items-center gap-1.5 ${
            showWindAnimation
              ? "bg-cyan-950/90 border-cyan-700/80 text-cyan-300"
              : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
          title="Afficher/masquer les particules de vent Open-Meteo"
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Vent Animé : {showWindAnimation ? "ON" : "OFF"}</span>
        </button>

        {/* FEATURE 8: Offline Map Download Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOfflineMenu(!showOfflineMenu)}
            className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Carte Hors-Ligne</span>
          </button>

          {showOfflineMenu && (
            <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-2 z-50 space-y-1.5 text-xs">
              <div className="font-bold text-slate-200 px-2 py-1 border-b border-slate-800 flex justify-between items-center">
                <span>Zones pour intervention hors-ligne</span>
                <button onClick={() => setShowOfflineMenu(false)} className="text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => handleDownloadOfflineZone("yakouren", "Yakouren", "45 Mo")}
                disabled={downloadingZone !== null}
                className="w-full text-left p-2 rounded hover:bg-slate-800 transition text-slate-300 hover:text-white flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-white">Zone Yakouren (Tizi Ouzou)</div>
                  <div className="text-[10px] text-slate-400">Forêt domaniale & col d&apos;Ighil Bouchene</div>
                </div>
                <span className="font-mono text-emerald-400 text-[10px]">~45 Mo</span>
              </button>

              <button
                onClick={() => handleDownloadOfflineZone("akfadou", "Akfadou", "58 Mo")}
                disabled={downloadingZone !== null}
                className="w-full text-left p-2 rounded hover:bg-slate-800 transition text-slate-300 hover:text-white flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-white">Zone Akfadou (Bejaia)</div>
                  <div className="text-[10px] text-slate-400">Crête forestière & réserve intégrale</div>
                </div>
                <span className="font-mono text-emerald-400 text-[10px]">~58 Mo</span>
              </button>

              <button
                onClick={() => handleDownloadOfflineZone("kabylie", "Grande Kabylie", "125 Mo")}
                disabled={downloadingZone !== null}
                className="w-full text-left p-2 rounded hover:bg-slate-800 transition text-slate-300 hover:text-white flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-white">Tout le corridor Kabylie</div>
                  <div className="text-[10px] text-slate-400">Tizi Ouzou + Bejaia + Bouira</div>
                </div>
                <span className="font-mono text-emerald-400 text-[10px]">~125 Mo</span>
              </button>

              {downloadingZone && (
                <div className="p-2 text-center text-emerald-400 font-semibold flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>Téléchargement et mise en cache...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FEATURE 7: Citizen Reporting Floating Action Button */}
      <div className="absolute bottom-4 right-4 z-[400]">
        <button
          onClick={() => setShowReportModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full shadow-lg shadow-red-950/80 flex items-center gap-2 transition transform hover:scale-105 active:scale-95"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <Smartphone className="w-4 h-4" />
          <span>Signalement Citoyen</span>
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
                  Wilaya concernée
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
                  Coordonnées GPS (automatiques)
                </label>
                <input
                  type="text"
                  disabled
                  value={
                    selectedLocation
                      ? `${selectedLocation.lat.toFixed(4)}° N, ${selectedLocation.lon.toFixed(4)}° E`
                      : "36.7350° N, 4.4350° E (Centre carte)"
                  }
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg p-2 text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Téléphone du déclarant (facultatif)
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
                  Description de la fumée / flammes observées *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex : Épaisse fumée blanche au-dessus des crêtes de Yakouren, vent fort vers le nord."
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Photo témoin (Simulation upload)
                </label>
                <button
                  type="button"
                  onClick={() => setReportPhotoSelected(!reportPhotoSelected)}
                  className={`w-full p-2.5 rounded-lg border border-dashed flex items-center justify-center gap-2 transition ${
                    reportPhotoSelected
                      ? "bg-emerald-950/40 border-emerald-600 text-emerald-300"
                      : "bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {reportPhotoSelected
                      ? "Photo attachée : fumee_yakouren_01.jpg"
                      : "Cliquer pour joindre une photo (Mock)"}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition"
                >
                  {isSubmittingReport ? (
                    <span>Envoi...</span>
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
              Traitement satellitaire et simulation IA...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
