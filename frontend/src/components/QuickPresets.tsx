"use client";

import React from "react";
import { RegionPreset } from "@/types";
import { MapPin, Info } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface QuickPresetsProps {
  regions: RegionPreset[];
  selectedRegionId?: string;
  onSelectRegion: (region: RegionPreset) => void;
  isLoading?: boolean;
}

/**
 * Format massif name for optimal tactical readability:
 * Keeps the recognizable massif/forest name rather than generic prefixes.
 */
function getDisplayMassifName(fullName: string, lang: string): string {
  if (lang === "ar") {
    if (fullName.includes("Yakouren")) return "يعكورن";
    if (fullName.includes("Akfadou")) return "أكفادو";
    if (fullName.includes("Djurdjura") || fullName.includes("Tikjda")) return "تيكجدة (جرجرة)";
    if (fullName.includes("Gouraya")) return "قورايا";
    if (fullName.includes("Mizrana")) return "مزرانة";
    if (fullName.includes("Babor")) return "البابور - طابابور";
    if (fullName.includes("Chréa")) return "الشريعة";
    if (fullName.includes("Beni Toufout")) return "بني توفوت";
    if (fullName.includes("Zarifet")) return "الظريفات";
    if (fullName.includes("Sidi Amar")) return "سيدي عمار";
    if (fullName.includes("Taza") || fullName.includes("Guerrouche")) return "قروش وتازة";
    if (fullName.includes("Chélia")) return "جبل شيلية";
    if (fullName.includes("El Kala")) return "القالة";
    if (fullName.includes("Zaccar")) return "جبل زكار";
    if (fullName.includes("Theniet El Had")) return "ثنية الحد";
  }

  // English & Latin: Ensure clean concise names without truncation
  if (fullName.includes("Mont Zaccar") || fullName.includes("Zaccar")) return "Mt. Zaccar";
  if (fullName.includes("Zarifet")) return "Zarifet Forest";
  if (fullName.includes("Chélia")) return "Mt. Chélia";
  if (fullName.includes("Sidi Amar")) return "Sidi Amar";
  if (fullName.includes("Taza") || fullName.includes("Guerrouche")) return "Guerrouche & Taza";
  if (fullName.includes("Beni Toufout")) return "Beni Toufout";
  if (fullName.includes("Akfadou")) return "Akfadou Forest";
  if (fullName.includes("Yakouren")) return "Yakouren";
  if (fullName.includes("Djurdjura") || fullName.includes("Tikjda")) return "Tikjda (Djurdjura)";
  if (fullName.includes("Mizrana")) return "Mizrana";
  if (fullName.includes("Babor")) return "Babor-Tababor";
  if (fullName.includes("El Kala")) return "El Kala";
  if (fullName.includes("Chréa")) return "Chréa";
  if (fullName.includes("Theniet El Had")) return "Theniet El Had";

  let cleaned = fullName
    .replace(/^Forêt\s+(des\s+Cèdres\s+du|Domaniale\s+des|de|des|du)\s+/i, "")
    .replace(/^Massif\s+(des\s+Babors\s+-\s+|de|des|du)\s+/i, "")
    .replace(/^Parc\s+National\s+(de|des|du)\s+/i, "")
    .replace(/^Mont\s+/i, "Mt. ")
    .replace(/\s+Forest$/i, "")
    .replace(/\s+Massif$/i, "")
    .replace(/\s+National Park$/i, "")
    .replace(/\s+Biosphere$/i, "");

  return cleaned.trim() || fullName;
}

export const QuickPresets: React.FC<QuickPresetsProps> = ({
  regions,
  selectedRegionId,
  onSelectRegion,
  isLoading,
}) => {
  const { t, language } = useLanguage();

  return (
    <section 
      aria-label="Sélection rapide des massifs forestiers stratégiques"
      className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-sm"
    >
      {/* Header with Nielsen #6 Recognition Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 animate-pulse" aria-hidden="true" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-100 tracking-wide uppercase">
            {t("strategic_massifs_title")}
          </h2>
        </div>

        {/* Visual Legend for Wilaya numbers */}
        <div className="flex items-center gap-2 text-xs">
          <div 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700/80 text-slate-300"
            title="Le numéro indiqué en haut à droite de chaque carte correspond au matricule officiel de la Wilaya (ex: 15 = Tizi Ouzou, 06 = Béjaïa, 09 = Blida, 36 = El Tarf)"
          >
            <Info className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
            <span className="text-slate-400">{t("legend_title")}</span>
            <span className="font-mono text-white font-semibold">[W. N°]</span>
            <span className="text-slate-400 font-normal">{t("legend_wilaya_code")}</span>
          </div>

          <span className="text-[11px] text-slate-400 hidden md:inline font-medium">
            {t("click_to_inspect")}
          </span>
        </div>
      </div>

      {/* Grid of Massif Cards with generous padding and clear hierarchy */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 xl:grid-cols-7 gap-2.5">
        {regions.map((reg) => {
          const isSelected = selectedRegionId === reg.id;
          const displayName = getDisplayMassifName(reg.name, language);
          const wilayaCode = reg.wilaya.match(/\((.*?)\)/)?.[1] || reg.wilaya.split(" ")[0];

          return (
            <button
              key={reg.id}
              type="button"
              disabled={isLoading}
              onClick={() => onSelectRegion(reg)}
              aria-pressed={isSelected}
              title={`${reg.name} — Wilaya de rattachement: ${reg.wilaya} (Coordonnées: ${reg.lat.toFixed(4)}°N, ${reg.lon.toFixed(4)}°E)`}
              className={`group flex flex-col justify-between text-left p-3.5 rounded-xl border text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[78px] ${
                isSelected
                  ? "bg-red-950/90 border-red-500 text-white font-semibold ring-1 ring-red-500/60 shadow-sm"
                  : "bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-200 hover:text-white hover:border-slate-600"
              }`}
            >
              <div className="flex items-start justify-between w-full gap-1 mb-1.5">
                <div className="flex items-center gap-1.5 truncate">
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" aria-hidden="true" />
                  )}
                  <span className="font-bold text-xs truncate leading-tight" title={reg.name}>
                    {displayName}
                  </span>
                </div>
                
                {/* Wilaya badge with explicit W. prefix */}
                <span 
                  title={`Wilaya: ${reg.wilaya}`}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 tabular-nums ${
                    isSelected
                      ? "bg-red-900 text-red-100 border border-red-600"
                      : "bg-slate-900/90 text-slate-300 border border-slate-700/80 group-hover:border-slate-500"
                  }`}
                >
                  W.{wilayaCode}
                </span>
              </div>

              {/* Coordinates line */}
              <div className={`flex items-center gap-1 text-[11px] font-mono tabular-nums ${
                isSelected ? "text-red-200/90" : "text-slate-400 group-hover:text-slate-300"
              }`}>
                <MapPin className={`w-3 h-3 shrink-0 ${isSelected ? "text-red-400" : "text-slate-500"}`} aria-hidden="true" />
                <span>{reg.lat.toFixed(2)}°, {reg.lon.toFixed(2)}°</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
