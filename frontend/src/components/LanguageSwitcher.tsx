"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage, Language } from "@/context/LanguageContext";
import { Globe, Check, ChevronDown } from "lucide-react";

interface LanguageOption {
  code: Language;
  shortLabel: string;
  fullLabel: string;
  flag: string;
}

const OPTIONS: LanguageOption[] = [
  { code: "fr", shortLabel: "FR", fullLabel: "Français", flag: "🇫🇷" },
  { code: "ar", shortLabel: "عربية", fullLabel: "العربية (DZ)", flag: "🇩🇿" },
  { code: "en", shortLabel: "EN", fullLabel: "English", flag: "🇬🇧" },
];

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption = OPTIONS.find((o) => o.code === language) || OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} data-tour="lang-switcher" className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Changer de langue, langue actuelle : ${activeOption.fullLabel}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
        <span aria-hidden="true">{activeOption.flag}</span>
        <span className="font-semibold">{activeOption.shortLabel}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Sélectionner une langue"
          className="absolute right-0 mt-1.5 w-36 rounded-lg bg-slate-900 border border-slate-700 py-1 shadow-xl z-50 focus:outline-none text-xs"
        >
          {OPTIONS.map((opt) => {
            const isSelected = language === opt.code;
            return (
              <button
                type="button"
                key={opt.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(opt.code);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors duration-150 hover:bg-slate-800 ${
                  isSelected ? "text-red-400 font-semibold bg-slate-800/60" : "text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">{opt.flag}</span>
                  <span>{opt.fullLabel}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
