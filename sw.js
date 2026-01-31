const BASE = "/loadmaster-pro";

const PRECACHE_URLS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/offline.html`,
  `${BASE}/style.css`,
  `${BASE}/common.js`,
  `${BASE}/manifest.json`,

  `${BASE}/modules/sleeper.html`,
  `${BASE}/modules/winching.html`,
  `${BASE}/modules/restraint.html`,
  `${BASE}/modules/loadshift.html`,
  `${BASE}/modules/vehiclecg.html`,
  `${BASE}/modules/approach.html`,
  `${BASE}/modules/tires_over_100psi.html`,
  `${BASE}/modules/loadability_5_steps.html`,
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
