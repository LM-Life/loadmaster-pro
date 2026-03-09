// ---------- State ----------
    let requiredText = "";
      actualHistory = [];
    let requiredRestraint = { FWD: 0, AFT: 0, LAT: 0, VERT: 0 }; // LAT = per side requirement
    let totalRestraint = { FWD: 0, AFT: 0, "LAT-LEFT": 0, "LAT-RIGHT": 0, VERT: 0 };
    
    let actualHistory = []; // stack of {dir, val}
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

    
    function undoLast() {
      if (!actualHistory.length) return;
      const last = actualHistory.pop();
      const dir = last.dir;
      const actual = last.val;

      if (dir === "LAT-LEFT") totalRestraint["LAT-LEFT"] = Math.max(totalRestraint["LAT-LEFT"] - actual, 0);
      else if (dir === "LAT-RIGHT") totalRestraint["LAT-RIGHT"] = Math.max(totalRestraint["LAT-RIGHT"] - actual, 0);
      else totalRestraint[dir] = Math.max((totalRestraint[dir] || 0) - actual, 0);

      const undoBtn = document.getElementById("undoBtn");
      if (undoBtn) undoBtn.disabled = actualHistory.length === 0;

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
      actualHistory.push({ dir: direction, val: value });
      const undoBtn = document.getElementById("undoBtn");
      if (undoBtn) undoBtn.disabled = actualHistory.length === 0;
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
      document.getElementById("restraintFactorCustom").hidden = true;
      document.getElementById("factorError").hidden = true;
    
      // Reset state
      totalRestraint = { FWD: 0, AFT: 0, "LAT-LEFT": 0, "LAT-RIGHT": 0, VERT: 0 };
      requiredRestraint = { FWD: 0, AFT: 0, LAT: 0, VERT: 0 };
      requiredText = "";
      actualHistory = [];
    
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
    
      const undoBtn = document.getElementById("undoBtn");
      if (undoBtn) undoBtn.disabled = true;

      // Clear results
      document.getElementById("result").innerHTML = "";
    }

    // ---------- Init ----------
    document.getElementById('restraintFactor').addEventListener('change', onFactorChange);
    onFactorChange();
    const undoBtn = document.getElementById("undoBtn");
    if (undoBtn) undoBtn.disabled = actualHistory.length === 0;


    // Expose handlers for inline onclick=
    window.calculateRestraint = calculateRestraint;
    window.toggleMultiplier = toggleMultiplier;
    window.calculateActualRestraint = calculateActualRestraint;
    window.undoLast = undoLast;
    window.clearAll = clearAll;
    window.onFactorChange = onFactorChange;

