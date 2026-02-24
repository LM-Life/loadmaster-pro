// Loadmaster Pro service-worker.js
// NOTE: Bump CACHE_NAME every time you want users to get a fresh cache.
const CACHE_NAME = "v2026.02.24-4a4e78c";

const CORE_FILES = [
  "./",
  "./index.html",
  "./offline.html",
  "./style.css",
  "./common.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

const MODULE_FILES = [
  "./modules/approach.html",
  "./modules/flight-time.html",
  "./modules/loadshift.html",
  "./modules/restraint.html",
  "./modules/sleeper.html",
  "./modules/tires_over_100psi.html",
  "./modules/vehiclecg.html",
  "./modules/winching.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...CORE_FILES, ...MODULE_FILES]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
    // NOTE: We intentionally do NOT force-reload all tabs here.
    // The page code handles update prompts and reload-on-controllerchange.
  })());
});

// Page <-> SW messaging
self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "GET_CACHE_VERSION") {
    event.source?.postMessage({ type: "CACHE_VERSION", cache: CACHE_NAME });
    return;
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Cache-first
      if (cached) return cached;

      // Network fallback + runtime cache
      return fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return resp;
        })
        .catch(() => {
          // If totally offline, show offline page for navigations
          if (event.request.mode === "navigate") {
            return caches.match("./offline.html");
          }
        });
    })
  );
});
