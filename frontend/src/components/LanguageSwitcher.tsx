"use client";

import React from "react";
import { useLanguage, Language } from "@/context/LanguageContext";
import { Globe } from "lucide-react";

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const options: { code: Language; label: string; flag: string }[] = [
    { code: "ar", label: "عربية", flag: "🇩🇿" },
    { code: "fr", label: "FR", flag: "🇫🇷" },
    { code: "en", label: "EN", flag: "🇬🇧" },
  ];

  return (
    <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
      <div className="px-1.5 text-slate-500">
        <Globe className="w-3.5 h-3.5" />
      </div>
      {options.map((opt) => {
        const active = language === opt.code;
        return (
          <button
            key={opt.code}
            onClick={() => setLanguage(opt.code)}
            className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 transition ${
              active
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
            }`}
            title={`Switch to ${opt.label}`}
          >
            <span>{opt.flag}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
