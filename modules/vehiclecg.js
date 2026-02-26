// Vehicle CG module logic
(() => {
'use strict';

function calculateVehicleCG() {
      const front = parseFloat(document.getElementById('frontWeight').value);
      const rear = parseFloat(document.getElementById('rearWeight').value);
      const wheelbase = parseFloat(document.getElementById('wheelbase').value);
      const out = document.getElementById('vehicleCgResult');

      if (isNaN(front) || isNaN(rear) || isNaN(wheelbase) || wheelbase <= 0) {
        out.innerText = "Please enter valid numeric values for all fields.";
        return;
      }

      const totalWeight = front + rear;
      const cgFromFront = (rear * wheelbase) / totalWeight; // CG inches aft of front axle

      out.innerText =
        `Total Weight: ${totalWeight.toLocaleString()} lbs\n` +
        `CG Location: ${cgFromFront.toFixed(1)} in aft of front axle`;
    }

    function clearAllVehicleCG() {
      // Clear inputs
      ['frontWeight','rearWeight','wheelbase'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

      // Clear output
      const out = document.getElementById('vehicleCgResult');
      if (out) out.innerHTML = '';
    }

function initVehicleCG() {
  const calc = document.getElementById('calcVehicleCg');
  const clear = document.getElementById('clearVehicleCg');
  if (calc) calc.addEventListener('click', calculateVehicleCG);
  if (clear) clear.addEventListener('click', clearAllVehicleCG);
}

document.addEventListener('DOMContentLoaded', initVehicleCG);
})();
