import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* IN9AD Editorial Design System */
        pine: {
          50: "#e8f5f0",
          100: "#c5e6d9",
          200: "#9ed4bf",
          300: "#74c1a4",
          400: "#4fad8b",
          500: "#2d9972",
          600: "#1d7d5c",
          700: "#0f6148",
          800: "#0A4D3C", /* PRIMARY — Dark Green */
          900: "#073a2d",
          950: "#042219",
        },
        cream: {
          DEFAULT: "#F5F1E8", /* BACKGROUND */
          50: "#FDFCF9",
          100: "#FAF8F3",
          200: "#F5F1E8",
          300: "#EDE7D8",
          400: "#E8DCC6", /* CARDS / PLACEHOLDERS (Warm Beige) */
        },
        ember: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#D26A3A", /* ACCENT / CTAs (Burnt Orange) */
          600: "#b8572c",
          700: "#9a4520",
          800: "#7c3518",
          900: "#5e2812",
        },
        forest: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        slatebg: {
          950: "#060911",
          900: "#0b0f19",
          850: "#111827",
          800: "#1e293b",
        },
        risk: {
          low: "#2E7D32",
          lowBg: "#e8f5e9",
          medium: "#F9A825",
          mediumBg: "#fff8e1",
          high: "#C62828",
          highBg: "#ffebee",
        },
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "Consolas", "monospace"],
        arabic: ["'Cairo'", "'Tajawal'", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        "card-lg": "20px",
        "card-xl": "24px",
      },
      maxWidth: {
        content: "1200px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
