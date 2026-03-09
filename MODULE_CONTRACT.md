
# Loadmaster Pro — Module Contract

This document defines the **standard structure and rules** for all modules in the Loadmaster Pro web application.
Following this contract ensures that every module behaves consistently, works with the global style system, and avoids breakage when refactoring.

---

# 1. File Structure

Each module must contain exactly two files inside the `/modules` folder.

```
/modules/<module-name>.html
/modules/<module-name>.js
```

Example:

```
/modules/restraint.html
/modules/restraint.js

/modules/flight-time.html
/modules/flight-time.js
```

Do **not** place module JS files in other folders.

---

# 2. Required HTML Skeleton

All modules must follow this basic HTML structure.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

  <title>Loadmaster Pro | MODULE NAME</title>

  <link rel="stylesheet" href="../style.css" />
  <script src="../common.js" defer></script>
  <script src="./module-name.js" defer></script>
</head>

<body class="module-page module-name-page">

  <div class="container">

    <a class="home-button" href="../index.html">🏠 Home</a>

    <h1>MODULE NAME</h1>

    <div class="card">
      <!-- module content -->
    </div>

  </div>

</body>
</html>
```

---

# 3. No Styling Inside Module HTML

Modules must **not contain**:

- `<style>` blocks
- `style="..."` inline CSS

All styling belongs in:

```
style.css
```

If module-specific styling is required, scope it using the module page class.

Example:

```css
.flight-time-page .timer-display {
  font-size: 1.8rem;
}
```

---

# 4. No Inline JavaScript

Modules must **not contain**:

- `<script>` logic blocks
- `onclick=""`
- `onchange=""`
- `oninput=""`

All JavaScript must live in the module `.js` file.

Example:

```javascript
document.addEventListener("DOMContentLoaded", initModule);

function initModule() {
  document.getElementById("calcBtn")?.addEventListener("click", calculate);
}
```

---

# 5. Standard Layout Classes

Modules should use shared layout helpers defined in `style.css`.

| Class | Purpose |
|-----|-----|
| `.container` | Page wrapper |
| `.card` | Card panel |
| `.grid-2` | Two column grid |
| `.grid-3` | Three column grid |
| `.row` | Horizontal button row |
| `.divider` | Section divider |

---

# 6. Standard Button Classes

Use the following shared button styles.

| Class | Purpose |
|-----|-----|
| `.btn-primary` | Main action |
| `.btn-secondary` | Outline / secondary |
| `.btn-danger` | Clear / reset |
| `.btn-multiplier` | Toggle button |

Avoid creating new button classes unless absolutely necessary.

---

# 7. Standard Button IDs

Common actions should use consistent IDs across modules.

| ID | Use |
|----|----|
| `calcBtn` | Calculate |
| `clearBtn` | Clear |
| `resetBtn` | Reset |
| `undoBtn` | Undo |
| `addBtn` | Add |

If multiple calculate buttons exist:

```
calcRequiredBtn
calcActualBtn
```

---

# 8. Numeric Input Rule

For mobile compatibility (especially iPhone):

```
<input type="text" inputmode="numeric">
```

or

```
<input type="text" inputmode="decimal">
```

Also recommended:

```
autocomplete="off"
autocorrect="off"
autocapitalize="off"
spellcheck="false"
```

This prevents Safari zoom and keyboard issues.

---

# 9. Result Container Rule

Every module should have a primary output container.

Example:

```html
<div id="result" class="result-card"></div>
```

If multiple outputs are required:

```
resultRequired
resultActual
resultSummary
```

---

# 10. JavaScript Initialization Pattern

Each module JS file should initialize using the same pattern.

```javascript
document.addEventListener("DOMContentLoaded", initModule);

function initModule() {
  const calcBtn = document.getElementById("calcBtn");
  const clearBtn = document.getElementById("clearBtn");

  calcBtn?.addEventListener("click", calculate);
  clearBtn?.addEventListener("click", clearAll);
}
```

Avoid accessing DOM elements before the page loads.

---

# 11. Service Worker Rule

When adding a new module, update the service worker precache list.

Example:

```javascript
"./modules/module-name.html",
"./modules/module-name.js",
```

Both files must be included.

---

# 12. Mobile Layout Rule

Global mobile behavior:

```
.grid-2 → collapses to 1 column
```

If a module must stay two columns on mobile:

```css
.module-name-page .grid-2.keep-2 {
  grid-template-columns: 1fr 1fr;
}
```

---

# 13. Module-Specific Styling Rule

Module UI styling must always be scoped.

Correct:

```css
.restraint-page .status-grid { }
.flight-time-page .timer-display { }
```

Incorrect:

```css
.status-grid { }
```

This prevents styling collisions between modules.

---

# 14. Naming Rules

Use lowercase with hyphens.

Correct:

```
flight-time.html
vehicle-cg.js
tires-over-100psi.html
```

Avoid:

```
FlightTime.html
vehicleCG.js
```

---

# 15. Module Completion Checklist

Before a module is considered finished:

✔ No inline CSS  
✔ No inline JS  
✔ Uses shared layout classes  
✔ Uses shared button classes  
✔ Loads `../style.css`  
✔ Loads `../common.js`  
✔ Loads `./module-name.js`  
✔ Added to service worker cache list  

---

# Why This Matters

Following this contract ensures:

- All modules inherit the **P1 ChatOps UI**
- Global CSS works consistently
- Refactoring doesn't break modules
- New modules are faster to build
- Debugging becomes predictable

This document should remain in the repository as:

```
MODULE_CONTRACT.md
```
