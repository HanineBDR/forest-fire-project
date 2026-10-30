"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fr } from "@/locales/fr";
import { en } from "@/locales/en";
import { ar } from "@/locales/ar";

export type Language = "fr" | "en" | "ar";

export type TranslationKey = keyof typeof en | keyof typeof fr;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  fr,
  en,
  ar,
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
  isRTL: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("inkad_lang") as Language;
      if (savedLang && (savedLang === "fr" || savedLang === "en" || savedLang === "ar")) {
        setLanguageState(savedLang);
        applyDocumentDirection(savedLang);
      } else {
        setLanguageState("en");
        applyDocumentDirection("en");
      }
    } catch {
      setLanguageState("en");
      applyDocumentDirection("en");
    }
  }, []);

  const applyDocumentDirection = (lang: Language) => {
    if (typeof document !== "undefined") {
      const isRTL = lang === "ar";
      document.documentElement.dir = isRTL ? "rtl" : "ltr";
      document.documentElement.lang = lang;
      if (isRTL) {
        document.body.classList.add("font-arabic");
      } else {
        document.body.classList.remove("font-arabic");
      }
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("inkad_lang", lang);
    } catch {
      // storage unavailable
    }
    applyDocumentDirection(lang);
  };

  const t = (key: TranslationKey | string, params?: Record<string, string | number>): string => {
    if (!key) return "";
    const cleanKey = String(key).trim();
    const dict = translations[language] || translations.en;
    
    // 1. Direct dictionary match
    let text = dict[cleanKey] || translations.en[cleanKey as keyof typeof en] || translations.fr[cleanKey as keyof typeof fr];

    // 2. Fallback: try prefix variations if not found directly
    if (!text) {
      const candidates = [
        cleanKey.replace(/^(tutorial_|tut_|guide_|help_center_)/, ""),
        `tutorial_${cleanKey}`,
        `tut_${cleanKey}`,
        `help_center_${cleanKey}`,
        cleanKey.replace(/^guide\./, ""),
        cleanKey.replace(/\./g, "_"),
      ];
      for (const cand of candidates) {
        if (dict[cand]) {
          text = dict[cand];
          break;
        }
        if (translations.en[cand as keyof typeof en]) {
          text = translations.en[cand as keyof typeof en];
          break;
        }
        if (translations.fr[cand as keyof typeof fr]) {
          text = translations.fr[cand as keyof typeof fr];
          break;
        }
      }
    }

    // 3. Fallback: format key cleanly instead of leaking raw snake_case identifier into UI
    if (!text) {
      text = cleanKey
        .replace(/^(tutorial_|tut_|guide_|help_center_)/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
      });
    }

    return text;
  };

  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
