/* common.js — Loadmaster Pro (GitHub Pages safe)
   - Provides goHome() for modules
   - Shows version/update banner ONLY on index (module selection screen)
*/

(() => {
  "use strict";

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

  // Set your app version here (bump when you release)
  const APP_VERSION = "v1.0.0";

  function ensureBanner() {
    if (!isIndexScreen()) return null;

    const h1 = document.querySelector("h1");
    if (!h1) return null;

    // If already exists, reuse
    let banner = document.getElementById("versionBanner");
    if (banner) return banner;

    banner = document.createElement("div");
    banner.id = "versionBanner";
    banner.className = "version-banner";
    banner.innerHTML = `
      <div class="version-left">
        <span class="version-pill">Loadmaster Pro ${APP_VERSION}</span>
        <span id="swStatus" class="version-status">Ready</span>
      </div>
      <button id="updateBtn" class="btn-update" style="display:none;">Update</button>
    `;

    // Insert directly UNDER the h1
    h1.insertAdjacentElement("afterend", banner);
    return banner;
  }

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
})();
