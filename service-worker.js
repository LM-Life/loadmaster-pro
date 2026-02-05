const CACHE_NAME = "loadmaster-pro-v2"; // bump version to force update

const CORE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./style_patch.css",
  "./common.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

const OPTIONAL_FILES = [
  "./modules/restraint.html",
  "./modules/loadshift.html",
  "./modules/winching.html",
  "./modules/tires_over_100psi.html",
  "./modules/vehiclecg.html",
  "./modules/sleeper.html",
  "./modules/approach.html",
  "./modules/load_planning.html" // include if you have it; safe even if missing
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // 1) Core must cache successfully (or install fails)
    await cache.addAll(CORE_FILES);

    // 2) Optional best-effort cache (won't fail install if one is missing)
    const results = await Promise.allSettled(
      OPTIONAL_FILES.map(path => cache.add(path))
    );

    // Optional: log failures (you can remove this later)
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn("SW optional cache failed:", OPTIONAL_FILES[i], r.reason);
      }
    });

    self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => (key !== CACHE_NAME ? caches.delete(key) : null)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    try {
      const fresh = await fetch(event.request);

      // Cache successful same-origin requests so they work next time offline
      const url = new URL(event.request.url);
      if (url.origin === self.location.origin && fresh.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, fresh.clone());
      }

      return fresh;
    } catch (err) {
      // Offline + not cached
      return cached || new Response("Offline and not cached.", {
        status: 503,
        headers: { "Content-Type": "text/plain" }
      });
    }
  })());
});
