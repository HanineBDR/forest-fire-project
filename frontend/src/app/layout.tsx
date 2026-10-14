import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "IN9AD (إنقاذ) | AI Wildfire Risk & Propagation Simulator - Northern Algeria",
  description:
    "AI-powered wildfire risk prediction and real-time fire spread simulation for Northern Algeria (Tizi Ouzou, Bejaia, Bouira). Powered by XGBoost, Canadian FWI, Open-Meteo, and NASA FIRMS.",
  keywords: [
    "Forest Fire Algeria",
    "Incendies Algérie",
    "Tizi Ouzou",
    "Bejaia",
    "Bouira",
    "Kabylie",
    "Wildfire Prediction",
    "XGBoost",
    "NASA FIRMS",
    "Open-Meteo",
    "IN9AD",
    "Protection Civile"
  ],
  authors: [{ name: "IN9AD PFE Research Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slatebg-950 text-slate-100 min-h-screen antialiased selection:bg-ember-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
