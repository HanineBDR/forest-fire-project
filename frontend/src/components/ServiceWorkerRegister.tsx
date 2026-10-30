"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[INKAD] PWA Service Worker enregistré avec succès:", registration.scope);
          })
          .catch((error) => {
            console.warn("[INKAD] Échec de l'enregistrement du Service Worker:", error);
          });
      });
    }
  }, []);

  return null;
}
