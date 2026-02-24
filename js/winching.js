// Winching module logic (extracted from winching.html)
(() => {
  'use strict';

function calculateWinching() {
      const weight = parseFloat(document.getElementById("winchWeight").value);
      const angle = document.getElementById("winchRamp").value; // keep as string to map
      const surface = document.getElementById("winchSurface").value;

      const out = document.getElementById("winchResult");

      if (isNaN(weight) || weight <= 0) {
        out.innerText = "Please enter a valid cargo weight.";
        return;
      }

      // Max single-line capacities by surface and ramp angle index:
      // [0° , 3.8° , 5° , 15°]
      const maxWeights = {
        pneumatic: [250000, 60038, 49281, 20000],
        tracks:    [ 93750, 51426, 44996, 22303],
        steel:     [416667, 58358, 46699, 17729],
        roller:    [375000, 87250, 70146, 26947],
        greased:   [ 28846, 23043, 21679, 14701],
        dry:       [ 15306, 13513, 13043, 10241],
        skids:     [  9202,  8529,  8345,  7168],
        nonskid:   [  7500,  7049,  6925,  6122]
      };

      const rampIndexMap = { "0": 0, "3.8": 1, "5": 2, "15": 3 };

      if (!(surface in maxWeights) || !(angle in rampIndexMap)) {
        out.innerText = "Invalid selection. Please recheck surface and ramp angle.";
        return;
      }

      const idx = rampIndexMap[angle];
      const singleLineCap = maxWeights[surface][idx];     // capacity for a single line
      const maxLines = 5;                                 // quintuple line (4 snatch blocks)
      const maxSnatchBlocks = 4;

      // Required lines (ceil)
      const requiredLines = Math.ceil(weight / singleLineCap);

      // Clamp display lines (can't exceed 5)
      const displayLines = Math.min(requiredLines, maxLines);
      const displaySnatch = Math.min(Math.max(displayLines - 1, 0), maxSnatchBlocks);

      // Max allowable with quintuple line
      const maxAllowable = singleLineCap * maxLines;

      const surfaceText = document.getElementById("winchSurface").selectedOptions[0].text;
      const rampText = document.getElementById("winchRamp").selectedOptions[0].text;

      // PASS/FAIL & margin
      const withinCapability = weight <= maxAllowable;
      const margin = withinCapability ? (maxAllowable - weight) : (weight - maxAllowable);

      const statusTag = withinCapability
        ? `<span class="tag pass">LOADABLE</span>`
        : `<span class="tag fail">EXCEEDS LIMITS</span>`;

      const marginLine = withinCapability
        ? `Margin under max: ${margin.toLocaleString()} lbs`
        : `EXCEEDS MAX by: ${margin.toLocaleString()} lbs`;

      // Build output
      let text = "";
      text += `${statusTag}\n`;
      text += `Surface: ${surfaceText}\n`;
      text += `Ramp: ${rampText}\n`;
      text += `Max Single Line Capacity: ${singleLineCap.toLocaleString()} lbs\n`;
      text += `Required Lines: ${requiredLines}  (Displays up to ${maxLines}-line config)\n`;
      text += `Recommended Configuration: ${displayLines}-line winch  |  Snatch Blocks: ${displaySnatch}\n`;
      text += `Maximum Allowable Cargo (with ${maxLines}-line): ${maxAllowable.toLocaleString()} lbs\n`;
      text += `${marginLine}\n`;

      if (!withinCapability) {
        text += `\n⚠️ Selected surface/ramp combination exceeds winch capability even with ${maxLines}-line.`;
      }

      out.innerHTML = text.replace(/\n/g, '<br>');
    }
    
      function clearAllWinching(){
      const weight = document.getElementById('winchWeight');
      const ramp   = document.getElementById('winchRamp');
      const surf   = document.getElementById('winchSurface');
      const out    = document.getElementById('winchResult');

     if (weight) weight.value = '';
     if (ramp)   ramp.selectedIndex = 0;
     if (surf)   surf.selectedIndex = 0;
     if (out)    out.innerHTML = '';
    }

  function initWinching() {
    const calcBtn = document.getElementById('calcWinchingBtn');
    const clearBtn = document.getElementById('clearWinchingBtn');

    if (calcBtn) calcBtn.addEventListener('click', calculateWinching);
    if (clearBtn) clearBtn.addEventListener('click', clearAllWinching);

    // Enter key on weight triggers calculate
    const weight = document.getElementById('winchWeight');
    if (weight) {
      weight.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          calculateWinching();
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initWinching);
})();
