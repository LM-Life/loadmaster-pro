// Sleeper Shoring logic
(() => {
'use strict';


    function roundUp(num) {
      return Math.ceil(num);
    }

    function calcProvided() {
      const axle = parseFloat(document.getElementById("providedAxle").value);
      const len = parseFloat(document.getElementById("providedLength").value);
      const wid = parseFloat(document.getElementById("providedWidth").value);

      if (isNaN(axle) || isNaN(len) || isNaN(wid)) {
        document.getElementById("resultProvided").innerText = "Fill in all provided shoring fields.";
        return;
      }

      const wheelWeight = axle / 2;
      const area = roundUp(len * wid);
      const psi = roundUp(wheelWeight / area);
      const piw = Math.ceil(wheelWeight / wid);

      document.getElementById("resultProvided").innerText =
        `Wheel Weight: ${wheelWeight} lbs\n` +
        `Area: ${area} sq in\n` +
        `PSI: ${psi}\n` +
        `PIW: ${piw} lbs/in\n` +
        `Check chart for PIW ≤ 840 (In-Flight) or ≤ 1186 (On/Offload)`;
    }

    function calcUnprovided() {
      const axle = parseFloat(document.getElementById("unprovidedAxle").value);
      const psiLimit = parseFloat(document.getElementById("desiredPSI").value);

      if (isNaN(axle) || isNaN(psiLimit) || psiLimit === 0) {
        document.getElementById("resultUnprovided").innerText = "Fill in all unprovided shoring fields.";
        return;
      }

      const wheelWeight = axle / 2;
      const requiredArea = roundUp(wheelWeight / psiLimit);
      const base = roundUp(Math.sqrt(requiredArea));
      const piw = Math.ceil(wheelWeight / base);
      const minHeight = roundUp(base / 2);

      document.getElementById("resultUnprovided").innerText =
        `Wheel Weight: ${wheelWeight} lbs\n` +
        `Required Area: ${requiredArea} sq in\n` +
        `Base Dimensions: ${base} in x ${base} in\n` +
        `PIW: ${piw} lbs/in\n` +
        `Min Height: ${minHeight} in\n` +
        `Check chart for PIW ≤ 840 (In-Flight) or ≤ 1186 (On/Offload)`;
    }
  

function initSleeper() {
  const p = document.getElementById('calcProvided');
  const u = document.getElementById('calcUnprovided');
  if (p) p.addEventListener('click', calcProvided);
  if (u) u.addEventListener('click', calcUnprovided);
}

document.addEventListener('DOMContentLoaded', initSleeper);
})();
