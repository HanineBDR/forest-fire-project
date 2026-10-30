"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Tooltip } from "@/components/Tooltip";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid layout shift before mount
  if (!mounted) {
    return (
      <div
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/90 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const tooltipText = isDark ? t("theme_switch_light") : t("theme_switch_dark");

  return (
    <Tooltip content={tooltipText} position="bottom">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={tooltipText}
        data-tour="theme-toggle"
        className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 overflow-hidden group select-none ${
          isDark
            ? "border-slate-800 bg-slate-900/90 text-amber-400 hover:text-amber-300 hover:border-amber-500/60 hover:bg-slate-800 shadow-inner"
            : "border-slate-200 bg-white text-amber-600 hover:text-amber-700 hover:border-amber-400 hover:bg-amber-50/60 shadow-sm"
        } ${className}`}
      >
        <span className="sr-only">{tooltipText}</span>

        {/* Sun Icon (shown in Dark Mode, animated to indicate switching to Daylight Mode) */}
        <div
          className={`transition-all duration-300 ease-out flex items-center justify-center ${
            isDark
              ? "rotate-0 scale-100 opacity-100 group-hover:rotate-45"
              : "-rotate-90 scale-0 opacity-0 absolute pointer-events-none"
          }`}
        >
          <Sun className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
        </div>

        {/* Moon Icon (shown in Light Mode, animated to indicate switching to Night/Dark Mode) */}
        <div
          className={`transition-all duration-300 ease-out flex items-center justify-center ${
            !isDark
              ? "rotate-0 scale-100 opacity-100 group-hover:-rotate-12"
              : "rotate-90 scale-0 opacity-0 absolute pointer-events-none"
          }`}
        >
          <Moon className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
        </div>
      </button>
    </Tooltip>
  );
};

