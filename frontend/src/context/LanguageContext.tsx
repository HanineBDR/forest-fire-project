"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fr } from "@/locales/fr";
import { en } from "@/locales/en";
import { ar } from "@/locales/ar";

export type Language = "fr" | "en" | "ar";

type TranslationKey = keyof typeof fr;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  fr,
  en,
  ar,
};

const LanguageContext = createContext<LanguageContextType>({
  language: "fr",
  setLanguage: () => {},
  t: (key) => key,
  isRTL: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("fr");

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("in9ad_lang") as Language;
      if (savedLang && (savedLang === "fr" || savedLang === "en" || savedLang === "ar")) {
        setLanguageState(savedLang);
        applyDocumentDirection(savedLang);
      } else {
        applyDocumentDirection("fr");
      }
    } catch {
      applyDocumentDirection("fr");
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
      localStorage.setItem("in9ad_lang", lang);
    } catch {
      // storage unavailable
    }
    applyDocumentDirection(lang);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations.fr;
    let text = dict[key] || translations.fr[key] || key;

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
