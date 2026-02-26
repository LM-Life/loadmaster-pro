// Tires > 100 PSI module logic (extracted from module HTML)
(() => {
  'use strict';

// round helpers (match your earlier behavior)
    function roundDownToTenth(val) { return Math.floor(val * 10) / 10; }
    function roundUpToTenth(val)   { return Math.ceil(val * 10) / 10; }

    // PIW limits table keyed by PSI ceiling
    const psiLimits = [
      { psiMax: 22, inFlight: Infinity, onOff: Infinity },
      { psiMax: 23, inFlight: 897, onOff: Infinity },
      { psiMax: 24, inFlight: 864, onOff: Infinity },
      { psiMax: 26, inFlight: 858, onOff: Infinity },
      { psiMax: 30, inFlight: 840, onOff: Infinity },
      { psiMax: 32, inFlight: 832, onOff: Infinity },
      { psiMax: 33, inFlight: 708, onOff: Infinity },
      { psiMax: 34, inFlight: 670, onOff: Infinity },
      { psiMax: 36, inFlight: 624, onOff: Infinity },
      { psiMax: 38, inFlight: 595, onOff: Infinity },
      { psiMax: 39, inFlight: 584, onOff: Infinity },
      { psiMax: 40, inFlight: 575, onOff: 1570 },
      { psiMax: 42, inFlight: 559, onOff: 1512 },
      { psiMax: 44, inFlight: 547, onOff: 1507 },
      { psiMax: 46, inFlight: 536, onOff: 1502 },
      { psiMax: 48, inFlight: 527, onOff: 1470 },
      { psiMax: 50, inFlight: 520, onOff: 1470 },
      { psiMax: 55, inFlight: 505, onOff: 1456 },
      { psiMax: 60, inFlight: 494, onOff: 1173 },
      { psiMax: 65, inFlight: 486, onOff: 1061 },
      { psiMax: 70, inFlight: 479, onOff: 1006 },
      { psiMax: 75, inFlight: 473, onOff: 969 },
      { psiMax: 80, inFlight: 469, onOff: 941 },
      { psiMax: 90, inFlight: 462, onOff: 902 },
      { psiMax: 100, inFlight: 456, onOff: 875 },
      { psiMax: 110, inFlight: 452, onOff: 856 },
      { psiMax: 120, inFlight: 448, onOff: 841 },
      { psiMax: 140, inFlight: 444, onOff: 821 },
      { psiMax: 160, inFlight: 439, onOff: 806 },
      { psiMax: 180, inFlight: 436, onOff: 796 }
    ];

    function getLimits(psi) {
      for (let i = 0; i < psiLimits.length; i++) {
        if (psi <= psiLimits[i].psiMax) return psiLimits[i];
      }
      return psiLimits[psiLimits.length - 1];
    }

    function calculateTiresOver100() {
      const axleWeight = parseFloat(document.getElementById('psiWeight').value);
      const tires = parseInt(document.getElementById('psiTires').value);
      const length = parseFloat(document.getElementById('psiLength').value);
      const width  = parseFloat(document.getElementById('psiWidth').value);
      const type   = document.getElementById('psiType').value;

      const out = document.getElementById('psiResult');

      if (isNaN(axleWeight) || isNaN(tires) || isNaN(length) || isNaN(width) || tires <= 0 || length <= 0 || width <= 0) {
        out.innerHTML = '<span class="status bad">Please fill out all fields with valid numbers.</span>';
        return;
      }

      // Calculations
      const tireWeight = Math.round(axleWeight / tires);
      const area = roundDownToTenth(length * width);
      const psi  = roundUpToTenth(tireWeight / area);
      const piw  = roundDownToTenth(tireWeight / width);

      const limits = getLimits(psi);
      const inLimit  = piw <= limits.inFlight;
      const offLimit = piw <= limits.onOff;

      out.innerHTML = `
        <strong>A.</strong> Tire Contact Length: ${length.toFixed(1)} in<br/>
        <strong>B.</strong> Tire Contact Width: ${width.toFixed(1)} in<br/>
        <strong>C.</strong> Tire Weight (Axle Weight / Tires): ${tireWeight} lbs<br/>
        <strong>D.</strong> Contact Area (L × W): ${area.toFixed(1)} sq in<br/>
        <strong>E.</strong> PSI: ${psi.toFixed(1)}<br/>
        <strong>F.</strong> PIW: ${piw.toFixed(1)}<br/>
        <strong>G.</strong> Tire Type: ${type.charAt(0).toUpperCase() + type.slice(1)}<br/>
        <strong>H.</strong> In-Flight PIW ${inLimit ? '<span class="status ok">✅</span>' : '<span class="status bad">❌</span>'}<br/>
        <strong>I.</strong> On/Offload PIW ${offLimit ? '<span class="status ok">✅</span>' : '<span class="status bad">❌</span>'}
      `;
    }

    function clearAllTiresOver100() {
      // Inputs
      ['psiWeight', 'psiTires', 'psiLength', 'psiWidth'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

      // Select
      const type = document.getElementById('psiType');
      if (type) type.selectedIndex = 0;

      // Output
      const out = document.getElementById('psiResult');
      if (out) out.innerHTML = '';
    }

  function initTiresOver100() {
    const calc = document.getElementById('calcTires100Btn');
    const clear = document.getElementById('clearTires100Btn');
    if (calc) calc.addEventListener('click', calculateTiresOver100);
    if (clear) clear.addEventListener('click', clearAllTiresOver100);

    // Enter on last input triggers calculate
    const last = document.getElementById('psiWidth');
    if (last) {
      last.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          calculateTiresOver100();
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initTiresOver100);
})();
