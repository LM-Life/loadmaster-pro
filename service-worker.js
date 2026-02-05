const CACHE_NAME = "loadmaster-pro-v5"; // bump version to force update

const CORE_FILES = [
  "./",
  "./index.html",
  "./offline.html",
  "./style.css",
  "./style_patch.css",
  "./common.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

const MODULE_FILES = [
  "./modules/approach.html",
  "./modules/load_planning.html",
  "./modules/loadability_5_steps.html",
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
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Cache-first
      if (cached) return cached;

      // Network fallback
      return fetch(event.request)
        .then((resp) => {
          // Optionally cache runtime-fetched files too
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return resp;
        })
        // If totally offline, show offline page for navigations
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./offline.html");
          }
        });
    })
  );
});
