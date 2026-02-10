// common.js (clean shared helpers for ALL modules + index)

// --------------------
// Versions you control
// --------------------
const APP_VERSION = "1.0.0";   // <-- change this when you release
const CACHE_VERSION = "v5";    // <-- must match service-worker CACHE_NAME suffix

// --------------------
// Home navigation
// --------------------
function goHome() {
  // Works from /modules/* pages and from index.html
  const inModules = window.location.pathname.includes("/modules/");
  window.location.href = inModules ? "../index.html" : "./index.html";
}
window.goHome = goHome;

// --------------------
// Version banner (index ONLY)
// --------------------
function setVersionBanner() {
  const el = document.getElementById("versionBanner");
  if (!el) return;

  // show only on index (module selection screen)
  const path = window.location.pathname;
  const isIndex = path.endsWith("/") || path.endsWith("/index.html");
  if (!isIndex) {
    el.style.display = "none";
    return;
  }

  el.textContent = `App: v${APP_VERSION}   |   Cache: ${CACHE_VERSION}`;
}

// --------------------
// Service Worker register + update prompt (index)
// --------------------
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register("./service-worker.js");

    // If a SW is already waiting, show update banner now
    if (reg.waiting) showUpdateBanner(reg);

    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      if (!sw) return;

      sw.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateBanner(reg);
        }
      });
    });

    // When the new SW takes control, reload for fresh assets
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  } catch (e) {
    console.warn("SW registration failed:", e);
  }
}

function showUpdateBanner(reg) {
  const host = document.getElementById("updateBanner");
  if (!host) return;

  // Only show on index
  const path = window.location.pathname;
  const isIndex = path.endsWith("/") || path.endsWith("/index.html");
  if (!isIndex) return;

  host.style.display = "block";
  host.innerHTML = `
    <div class="update-inner">
      <span>Update available</span>
      <button type="button" class="btn-primary" id="applyUpdateBtn">Update</button>
    </div>
  `;

  const btn = document.getElementById("applyUpdateBtn");
  if (!btn) return;

  btn.onclick = () => {
    if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
  };
}

// --------------------
// Init
// --------------------
document.addEventListener("DOMContentLoaded", () => {
  setVersionBanner();
  registerServiceWorker();
});
