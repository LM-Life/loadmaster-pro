// Flight Time module logic
(() => {
  'use strict';

  const LEG_PLACEHOLDER = 'X.X';

  // --- Helpers ---
  const pad2 = (n) => String(n).padStart(2, '0');

  function getNowZuluHHMM() {
    const d = new Date();
    return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
  }

  function parseHHMM(value) {
    if (!value || typeof value !== 'string') return null;
    const m = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!m) return null;
    return { h: Number(m[1]), min: Number(m[2]) };
  }

  function diffMinutes(start, end) {
    let s = start.h * 60 + start.min;
    let e = end.h * 60 + end.min;
    let rollover = false;
    if (e < s) {
      e += 24 * 60;
      rollover = true;
    }
    return { mins: e - s, rollover };
  }

  // TO minute->decimal conversion bands (your table)
  function convertMinutes(min) {
    min = Math.max(0, Math.min(60, Math.floor(min || 0)));

    if (min >= 58) return { dec: 0.0, addHour: true, band: '58–60 = Next hour' };
    if (min <= 2)  return { dec: 0.0, band: '1–2 = .0' };
    if (min <= 8)  return { dec: 0.1, band: '3–8 = .1' };
    if (min <= 14) return { dec: 0.2, band: '9–14 = .2' };
    if (min <= 20) return { dec: 0.3, band: '15–20 = .3' };
    if (min <= 26) return { dec: 0.4, band: '21–26 = .4' };
    if (min <= 33) return { dec: 0.5, band: '27–33 = .5' };
    if (min <= 39) return { dec: 0.6, band: '34–39 = .6' };
    if (min <= 45) return { dec: 0.7, band: '40–45 = .7' };
    if (min <= 51) return { dec: 0.8, band: '46–51 = .8' };
    if (min <= 57) return { dec: 0.9, band: '52–57 = .9' };
    return { dec: 0.0, band: '0 = .0' };
  }

  // Convert minutes to TO decimal (H.MM)
  function minutesToTODecimal(minsTotal) {
    const hours = Math.floor(minsTotal / 60);
    const mins = minsTotal % 60;
    const conv = convertMinutes(mins);
    const hrsAdj = hours + (conv.addHour ? 1 : 0);
    const dec = Number((hrsAdj + (conv.dec || 0)).toFixed(1));
    return { dec, hours, mins, conv };
  }

  // --- State ---
  const legsMinutes = []; // saved legs in minutes
  let currentLegMinutes = null; // current computed leg in minutes (not yet saved)
  let lastRollover = false;

  // --- DOM ---
  const els = {};
  function q(id) { return document.getElementById(id); }

  function updateZuluClock() {
    const d = new Date();
    const z = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}Z`;
    if (els.zuluClock) els.zuluClock.textContent = `Current Zulu: ${z}`;
  }

  function setNow(targetId) {
    const input = q(targetId);
    if (!input) return;
    input.value = getNowZuluHHMM();
    // auto-calc if both are present
    calculate();
  }

  // Auto-format HHMM -> HH:MM
  function autoFormatTime(input) {
    let v = (input.value || '').replace(/[^0-9]/g, '');
    if (v.length >= 3) v = v.slice(0, 2) + ':' + v.slice(2, 4);
    input.value = v.slice(0, 5);
  }

  function computeCurrentLeg() {
    const s = parseHHMM(els.startTime.value);
    const e = parseHHMM(els.endTime.value);
    if (!s || !e) return null;
    const d = diffMinutes(s, e);
    lastRollover = d.rollover;
    return d.mins;
  }

  function renderLegsAndTotal() {
    if (!els.legs) return;

    const lines = [];
    for (let i = 0; i < legsMinutes.length; i++) {
      const { dec } = minutesToTODecimal(legsMinutes[i]);
      lines.push(`Leg ${i + 1}: ${dec.toFixed(1)}`);
    }

    // Next leg placeholder (current leg preview)
    const nextIndex = legsMinutes.length + 1;
    if (currentLegMinutes != null) {
      const { dec } = minutesToTODecimal(currentLegMinutes);
      lines.push(`Leg ${nextIndex}: ${dec.toFixed(1)}`);
    } else {
      lines.push(`Leg ${nextIndex}: ${LEG_PLACEHOLDER}`);
    }

    // Total includes saved legs + current computed leg (if any)
    const totalMins = legsMinutes.reduce((a, b) => a + b, 0) + (currentLegMinutes || 0);
    const totalDec = minutesToTODecimal(totalMins).dec.toFixed(1);
    lines.push(`Total Flight Time: ${totalDec}`);

    els.legs.textContent = lines.join('\n');
    // Preserve line breaks if global CSS doesn't: best-effort
    els.legs.style.whiteSpace = 'pre-line';
  }

  function calculate() {
    // Clear previous error styles
    els.details.classList.remove('error');
    els.note.classList.remove('error');

    const legMins = computeCurrentLeg();
    currentLegMinutes = legMins;

    if (legMins == null) {
      els.resultMain.textContent = '—';
      els.resultSub.textContent = 'Enter times in HH:MM format.';
      els.details.textContent = '';
      els.note.textContent = '';
      els.details.classList.add('error');
      els.rollover.textContent = '';
      renderLegsAndTotal();
      return;
    }

    const totalMins = legsMinutes.reduce((a, b) => a + b, 0) + legMins;
    const mt = minutesToTODecimal(totalMins);

    els.resultMain.textContent = mt.dec.toFixed(1);
    els.resultSub.textContent = `Elapsed: ${mt.hours}:${pad2(mt.mins)} (H:MM)`;

    if (mt.conv.addHour) {
      els.note.textContent = 'Minutes 58–60 round to next hour (+1.0).';
    } else {
      els.note.textContent = `Minutes ${mt.mins} → ${mt.conv.band}`;
    }

    els.rollover.textContent = lastRollover ? '+1 DAY (UTC rollover)' : '';
    els.details.textContent = ''; // reserved for future
    renderLegsAndTotal();
  }

  function addLeg() {
    const legMins = computeCurrentLeg();
    if (legMins == null) return;
    legsMinutes.push(legMins);
    // After adding, clear current leg so next leg shows placeholder until user changes times
    currentLegMinutes = null;
    els.resultMain.textContent = '—';
    els.resultSub.textContent = 'Leg saved. Enter next leg times.';
    els.rollover.textContent = '';
    els.note.textContent = '';
    els.details.textContent = '';
    renderLegsAndTotal();
  }

  function resetLegs() {
    legsMinutes.length = 0;
    currentLegMinutes = null;
    lastRollover = false;
    calculate();
  }

  function clearAll() {
    els.startTime.value = '';
    els.endTime.value = '';
    legsMinutes.length = 0;
    currentLegMinutes = null;
    lastRollover = false;

    els.resultMain.textContent = '0.0';
    els.resultSub.textContent = 'Elapsed: —';
    els.details.textContent = '';
    els.note.textContent = '';
    els.rollover.textContent = '';
    renderLegsAndTotal();
  }

  function init() {
    els.startTime = q('startTime');
    els.endTime = q('endTime');
    els.zuluClock = q('zuluClock');
    els.resultMain = q('resultMain');
    els.resultSub = q('resultSub');
    els.details = q('details');
    els.note = q('note');
    els.legs = q('legs');
    els.rollover = q('rollover');

    // Buttons
    q('nowStartBtn')?.addEventListener('click', () => setNow('startTime'));
    q('nowEndBtn')?.addEventListener('click', () => setNow('endTime'));
    q('calcBtn')?.addEventListener('click', calculate);
    q('clearBtn')?.addEventListener('click', clearAll);
    q('addLegBtn')?.addEventListener('click', addLeg);
    q('resetLegsBtn')?.addEventListener('click', resetLegs);

    // Input formatting and auto-calc
    ['startTime', 'endTime'].forEach((id) => {
      const el = q(id);
      if (!el) return;
      el.addEventListener('input', () => autoFormatTime(el));
      el.addEventListener('change', calculate);
    });

    updateZuluClock();
    setInterval(updateZuluClock, 1000);
    renderLegsAndTotal();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
