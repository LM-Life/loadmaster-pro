/*
  Loadmaster Pro — common.js
  Shared helpers across modules + SW update/version UI.

  Include:
    Index:   <script src="common.js" defer></script>
    Modules: <script src="../common.js" defer></script>
*/

(() => {
  // ====== CHANGE THIS when you publish a new app release ======
  // Keep this in sync with service-worker CACHE_NAME (e.g., CACHE_NAME = "v1.11" -> APP_VERSION = "1.11")
const APP_VERSION = "2026.02.22-db1d5cc";
const APP_SEMVER = "1.31";

  // ---------- Home navigation ----------
  function resolveHomeHref() {
    // If page is inside /modules/ (or any subfolder), go up to index
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.length > 1 ? "../index.html" : "index.html";
  }

  const LP = (window.LP = window.LP || {});

  LP.goHome = function () {
    location.href = resolveHomeHref();
  };
  LP.goBack = function () {
    history.back();
  };

  // IMPORTANT: many module pages place buttons inside <form>.
  // If a Home button defaults to type="submit", the form submit can prevent navigation.
  // This helper forces type="button" and prevents default.
  LP.linkHomeButton = function (selector = ".home-button") {
    document.querySelectorAll(selector).forEach((btn) => {
      try {
        // Defensive: force "button" to avoid form submits
        if (btn.tagName === "BUTTON" && (!btn.getAttribute("type") || btn.getAttribute("type") === "submit")) {
          btn.setAttribute("type", "button");
        }
      } catch {}
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        LP.goHome();
      });
    });
  };

  // Backwards compatibility for pages using onclick="goHome()"
  window.goHome = LP.goHome;

  // ---------- DOM helpers ----------
  LP.$ = (sel, root = document) => root.querySelector(sel);
  LP.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  LP.setText = (idOrEl, text) => {
    const el = typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
    if (el) el.textContent = text;
  };
  LP.setHTML = (idOrEl, html) => {
    const el = typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
    if (el) el.innerHTML = html;
  };

  // ---------- Version banner (INDEX ONLY) ----------
  let cacheVersion = "—";
  
  function formatAppVersion(rawVersion) {
    // rawVersion example: "2026.02.22-255cd61"
    const [datePart] = rawVersion.split("-"); // strip git hash
    const [year, month, day] = datePart.split(".");
  
    const prettyDate = new Date(Date.UTC(year, month - 1, day))
      .toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  
    // vX.XX  MMM DD
    return `v${APP_SEMVER}  ${prettyDate}`;
  }

  function formatBanner() {
    return `App: ${formatAppVersion(APP_VERSION)}  |  Cache: ${cacheVersion}`;
  }

  function updateVersionBanner() {
    const vb = document.getElementById("versionBanner");
    if (!vb) return; // modules won't have this element
    vb.textContent = formatBanner();
  }

  // Ask SW what cache version it's running
  function requestCacheVersion() {
    if (!("serviceWorker" in navigator)) return;

    // If controller doesn't exist yet (first-ever visit), wait until SW is ready.
    // On iOS, controller can become available after the first reload.
    const send = () => {
      if (!navigator.serviceWorker.controller) return;
      navigator.serviceWorker.controller.postMessage({ type: "GET_CACHE_VERSION" });
    };

    if (navigator.serviceWorker.controller) {
      send();
    } else {
      // Update banner now (so user sees App version), then try again once ready.
      updateVersionBanner();
      navigator.serviceWorker.ready
        .then(() => send())
        .catch(() => {});
    }
  }

  // ---------- SW update flow (INDEX ONLY) ----------
  function showUpdateBanner() {
    const el = document.getElementById("updateBanner");
    if (!el) return; // modules won't have this element
    el.style.display = "flex";
    el.innerHTML = `
      <div>
        <div style="font-weight:800; letter-spacing:.02em;">Update available</div>
        <div class="update-sub">Tap update to load the newest cached calculators.</div>
      </div>
      <div class="update-right">
        <button class="btn-secondary" type="button" id="btnLater">Later</button>
        <button class="btn-primary" type="button" id="btnUpdate">Update</button>
      </div>
    `;

    document.getElementById("btnLater")?.addEventListener("click", () => {
      el.style.display = "none";
    });

    document.getElementById("btnUpdate")?.addEventListener("click", async () => {
      // Tell SW to activate immediately, then reload
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      }
      // Small delay helps iOS apply controllerchange cleanly
      setTimeout(() => location.reload(), 250);
    });
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;
    try {
      // Works on both index and modules (path differs)
      const swPath = location.pathname.includes("/modules/") ? "../service-worker.js" : "./service-worker.js";
      const reg = await navigator.serviceWorker.register(swPath);
      return reg;
    } catch (e) {
      console.warn("Service Worker registration failed:", e);
      return null;
    }
  }

  function setupServiceWorkerUpdateFlow() {
    // Only index has update banner UI; avoid doing anything heavy on modules.
    const hasIndexUI = !!document.getElementById("updateBanner") || !!document.getElementById("versionBanner");

    registerServiceWorker().then((reg) => {
      if (!reg) return;

      // If there is already a waiting worker, show the update banner
      if (hasIndexUI && reg.waiting && navigator.serviceWorker.controller) {
        showUpdateBanner();
      }

      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            if (hasIndexUI) showUpdateBanner();
          }
        });
      });
    });

    // Listen for SW messages (cache version)
    navigator.serviceWorker?.addEventListener("message", (event) => {
      const data = event.data || {};
      if (data.type === "CACHE_VERSION") {
        cacheVersion = data.cache || "—";
        updateVersionBanner();
      }
    });

    // Reload once when the new SW takes control
    let refreshing = false;
    navigator.serviceWorker?.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
  }

  // ---------- Pull-to-refresh (optional, safe on iOS home-screen) ----------
  function setupPullToRefresh() {
    let startY = 0;
    let pulling = false;

    window.addEventListener(
      "touchstart",
      (e) => {
        if (window.scrollY === 0) {
          startY = e.touches[0].clientY;
          pulling = true;
        } else {
          pulling = false;
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (!pulling) return;
        const y = e.touches[0].clientY;
        // If pulled down enough, refresh
        if (y - startY > 90) {
          pulling = false;
          location.reload();
        }
      },
      { passive: true }
    );
  }

  // ---------- Bootstrap ----------
  document.addEventListener("DOMContentLoaded", () => {
    LP.linkHomeButton();
    updateVersionBanner(); // show App version immediately
    setupServiceWorkerUpdateFlow();
    requestCacheVersion(); // fill Cache version once SW responds
    setupPullToRefresh();
  });
})();
