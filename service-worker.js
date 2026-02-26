// Loadmaster Pro service-worker.js
// NOTE: Bump CACHE_NAME every time you want users to get a fresh cache.
const CACHE_NAME = "v2026.02.26-c826246";

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
  "./js/approach.js",
  "./modules/flight-time.html",
  "./js/flight-time.js",
  "./modules/loadshift.html",
  "./js/loadshift.js",
  "./modules/restraint.html",
  "./js/restraint.js",
  "./modules/sleeper.html",
  "./js/sleeper.js",
  "./modules/tires_over_100psi.html",
  "./js/tires_over_100psi.js",
  "./modules/vehiclecg.html",
  "./js/vehiclecg.js",
  "./modules/winching.html",
  "./js/winching.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Resolve URLs relative to the SW scope to avoid path surprises.
    const urls = [...CORE_FILES, ...MODULE_FILES].map((u) => new URL(u, self.location).toString());

    // Cache what we can. If one request fails (e.g., 404), don't brick the whole install.
    const results = await Promise.allSettled(
      urls.map(async (url) => {
        // cache: "reload" helps avoid stale responses on first install/update.
        await cache.add(new Request(url, { cache: "reload" }));
      })
    );

    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn("[SW] Precache failed:", urls[i], r.reason);
      }
    });

    self.skipWaiting();
  })());
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
  const url = new URL(event.request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

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
