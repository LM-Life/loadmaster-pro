// ---------- State ----------
    let requiredText = "";
    let requiredRestraint = { FWD: 0, AFT: 0, LAT: 0, VERT: 0 }; // LAT = per side requirement
    let totalRestraint = { FWD: 0, AFT: 0, "LAT-LEFT": 0, "LAT-RIGHT": 0, VERT: 0 };
    let doubleMultiplier = false;

    // ---------- Helpers ----------
    function nl2br(s){ return (s || "").replace(/\n/g, "<br/>"); }

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
      const sel = document.getElementById('restraintFactor').value;
      const custom = document.getElementById('restraintFactorCustom');
      const err = document.getElementById('factorError');
      if (!custom || !err) return;
      custom.hidden = (sel !== 'custom');
      if (sel !== 'custom') { custom.value = ''; err.hidden = true; }
    }

    function getSelectedFactor() {
      const selVal = document.getElementById('restraintFactor').value;
      if (selVal !== 'custom') return parseFloat(selVal);

      const err = document.getElementById('factorError');
      const raw = (document.getElementById('restraintFactorCustom').value || "").replace(/,/g,'');
      const v = parseFloat(raw);

      if (!Number.isFinite(v) || v <= 0) {
        err.textContent = 'Enter a valid custom factor (lbs).';
        err.hidden = false;
        return null;
      }
      err.hidden = true;
      return v;
    }

    function toggleMultiplier() {
      doubleMultiplier = !doubleMultiplier;
    
      const btn = document.getElementById("multiplierBtn");
      btn.textContent = doubleMultiplier ? "×2 ON" : "×2 OFF";
    
      btn.classList.toggle("on", doubleMultiplier);
      btn.classList.toggle("off", !doubleMultiplier);
    }

    // Build display (tight “column” totals)
    function buildDisplay(extraMessageHtml = "") {
      

      const statusItems = [
        { key: "FWD",       label: "FWD" },
        { key: "AFT",       label: "AFT" },
        { key: "LAT-LEFT",  label: "LAT-L" },
        { key: "LAT-RIGHT", label: "LAT-R" },
        { key: "VERT",      label: "VERT" }
      ];

      let statusGridHtml = "";
      if (hasRequirementSet()) {
        statusGridHtml = '<div class="status-grid">' + statusItems.map(it => {
          const act = Number(totalRestraint[it.key] || 0);
          const req = Number(getRequiredForDirection(it.key) || 0);
          const ok  = act >= req;
          const rem = remaining(req, act);
          return (
            '<div class="status-card ' + (ok ? 'pass' : 'fail') + '">' +
              '<div class="status-top">' + it.label + ' <span class="status-emoji">' + (ok ? '✅' : '❌') + '</span></div>' +
              '<div class="status-mid">ACT ' + act.toLocaleString() + '</div>' +'<div class="status-bot">REM ' + rem.toLocaleString() + '</div>' +
            '</div>'
          );
        }).join('') + '</div>';
      }

const reqSet = hasRequirementSet();

      const rows = [
        { key: "FWD",       label: "FWD" },
        { key: "AFT",       label: "AFT" },
        { key: "LAT-LEFT",  label: "LAT-LEFT" },
        { key: "LAT-RIGHT", label: "LAT-RIGHT" },
        { key: "VERT",      label: "VERT" }
      ];

      let html = "";

      if (reqSet) {
        html += statusGridHtml;
      } else {
        html += `<div class="result-block">Enter cargo weight and tap <b>Calculate Required Restraint</b> to populate totals.</div>`;
      }

      if (extraMessageHtml) {
        html += `<div>${extraMessageHtml}</div>`;
      }

      return html;
    }

    // ---------- Calculations ----------
    function calculateRestraint() {
      const weight = parseFloat(document.getElementById("cargoWeight").value);
      if (!Number.isFinite(weight) || weight <= 0) {
        document.getElementById("result").innerHTML = "Enter a valid cargo weight.";
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

      document.getElementById("result").innerHTML = buildDisplay();
    }

    function calculateActualRestraint() {
      const actual = parseFloat(document.getElementById("actualLength").value);
      const effective = parseFloat(document.getElementById("effectiveLength").value);
      const direction = document.getElementById("restraintDirection").value;

      if (!Number.isFinite(actual) || actual <= 0 || !Number.isFinite(effective) || effective <= 0) {
        document.getElementById("result").innerHTML = buildDisplay("Enter valid actual and effective lengths.");
        return;
      }

      const factor = getSelectedFactor();
      if (factor === null) return; // invalid custom factor

      let value = (effective / actual) * factor;
      if (doubleMultiplier) value *= 2;
      value = Math.round(value);

      if (!(direction in totalRestraint)) {
        document.getElementById("result").innerHTML = buildDisplay("Invalid direction selection.");
        return;
      }

      totalRestraint[direction] += value;
      document.getElementById("result").innerHTML = buildDisplay();
    }

    function clearAll() {
      // Clear inputs
      document.getElementById("cargoWeight").value = "";
      document.getElementById("actualLength").value = "";
      document.getElementById("effectiveLength").value = "";
    
      // Reset dropdowns
      document.getElementById("restraintDirection").value = "FWD";
      document.getElementById("restraintFactor").value = "25000"; // match your default option
      document.getElementById("restraintFactorCustom").value = "";
      document.getElementById("restraintFactorCustom").style.display = "none";
      document.getElementById("factorError").style.display = "none";
    
      // Reset state
      totalRestraint = { FWD: 0, AFT: 0, "LAT-LEFT": 0, "LAT-RIGHT": 0, VERT: 0 };
      requiredRestraint = { FWD: 0, AFT: 0, LAT: 0, VERT: 0 };
      requiredText = "";
    
      // Reset 2x toggle (supports BOTH old + new IDs/classes)
      doubleMultiplier = false;
      const tgl =
        document.getElementById("multiplierBtn") ||
        document.getElementById("multiplierToggle");
    
      if (tgl) {
        tgl.textContent = "×2 OFF";
        tgl.classList.remove("on", "active");
        tgl.classList.add("off");
      }
    
      // Clear results
      document.getElementById("result").innerHTML = "";
    }

    // ---------- Init ----------
    onFactorChange();

function initRestraintUI(){
      const byId = (id)=>document.getElementById(id);

      byId('calcRequiredBtn')?.addEventListener('click', calculateRestraint);
      byId('multiplierBtn')?.addEventListener('click', toggleMultiplier);
      byId('addRestraintBtn')?.addEventListener('click', calculateActualRestraint);
      byId('undoBtn')?.addEventListener('click', undoLast);
      byId('clearAllBtn')?.addEventListener('click', clearAll);

      // Existing factor change binding (if present)
      const factorSel = byId('restraintFactor');
      if (factorSel){
        factorSel.addEventListener('change', onFactorChange);
      }
    }

    document.addEventListener('DOMContentLoaded', initRestraintUI);
