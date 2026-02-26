// restraint.js - Loadmaster Pro (P1 theme compatible)
// Keeps all styling in global CSS; this file only handles logic + minimal markup rendering.

(function () {
  'use strict';

  // ---- Helpers ----
  const $ = (id) => document.getElementById(id);

  function toNumber(v) {
    const n = Number(String(v ?? '').replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp0(n) { return n < 0 ? 0 : n; }

  function formatLbs(n) {
    if (!Number.isFinite(n)) return '—';
    return Math.round(n).toLocaleString('en-US');
  }

  // Minutes -> decimal mapping (TO table style buckets)
  function minuteToDecimal(min) {
    // Buckets: 0-2=.0, 3-8=.1, 9-14=.2, 15-20=.3, 21-26=.4, 27-32=.5,
    // 33-38=.6, 39-44=.7, 45-51=.8, 52-57=.9, 58-59=1.0
    if (min <= 2) return 0.0;
    if (min <= 8) return 0.1;
    if (min <= 14) return 0.2;
    if (min <= 20) return 0.3;
    if (min <= 26) return 0.4;
    if (min <= 32) return 0.5;
    if (min <= 38) return 0.6;
    if (min <= 44) return 0.7;
    if (min <= 51) return 0.8;
    if (min <= 57) return 0.9;
    return 1.0;
  }

  // ---- State ----
  let multiplierOn = false; // x2
  let required = { FWD: 0, AFT: 0, LATL: 0, LATR: 0, VERT: 0 };
  let actual   = { FWD: 0, AFT: 0, LATL: 0, LATR: 0, VERT: 0 };
  const undoStack = [];

  function snapshotState() {
    return {
      multiplierOn,
      required: { ...required },
      actual: { ...actual }
    };
  }

  function restoreState(s) {
    multiplierOn = !!s.multiplierOn;
    required = { ...s.required };
    actual = { ...s.actual };
    updateMultiplierUI();
    renderStatus();
  }

  function pushUndo() {
    undoStack.push(snapshotState());
    // keep it sane
    if (undoStack.length > 30) undoStack.shift();
  }

  // ---- UI hooks ----
  function updateMultiplierUI() {
    const btn = $('multiplierBtn');
    if (!btn) return;
    btn.classList.toggle('is-on', multiplierOn);
    btn.textContent = multiplierOn ? '×2 ON' : '×2 OFF';
  }

  function getSelectedFactor() {
    const sel = $('restraintFactor');
    const custom = $('restraintFactorCustom');
    const err = $('factorError');

    if (!sel) return { value: NaN, ok: false };

    const raw = sel.value;

    let val;
    if (raw === 'custom') {
      val = toNumber(custom?.value);
    } else {
      val = toNumber(raw);
    }

    const ok = Number.isFinite(val) && val > 0;

    if (err) {
      err.style.display = ok ? 'none' : 'block';
    }
    return { value: val, ok };
  }

  function effectiveRatio() {
    const a = toNumber($('actualLength')?.value);
    const e = toNumber($('effectiveLength')?.value);
    if (!Number.isFinite(a) || !Number.isFinite(e) || a <= 0 || e <= 0) return NaN;
    return e / a;
  }

  function dirKey() {
    const dir = $('restraintDirection')?.value || 'FWD';
    if (dir === 'FWD') return 'FWD';
    if (dir === 'AFT') return 'AFT';
    if (dir === 'LAT-L') return 'LATL';
    if (dir === 'LAT-R') return 'LATR';
    if (dir === 'VERT') return 'VERT';
    return 'FWD';
  }

  // ---- Core calculations ----
  function calculateRestraint() {
    const w = toNumber($('cargoWeight')?.value);
    if (!Number.isFinite(w) || w <= 0) {
      required = { FWD: 0, AFT: 0, LATL: 0, LATR: 0, VERT: 0 };
      renderStatus();
      return;
    }

    pushUndo();

    required = {
      FWD: 3.0 * w,
      AFT: 1.5 * w,
      LATL: 1.5 * w,
      LATR: 1.5 * w,
      VERT: 2.0 * w
    };

    // do not wipe actual when recalculating required; user may want to keep their restraints
    renderStatus();
  }

  function calculateActualRestraint() {
    const { value: factor, ok } = getSelectedFactor();
    if (!ok) return;

    const ratio = effectiveRatio();
    if (!Number.isFinite(ratio)) return;

    pushUndo();

    const base = factor * ratio * (multiplierOn ? 2 : 1);
    const key = dirKey();
    actual[key] = (actual[key] || 0) + base;

    renderStatus();
  }

  function clearAll() {
    pushUndo();
    multiplierOn = false;
    required = { FWD: 0, AFT: 0, LATL: 0, LATR: 0, VERT: 0 };
    actual = { FWD: 0, AFT: 0, LATL: 0, LATR: 0, VERT: 0 };

    const w = $('cargoWeight'); if (w) w.value = '';
    const a = $('actualLength'); if (a) a.value = '';
    const e = $('effectiveLength'); if (e) e.value = '';
    const custom = $('restraintFactorCustom'); if (custom) custom.value = '';

    updateMultiplierUI();
    renderStatus();
  }

  function undoLast() {
    const last = undoStack.pop();
    if (!last) return;
    restoreState(last);
  }

  function toggleMultiplier() {
    pushUndo();
    multiplierOn = !multiplierOn;
    updateMultiplierUI();
    renderStatus();
  }

  // ---- Rendering ----
  function statusItem(label, key, requiredVal) {
    const act = actual[key] || 0;
    const req = requiredVal || 0;
    const rem = req - act;

    const done = req > 0 && rem <= 0;
    const bubble = done ? '✔' : '✖';

    return `
      <div class="status-item ${done ? 'is-good' : 'is-bad'}">
        <div class="status-head">
          <div class="status-label">${label}</div>
          <div class="status-bubble" aria-hidden="true">${bubble}</div>
        </div>
        <div class="status-lines">
          <div class="status-line"><span class="k">ACT</span><span class="v">${formatLbs(act)}</span></div>
          <div class="status-line"><span class="k">REM</span><span class="v">${formatLbs(clamp0(rem))}</span></div>
        </div>
      </div>
    `;
  }

  function renderStatus() {
    const box = $('requiredRestraintDisplay');
    if (!box) return;

    // If required is all zeros, keep box minimal
    const anyReq = Object.values(required).some(v => v > 0);

    if (!anyReq) {
      box.innerHTML = '';
      return;
    }

    box.innerHTML = `
      <div class="status-grid" role="group" aria-label="Restraint status">
        ${statusItem('FWD',  'FWD',  required.FWD)}
        ${statusItem('AFT',  'AFT',  required.AFT)}
        ${statusItem('LAT-L','LATL', required.LATL)}
        ${statusItem('LAT-R','LATR', required.LATR)}
        ${statusItem('VERT', 'VERT', required.VERT)}
      </div>
    `;
  }

  // ---- Init ----
  function wire() {
    // factor custom toggle
    const sel = $('restraintFactor');
    const custom = $('restraintFactorCustom');
    if (sel && custom) {
      const refresh = () => {
        const show = sel.value === 'custom';
        custom.style.display = show ? 'block' : 'none';
        custom.toggleAttribute('aria-hidden', !show);
      };
      sel.addEventListener('change', refresh);
      refresh();
    }

    // buttons by id (in addition to inline onclicks, for safety)
    $('calcRequiredBtn')?.addEventListener('click', (e) => { e.preventDefault(); calculateRestraint(); });
    $('addRestraintBtn')?.addEventListener('click', (e) => { e.preventDefault(); calculateActualRestraint(); });
    $('clearAllBtn')?.addEventListener('click', (e) => { e.preventDefault(); clearAll(); });
    $('undoBtn')?.addEventListener('click', (e) => { e.preventDefault(); undoLast(); });
    $('multiplierBtn')?.addEventListener('click', (e) => { e.preventDefault(); toggleMultiplier(); });

    updateMultiplierUI();
    renderStatus();
  }

  // Expose for inline onclicks (non-module script)
  window.calculateRestraint = calculateRestraint;
  window.calculateActualRestraint = calculateActualRestraint;
  window.clearAll = clearAll;
  window.undoLast = undoLast;
  window.toggleMultiplier = toggleMultiplier;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();

  // ---- expose handlers for inline onclick buttons (safe shim) ----
  window.calculateRestraint = window.calculateRestraint || calculateRestraint;
  window.calculateActualRestraint = window.calculateActualRestraint || calculateActualRestraint;
  window.toggleMultiplier = window.toggleMultiplier || toggleMultiplier;
  window.clearAll = window.clearAll || clearAll;
  window.undoLast = window.undoLast || undoLast;
