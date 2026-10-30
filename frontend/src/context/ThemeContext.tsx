"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: true,
});

export const THEME_STORAGE_KEY = "inkad_theme";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Emergency platform default is ALWAYS "dark"
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Synchronize CSS classes and color-scheme on <html>
  const applyThemeToDOM = useCallback((newTheme: Theme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (newTheme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    }
    // Dispatch custom event for external components (like Leaflet map or charts)
    window.dispatchEvent(
      new CustomEvent("inkad_theme_changed", {
        detail: { theme: newTheme, isDark: newTheme === "dark" },
      })
    );
  }, []);

  // Initialize on client mount from localStorage (defaulting to "dark")
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      const initialTheme: Theme = stored === "light" ? "light" : "dark";
      setThemeState(initialTheme);
      applyThemeToDOM(initialTheme);
    } catch {
      applyThemeToDOM("dark");
    }
  }, [applyThemeToDOM]);

  // Set specific theme
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (err) {
        console.warn("Could not save theme to localStorage:", err);
      }
      applyThemeToDOM(newTheme);
    },
    [applyThemeToDOM]
  );

  // Toggle between dark and light
  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isDark: theme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

