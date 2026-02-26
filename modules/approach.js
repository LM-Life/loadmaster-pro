// Approach Shoring module logic (extracted from module HTML)
(() => {
  'use strict';

// Note: goHome is handled in common.js via the .home-button
    (function () {
      const overhangEl = document.getElementById('overhang');
      const clearanceEl = document.getElementById('clearance');
      const resultEl = document.getElementById('approachResult');
      const btnCalc = document.getElementById('btnCalcApproach');
      const btnClear = document.getElementById('btnClearApproach');

      // Chart: key is the upper bound ratio; value is [height (in), length (in)]
      const chart = {
        3.6: [1, 15], 3.7: [1.5, 20], 3.8: [2, 20], 3.9: [3, 25], 4.0: [3, 25],
        4.1: [3.75, 30], 4.2: [3.75, 30], 4.3: [4.5, 35], 4.4: [4.5, 35], 4.5: [5.25, 35],
        4.6: [5.25, 40], 4.7: [6, 40], 4.8: [6, 40], 4.9: [6.75, 45], 5.0: [6.75, 45],
        5.1: [7.5, 50], 5.2: [7.5, 50], 5.3: [7.5, 55], 5.4: [8.25, 60], 5.5: [8.25, 60],
        5.6: [8.25, 60], 5.7: [9, 65], 5.8: [9, 65], 5.9: [9, 65]
      };

      function setResult(html) {
        resultEl.innerHTML = html || '';
      }

      function clearAllApproach() {
        if (overhangEl) overhangEl.value = '';
        if (clearanceEl) clearanceEl.value = '';
        setResult('');
      }

      function calculateApproach() {
        const overhang = parseFloat(overhangEl.value);
        const clearance = parseFloat(clearanceEl.value);

        if (Number.isNaN(overhang) || Number.isNaN(clearance) || clearance <= 0) {
          setResult('<span class="bad pill">Please enter valid numbers.</span>');
          return;
        }

        // Ratio rounded to the nearest tenth
        const ratio = Math.round((overhang / clearance) * 10) / 10;

        let html = `
          <div class="result-line">
            <strong>Ratio (Overhang / Clearance):</strong> ${ratio.toFixed(1)}
          </div>
        `;

        if (ratio <= 3.5) {
          html += '<div class="result-line"><span class="ok pill">Shoring is not required.</span></div>';
          setResult(html);
          return;
        }

        const keys = Object.keys(chart).map(Number).sort((a, b) => a - b);
        const key = keys.find(k => ratio <= k);

        if (key !== undefined) {
          const height = chart[key][0];
          const length = chart[key][1];
          html += `
            <div class="result-line">
              <span class="warn pill">Shoring is required</span>
            </div>
            <div class="result-line"><strong>Recommended Shoring Height:</strong> ${height}"</div>
            <div class="result-line"><strong>Recommended Shoring Length:</strong> ${length}"</div>
          `;
        } else {
          html += `
            <div class="result-line">
              <span class="bad pill">Ratio exceeds chart limits.</span>
            </div>
            <div class="result-line">Refer to TO guidance for additional procedures.</div>
          `;
        }

        setResult(html);
      }

      btnCalc?.addEventListener('click', calculateApproach);
      btnClear?.addEventListener('click', clearAllApproach);

      // Quality of life: Enter key triggers Calculate from either input
      [overhangEl, clearanceEl].forEach(el => {
        el?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') calculateApproach();
        });
      });
    })();

  // If the extracted code already wires events, keep it.
  // Otherwise, try to bind common buttons by id if present.
  function initApproach() {
    // no-op: module logic typically runs on load
  }

  document.addEventListener('DOMContentLoaded', initApproach);
})();
