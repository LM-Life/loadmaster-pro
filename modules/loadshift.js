// Load Shift module logic
(() => {
'use strict';
/* goHome moved to common.js */

    // Rounding helpers (per your rules):
    // - CG change & arms in inches -> nearest tenth
    // - Weights -> nearest whole pound
    const r0 = n => Math.round(Number(n)||0);                 // whole lbs
    const r1 = n => Math.round((Number(n)||0)*10)/10;         // 0.1 in

    function parseNum(val){
      if(typeof val!=='string') return Number(val)||0;
      return Number(val.replace(/,/g,''))||0;
    }

    function calculateLoadShift() {
      const shiftArm   = document.getElementById('shiftArm').value.trim();
      const shiftWeight= document.getElementById('shiftWeight').value.trim();
      const shiftGross = document.getElementById('shiftGross').value.trim();
      const cgChange   = document.getElementById('cgChange').value.trim();

      const vals = [
        shiftArm === '' ? NaN : Number(shiftArm),
        shiftWeight === '' ? NaN : Number(shiftWeight),
        shiftGross === '' ? NaN : Number(shiftGross),
        cgChange === '' ? NaN : Number(cgChange)
      ];

      const blanks = [shiftArm,shiftWeight,shiftGross,cgChange].filter(v=>v==='').length;
      const out = document.getElementById('loadShiftResult');

      if (blanks !== 1) {
        out.innerHTML = `<span class="bad pill">Please leave exactly one field blank.</span>`;
        return;
      }

      let arm   = isNaN(vals[0]) ? null : Number(vals[0]);
      let w     = isNaN(vals[1]) ? null : Number(vals[1]);
      let gw    = isNaN(vals[2]) ? null : Number(vals[2]);
      let dCG   = isNaN(vals[3]) ? null : Number(vals[3]);

      // Guard rails
      if (arm !== null && arm <= 0)   return out.innerHTML = `<span class="bad pill">Shift Arm must be > 0</span>`;
      if (w !== null && w <= 0)       return out.innerHTML = `<span class="bad pill">Shift Weight must be > 0</span>`;
      if (gw !== null && gw <= 0)     return out.innerHTML = `<span class="bad pill">Gross Weight must be > 0</span>`;
      if (dCG !== null && dCG < 0)    return out.innerHTML = `<span class="bad pill">CG Change cannot be negative</span>`;

      // Solve the blank using dCG = (arm * w) / gw
      let solvedText = '';
      if (arm === null) {
        arm = (dCG * gw) / w;
        solvedText = `Shift Arm = <strong>${r1(arm).toFixed(1)} in</strong>`;
      } else if (w === null) {
        w = (dCG * gw) / arm;
        solvedText = `Load Shift Weight = <strong>${r0(w).toLocaleString()} lbs</strong>`;
      } else if (gw === null) {
        gw = (dCG * w) / arm;
        solvedText = `Aircraft Gross Weight = <strong>${r0(gw).toLocaleString()} lbs</strong>`;
      } else if (dCG === null) {
        dCG = (arm * w) / gw;
        solvedText = `CG Change = <strong>${r1(dCG).toFixed(1)} in</strong>`;
      }

      // Show inputs (rounded per rules)
      const details = `
        <div class="section" style="margin-top:.6rem">
          <div><strong>Inputs (rounded for display):</strong></div>
          <div>Shift Arm: ${arm!=null ? r1(arm).toFixed(1)+' in' : '—'}</div>
          <div>Shift Weight: ${w!=null ? r0(w).toLocaleString()+' lbs' : '—'}</div>
          <div>Gross Weight: ${gw!=null ? r0(gw).toLocaleString()+' lbs' : '—'}</div>
          <div>CG Change: ${dCG!=null ? r1(dCG).toFixed(1)+' in' : '—'}</div>
        </div>
      `;

      out.innerHTML = `<span class="ok pill">Solved</span> ${solvedText}${details}`;
    }

    function clearAllLoadShift() {
      ['shiftArm','shiftWeight','shiftGross','cgChange'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('loadShiftResult').innerHTML = '';
    }

    function clearAllLoadShift(){
    const ids = ['shiftArm','shiftWeight','shiftGross','cgChange'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const out = document.getElementById('loadShiftResult');
    if (out) out.innerHTML = '';
  }

function initLoadShift() {
  const calc = document.getElementById('calcLoadShift');
  const clear = document.getElementById('clearLoadShift');
  if (calc) calc.addEventListener('click', calculateLoadShift);
  if (clear) clear.addEventListener('click', clearAllLoadShift);
}

document.addEventListener('DOMContentLoaded', initLoadShift);
})();
