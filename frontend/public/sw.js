// INKAD v3.0 - Offline Tactical Service Worker for Protection Civile & DGF
// Provides offline capability in white zones (zones blanches sans couverture réseau)

const CACHE_NAME = "inkad-v3-offline-cache";

// Critical core assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/dashboard/alerts",
  "/dashboard/admin/roadmap",
  "/manifest.json",
  "/favicon.ico",
  "/images/protection_civile_algeria.jpg",
  "/images/protection_civile_truck.jpg",
  "/reports/report_smoke_yakouren.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[INKAD SW] Pre-caching core command center assets...");
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[INKAD SW] Pre-cache partial fail:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Leaflet & Esri Map Tiles (Cache First for offline tactical map)
  if (
    url.hostname.includes("tile.openstreetmap.org") ||
    url.hostname.includes("arcgisonline.com")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Fallback if offline
          return cachedResponse || new Response("", { status: 408 });
        }
      })
    );
    return;
  }

  // 2. Offline API endpoints (Network First with Cache Fallback)
  if (
    url.pathname.startsWith("/api/dgf/vigies") ||
    url.pathname.startsWith("/api/sirocco/corridors") ||
    url.pathname.startsWith("/api/drones/patrols") ||
    url.pathname.startsWith("/api/regions")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true, error: "Mode hors-ligne actif." }), {
            headers: { "Content-Type": "application/json" },
          });
        })
    );
    return;
  }

  // 3. Stale-while-revalidate for fonts, images, and static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            event.request.method === "GET"
          ) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Listener for offline zone pre-caching from Map component
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_ZONE_TILES") {
    const urls = event.data.urls || [];
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`[INKAD SW] Caching ${urls.length} tiles for offline zone: ${event.data.zoneName}`);
      urls.forEach((tileUrl) => {
        fetch(tileUrl, { mode: "no-cors" })
          .then((res) => cache.put(tileUrl, res))
          .catch(() => {});
      });
    });
  }
});
