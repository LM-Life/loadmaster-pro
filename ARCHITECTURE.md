# Loadmaster Pro — Architecture Guide

This document defines the **overall architecture** of the Loadmaster Pro web application so the project remains stable, scalable, and easy to maintain as modules grow.

---

# 1. Project Purpose

Loadmaster Pro is a modular, offline-capable web app built around mission-focused calculators and tools for C-17 loadmaster workflows.

The architecture should prioritize:

- consistency
- offline reliability
- mobile usability
- predictable module behavior
- minimal duplication
- easy maintenance

---

# 2. Core Design Principles

## 2.1 Separation of concerns
Each concern belongs in one place only:

- **HTML** = structure
- **CSS** = appearance
- **JS** = behavior
- **Service Worker** = caching / offline behavior

No module should mix these unnecessarily.

---

## 2.2 Shared system first
Prefer shared global systems before module-specific exceptions:

- one global `style.css`
- one `common.js`
- one service worker
- one module contract

Only add module-specific overrides when the shared system cannot reasonably support a module.

---

## 2.3 Predictability over cleverness
Every module should look and behave like it belongs to the same app.

If a user learns one module, they should intuitively understand the rest.

---

# 3. Folder Structure

Recommended structure:

```text
/
  index.html
  style.css
  common.js
  service-worker.js
  manifest.json
  offline.html
  MODULE_CONTRACT.md
  ARCHITECTURE.md

  /icons
    icon-192.png
    icon-512.png
    ...

  /modules
    approach.html
    approach.js
    restraint.html
    restraint.js
    flight-time.html
    flight-time.js
    ...
```

## Rule
Each module has **exactly two files** in `/modules`:

```text
/modules/<module>.html
/modules/<module>.js
```

Do not split module JS into another folder unless the whole app adopts that convention consistently.

---

# 4. Module Loading Model

Each module is a standalone page loaded from the index.

Example:

```text
index.html
  → modules/restraint.html
  → modules/flight-time.html
  → modules/winching.html
```

Each module page must load:

```html
<link rel="stylesheet" href="../style.css" />
<script src="../common.js" defer></script>
<script src="./module-name.js" defer></script>
```

This ensures:
- shared theme loads first
- shared helpers are available
- module logic loads after the DOM is parsed

---

# 5. Styling Architecture

## 5.1 Global CSS
`style.css` is the **single source of truth** for:

- colors
- typography
- spacing
- buttons
- inputs
- cards
- grids
- shared result components

## 5.2 Scoped module styling
If a module needs unique visuals, scope them with the page class:

```css
.restraint-page .status-grid { ... }
.flight-time-page .legs { ... }
```

Never use bare global selectors for module-only UI.

## 5.3 No inline styling
Modules must not contain:
- `<style>` blocks
- `style=""`

This prevents drift and keeps the UI maintainable.

---

# 6. JavaScript Architecture

## 6.1 Module script ownership
Each module owns its own behavior in its own JS file.

Example:

```text
modules/restraint.html
modules/restraint.js
```

## 6.2 Initialization pattern
Every module JS file must initialize through:

```javascript
document.addEventListener("DOMContentLoaded", initModule);
```

This prevents:
- null element lookups
- race conditions
- broken event handlers

## 6.3 No inline handlers
Avoid:
- `onclick`
- `onchange`
- `oninput`

Use `addEventListener` instead.

## 6.4 Common helpers
`common.js` should only contain shared helpers such as:
- home navigation behavior
- version banner logic
- service worker update prompt
- shared utility functions

Do not place module-specific logic in `common.js`.

---

# 7. Service Worker Architecture

## 7.1 Purpose
The service worker provides:
- offline support
- cached shell loading
- predictable module loading
- versioned updates

## 7.2 Precache policy
Every active module must have both files cached:

```javascript
"./modules/restraint.html",
"./modules/restraint.js",
```

Do not precache a module HTML without its JS companion.

## 7.3 Resilient caching
Use a resilient install strategy so one missing file does not break the whole install.

Prefer:
- `Promise.allSettled`
over
- `cache.addAll`

This helps debug missing file paths safely.

## 7.4 Versioning
Whenever files that affect rendering or logic change, update the cache version.

Examples:
- `style.css`
- `common.js`
- `service-worker.js`
- any module HTML
- any module JS

---

# 8. Versioning Strategy

## 8.1 Purpose
Versioning exists to:
- bust stale caches
- track deployed builds
- make debugging easier

## 8.2 Display version vs cache version
These may be different:

- **App display version** = user-friendly label
- **Cache version** = technical build identifier

Recommended:
- app display: `vX.XX MMM DD`
- cache version: build hash or date-based unique string

## 8.3 Rule
If deployed behavior changed, the cache version must change too.

---

# 9. Index Page Architecture

The home screen should act as a module launcher only.

It should:
- remain lightweight
- avoid module-specific logic
- use shared tile styles
- keep all tiles visually consistent

Index tiles should reference modules by their `/modules/...` paths.

---

# 10. Mobile / PWA Architecture

## 10.1 Mobile-first interaction
All module inputs and buttons should be usable one-handed on iPhone where possible.

## 10.2 Input rules
Numeric inputs should prefer:

```html
<input type="text" inputmode="numeric">
```

or

```html
<input type="text" inputmode="decimal">
```

This avoids Safari quirks.

## 10.3 PWA expectations
The app should remain usable when:
- installed to home screen
- offline
- reopened after updates

That means:
- consistent cache rules
- stable service worker behavior
- no broken relative paths

---

# 11. Result Rendering Philosophy

Each module should expose a clear output area using shared visual patterns:

- `.result-card`
- `.result-main`
- `.result-sub`

This makes modules feel consistent even when their logic differs.

If a module needs “bubble cards” or status tiles, those should still be scoped but built on the same visual language.

---

# 12. Accessibility / UX Standards

Every module should aim for:

- visible labels for every input
- high-contrast colors
- large touch targets
- predictable button placement
- no hidden critical actions
- meaningful `aria-live` on dynamic results when appropriate

---

# 13. Refactor Rules

When refactoring a module:

1. Do not change file paths casually
2. Do not mix inline and external JS
3. Do not reintroduce inline CSS
4. Update service worker paths immediately
5. Test on:
   - desktop browser
   - mobile Safari / iPhone
   - PWA installed mode if applicable

---

# 14. Definition of “Done”

A module is considered complete only when:

- it follows `MODULE_CONTRACT.md`
- it works with current `style.css`
- it works with current `service-worker.js`
- it has no inline CSS
- it has no inline JS
- it is precached correctly
- it behaves correctly on desktop and mobile

---

# 15. Recommended Next Improvements

As Loadmaster Pro matures, these additions will improve maintainability:

- a small `/docs/` folder for project standards
- automated validation checklist before deploy
- optional module template file for faster new module creation
- optional CI check for missing precache entries

---

# 16. Architecture Summary

Loadmaster Pro should always follow this model:

```text
HTML = structure
CSS  = shared visual system
JS   = module behavior
SW   = offline + cache control
```

When this separation is maintained, the app becomes:
- easier to scale
- easier to debug
- easier to theme
- safer to refactor
