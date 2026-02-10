const APP_VERSION = "v1.2.0";     // human-facing app version
const CACHE_VERSION = "v4";       // must match service-worker.js

  // =========
  // Home nav
  // =========
  function isInModulesFolder() {
    // Works for /loadmaster-pro/modules/xyz.html
    return location.pathname.includes("/modules/");
  }

  window.goHome = function goHome() {
    // From modules -> ../index.html
    // From root/index -> stay on index
    location.href = isInModulesFolder() ? "../index.html" : "index.html";
  };

  // ==========================
  // Index-only banner + updates
  // ==========================
  function isIndexScreen() {
    // Your index has the icon grid. Modules do not.
    return !!document.querySelector(".icon-grid");
  }

document.addEventListener("DOMContentLoaded", () => {
  // Only show banner on home screen (index.html)
  if (!location.pathname.endsWith("index.html") && location.pathname !== "/") return;

  const header = document.querySelector("h1");
  if (!header) return;

  let banner = document.getElementById("versionBanner");

  if (!banner) {
    banner = document.createElement("div");
    banner.id = "versionBanner";
    banner.className = "version-banner";
    header.insertAdjacentElement("afterend", banner);
  }

  banner.textContent = `App: ${APP_VERSION}  |  Cache: ${CACHE_VERSION}`;
});

    // Insert directly UNDER the h1
    h1.insertAdjacentElement("afterend", banner);
    return banner;
  
  function setStatus(text) {
    const el = document.getElementById("swStatus");
    if (el) el.textContent = text;
  }

  // ============
  // ServiceWorker
  // ============
  function registerSWIndexOnly() {
    if (!isIndexScreen()) return;
    if (!("serviceWorker" in navigator)) return;

    // If you're already registering in index.html, that's OK.
    // This will still work; duplicate registrations are generally harmless,
    // but if you want, remove the index.html registration later.
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }

  function setupUpdateFlow() {
    if (!isIndexScreen()) return;
    if (!("serviceWorker" in navigator)) return;

    const banner = ensureBanner();
    if (!banner) return;

    const updateBtn = document.getElementById("updateBtn");

    // When SW finds an update, we prompt user to refresh
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // New SW activated and controlling the page
      setStatus("Updated — reload recommended");
    });

    navigator.serviceWorker.ready
      .then((reg) => {
        // Show banner status
        setStatus("Online");

        // Watch for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          setStatus("Update downloading…");

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              // If there is an existing controller, it's an update
              if (navigator.serviceWorker.controller) {
                setStatus("Update ready");
                if (updateBtn) {
                  updateBtn.style.display = "inline-block";
                  updateBtn.onclick = () => {
                    // Tell SW to activate immediately if you support it.
                    // If not, a normal reload still picks it up after close/reopen.
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                    location.reload();
                  };
                }
              } else {
                setStatus("Cached for offline");
              }
            }
          });
        });
      })
      .catch(() => {
        setStatus("SW not ready");
      });
  }

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    // Banner only on index
    if (isIndexScreen()) ensureBanner();

    // SW + update flow only on index
    registerSWIndexOnly();
    setupUpdateFlow();
  });

// -------- Pull to Refresh (iOS/PWA friendly) --------
(function enablePullToRefresh(){
  let startY = 0;
  let dist = 0;
  let pulling = false;

  const THRESHOLD = 70; // px to trigger refresh

  // Create indicator once
  const indicator = document.createElement("div");
  indicator.className = "ptr-indicator";
  indicator.id = "ptrIndicator";
  indicator.textContent = "Pull to refresh";
  document.body.appendChild(indicator);

  function atTop(){
    // Works for iOS Safari/PWA + most browsers
    return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
  }

  function show(msg, ready=false){
    indicator.textContent = msg;
    indicator.classList.add("show");
    indicator.classList.toggle("ready", !!ready);
  }

  function hide(){
    indicator.classList.remove("show");
    indicator.classList.remove("ready");
  }

  // Use passive:false so we can preventDefault ONLY when pulling at top
  window.addEventListener("touchstart", (e) => {
    if (!atTop()) return;
    startY = e.touches[0].clientY;
    dist = 0;
    pulling = true;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!pulling) return;
    if (!atTop()) { pulling = false; hide(); return; }

    const y = e.touches[0].clientY;
    dist = y - startY;

    // Only when pulling down
    if (dist > 0) {
      // Stop iOS bounce/scroll from fighting us
      e.preventDefault();

      if (dist < THRESHOLD) {
        show("Pull to refresh");
      } else {
        show("Release to refresh", true);
      }
    }
  }, { passive: false });

  window.addEventListener("touchend", async () => {
    if (!pulling) return;
    pulling = false;

    if (dist >= THRESHOLD) {
      show("Refreshing…", true);

      // Optional: ask SW to update before refresh
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) await reg.update();
        }
      } catch (_) {}

      // Hard reload is best for PWAs that cache aggressively
      window.location.reload();
      return;
    }

    hide();
  }, { passive: true });
})();
