"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[IN9AD] PWA Service Worker enregistré avec succès:", registration.scope);
          })
          .catch((error) => {
            console.warn("[IN9AD] Échec de l'enregistrement du Service Worker:", error);
          });
      });
    }
  }, []);

  return null;
}
