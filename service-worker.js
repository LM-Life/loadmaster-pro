const CACHE_NAME = "loadmaster-pro-v5";

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
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
      await self.clients.claim();

      // Tell all open tabs “reload now” after activation
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clients.forEach((c) => c.postMessage({ type: "RELOAD_PAGE" }));
    })()
  );
});

// Let page tell SW to activate immediately
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return resp;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./offline.html");
          }
        });
    })
  );
});

// When a new SW is installed and waiting, notify clients
self.addEventListener("install", () => {
  self.skipWaiting();
});
