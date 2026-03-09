// ---------- State ----------
let requiredText = "";
let requiredRestraint = { FWD: 0, AFT: 0, LAT: 0, VERT: 0 }; // LAT = per side requirement
let totalRestraint = { FWD: 0, AFT: 0, "LAT-LEFT": 0, "LAT-RIGHT": 0, VERT: 0 };
let actualHistory = []; // stack of { dir, val }
let doubleMultiplier = false;

// ---------- Helpers ----------
function nl2br(s) { return (s || "").replace(/\n/g, "<br/>"); }

function hasRequirementSet() {
  return (requiredRestraint.FWD + requiredRestraint.AFT + requiredRestraint.LAT + requiredRestraint.VERT) > 0;
}

function getRequiredForDirection(dir) {
  if (dir === "LAT-LEFT" || dir === "LAT-RIGHT") return requiredRestraint.LAT || 0; // per side
  return requiredRestraint[dir] || 0;
}

function remaining(req, actual) {
  return Math.max(req - actual, 0);
}

// Custom factor UI
function onFactorChange() {
  const sel = document.getElementById("restraintFactor")?.value;
  const custom = document.getElementById("restraintFactorCustom");
  const err = document.getElementById("factorError");
  if (!custom || !err) return;

  custom.hidden = (sel !== "custom");
  if (sel !== "custom") {
    custom.value = "";
    err.hidden = true;
    err.textContent = "";
  }
}

function getSelectedFactor() {
  const selVal = document.getElementById("restraintFactor")?.value;
  if (selVal !== "custom") return parseFloat(selVal);

  const err = document.getElementById("factorError");
  const raw = (document.getElementById("restraintFactorCustom")?.value || "").replace(/,/g, "");
  const v = parseFloat(raw);

  if (!Number.isFinite(v) || v <= 0) {
    if (err) {
      err.textContent = "Enter a valid custom factor (lbs).";
      err.hidden = false;
    }
    return null;
  }

  if (err) {
    err.hidden = true;
    err.textContent = "";
  }
  return v;
}

function toggleMultiplier() {
  doubleMultiplier = !doubleMultiplier;

  const btn = document.getElementById("multiplierBtn");
  if (!btn) return;

  btn.textContent = doubleMultiplier ? "×2 ON" : "×2 OFF";
  btn.classList.toggle("on", doubleMultiplier);
  btn.classList.toggle("off", !doubleMultiplier);
}

function updateUndoState() {
  const undoBtn = document.getElementById("undoBtn");
  if (undoBtn) undoBtn.disabled = actualHistory.length === 0;
}

// Build display (tight “column” totals)
function buildDisplay(extraMessageHtml = "") {
  const statusItems = [
    { key: "FWD", label: "FWD" },
    { key: "AFT", label: "AFT" },
    { key: "LAT-LEFT", label: "LAT-L" },
    { key: "LAT-RIGHT", label: "LAT-R" },
    { key: "VERT", label: "VERT" }
  ];

  let statusGridHtml = "";
  if (hasRequirementSet()) {
    statusGridHtml = '<div class="status-grid">' + statusItems.map(it => {
      const act = Number(totalRestraint[it.key] || 0);
      const req = Number(getRequiredForDirection(it.key) || 0);
      const ok = act >= req;
      const rem = remaining(req, act);
      return (
        '<div class="status-card ' + (ok ? 'pass' : 'fail') + '">' +
          '<div class="status-top">' + it.label + ' <span class="status-emoji">' + (ok ? '✅' : '❌') + '</span></div>' +
          '<div class="status-mid">ACT ' + act.toLocaleString() + '</div>' +
          '<div class="status-bot">REM ' + rem.toLocaleString() + '</div>' +
        '</div>'
      );
    }).join('') + '</div>';
  }

  let html = "";

  if (hasRequirementSet()) {
    html += statusGridHtml;
  } else {
    html += '<div class="result-block">Enter cargo weight and tap <b>Calculate Required Restraint</b> to populate totals.</div>';
  }

  if (extraMessageHtml) {
    html += '<div>' + extraMessageHtml + '</div>';
  }

  return html;
}

// ---------- Calculations ----------
function calculateRestraint() {
  const weight = parseFloat(document.getElementById("cargoWeight")?.value);
  const result = document.getElementById("result");

  if (!result) return;

  if (!Number.isFinite(weight) || weight <= 0) {
    result.innerHTML = "Enter a valid cargo weight.";
    return;
  }

  const g = { FWD: 3.0, AFT: 1.5, LAT: 1.5, VERT: 2.0 };

  requiredRestraint = {
    FWD: Math.round(weight * g.FWD),
    AFT: Math.round(weight * g.AFT),
    LAT: Math.round(weight * g.LAT), // per side
    VERT: Math.round(weight * g.VERT)
  };

  requiredText =
`Required Restraint for ${Math.round(weight)} lbs:
FWD:  ${requiredRestraint.FWD} lbs
AFT:  ${requiredRestraint.AFT} lbs
LAT:  ${requiredRestraint.LAT} lbs (each side)
VERT: ${requiredRestraint.VERT} lbs`;

  result.innerHTML = buildDisplay();
}

