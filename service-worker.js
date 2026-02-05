const CACHE_NAME = "loadmaster-pro-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./style_patch.css",
  "./common.js",
  "./manifest.json",

  "./modules/restraint.html",
  "./modules/loadshift.html",
  "./modules/winching.html",
  "./modules/tires_over_100psi.html",
  "./modules/vehiclecg.html",
  "./modules/sleeper.html",
  "./modules/approach.html",

  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