function calculateActualRestraint() {
  const actual = parseFloat(document.getElementById("actualLength")?.value);
  const effective = parseFloat(document.getElementById("effectiveLength")?.value);
  const direction = document.getElementById("restraintDirection")?.value;
  const result = document.getElementById("result");

  if (!result) return;

  if (!Number.isFinite(actual) || actual <= 0 || !Number.isFinite(effective) || effective <= 0) {
    result.innerHTML = buildDisplay("Enter valid actual and effective lengths.");
    return;
  }

  const factor = getSelectedFactor();
  if (factor === null) return;

  let value = (effective / actual) * factor;
  if (doubleMultiplier) value *= 2;
  value = Math.round(value);

  if (!(direction in totalRestraint)) {
    result.innerHTML = buildDisplay("Invalid direction selection.");
    return;
  }

  totalRestraint[direction] += value;
  actualHistory.push({ dir: direction, val: value });
  updateUndoState();
  result.innerHTML = buildDisplay();
}

function undoLast() {
  if (!actualHistory.length) return;

  const last = actualHistory.pop();
  const dir = last.dir;
  const actual = last.val;

  if (dir === "LAT-LEFT") totalRestraint["LAT-LEFT"] = Math.max(totalRestraint["LAT-LEFT"] - actual, 0);
  else if (dir === "LAT-RIGHT") totalRestraint["LAT-RIGHT"] = Math.max(totalRestraint["LAT-RIGHT"] - actual, 0);
  else totalRestraint[dir] = Math.max((totalRestraint[dir] || 0) - actual, 0);

  updateUndoState();
  const result = document.getElementById("result");
  if (result) result.innerHTML = buildDisplay();
}

function clearAll() {
  // Clear inputs
  const cargoWeight = document.getElementById("cargoWeight");
  const actualLength = document.getElementById("actualLength");
  const effectiveLength = document.getElementById("effectiveLength");
  if (cargoWeight) cargoWeight.value = "";
  if (actualLength) actualLength.value = "";
  if (effectiveLength) effectiveLength.value = "";

  // Reset dropdowns
  const restraintDirection = document.getElementById("restraintDirection");
  const restraintFactor = document.getElementById("restraintFactor");
  const restraintFactorCustom = document.getElementById("restraintFactorCustom");
  const factorError = document.getElementById("factorError");

  if (restraintDirection) restraintDirection.value = "FWD";
  if (restraintFactor) restraintFactor.value = "25000";
  if (restraintFactorCustom) {
    restraintFactorCustom.value = "";
    restraintFactorCustom.hidden = true;
  }
  if (factorError) {
    factorError.textContent = "";
    factorError.hidden = true;
  }

  // Reset state
  totalRestraint = { FWD: 0, AFT: 0, "LAT-LEFT": 0, "LAT-RIGHT": 0, VERT: 0 };
  requiredRestraint = { FWD: 0, AFT: 0, LAT: 0, VERT: 0 };
  requiredText = "";
  actualHistory = [];

  // Reset 2x toggle
  doubleMultiplier = false;
  const tgl = document.getElementById("multiplierBtn");
  if (tgl) {
    tgl.textContent = "×2 OFF";
    tgl.classList.remove("on", "active");
    tgl.classList.add("off");
  }

  updateUndoState();

  // Clear results
  const result = document.getElementById("result");
  if (result) result.innerHTML = "";
}

function initRestraintModule() {
  document.getElementById("calculateRequiredBtn")?.addEventListener("click", calculateRestraint);
  document.getElementById("multiplierBtn")?.addEventListener("click", toggleMultiplier);
  document.getElementById("addRestraintBtn")?.addEventListener("click", calculateActualRestraint);
  document.getElementById("undoBtn")?.addEventListener("click", undoLast);
  document.getElementById("clearAllBtn")?.addEventListener("click", clearAll);
  document.getElementById("restraintFactor")?.addEventListener("change", onFactorChange);

  onFactorChange();
  updateUndoState();
}

// Legacy compatibility if any inline handlers remain
window.calculateRestraint = calculateRestraint;
window.toggleMultiplier = toggleMultiplier;
window.calculateActualRestraint = calculateActualRestraint;
window.undoLast = undoLast;
window.clearAll = clearAll;
window.onFactorChange = onFactorChange;

document.addEventListener("DOMContentLoaded", initRestraintModule);
