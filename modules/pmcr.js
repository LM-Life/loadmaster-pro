(() => {
  'use strict';

  const MINIMUM_OFF_STATION_MINUTES = 16 * 60;
  const MAX_PMCR_MINUTES = 96 * 60;
  let mode = 'date';
  const els = {};

  const q = (id) => document.getElementById(id);
  const pad2 = (value) => String(value).padStart(2, '0');

  function utcInputValue(date = new Date()) {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
  }

  function parseZuluInput(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value || '');
    if (!match) return null;
    const [, year, month, day, hour, minute] = match.map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day ||
      date.getUTCHours() !== hour ||
      date.getUTCMinutes() !== minute
    ) return null;
    return date;
  }

  function formatZulu(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '—';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${pad2(date.getUTCDate())} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} at ${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}Z`;
  }

  function formatDuration(totalMinutes) {
    const rounded = Math.max(0, Math.round(totalMinutes));
    const days = Math.floor(rounded / 1440);
    const hours = Math.floor((rounded % 1440) / 60);
    const minutes = rounded % 60;
    const parts = [];
    if (days) parts.push(`${days} day${days === 1 ? '' : 's'}`);
    if (hours) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
    if (minutes || parts.length === 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
    return parts.join(' ');
  }

  function parseNonNegativeInteger(input, max = Number.MAX_SAFE_INTEGER) {
    const raw = input.value.trim();
    if (raw === '') return 0;
    if (!/^\d+$/.test(raw)) return null;
    const value = Number(raw);
    return Number.isSafeInteger(value) && value <= max ? value : null;
  }

  function getOffStationMinutes() {
    if (mode === 'date') {
      const departure = parseZuluInput(els.departureTime.value);
      const returned = parseZuluInput(els.returnTime.value);
      if (!departure || !returned) {
        return { error: 'Enter valid departure and return date/times.' };
      }
      const minutes = (returned.getTime() - departure.getTime()) / 60000;
      if (minutes <= 0) {
        return { error: 'Return time must be after departure time.' };
      }
      return { minutes, departure, returned };
    }

    const days = parseNonNegativeInteger(els.offDays, 999);
    const hours = parseNonNegativeInteger(els.offHours, 23);
    const minutes = parseNonNegativeInteger(els.offMinutes, 59);
    if (days == null || hours == null || minutes == null) {
      return { error: 'Use whole numbers: hours 0–23 and minutes 0–59.' };
    }
    const total = (days * 1440) + (hours * 60) + minutes;
    if (total <= 0) return { error: 'Enter an off-station duration greater than zero.' };
    return { minutes: total };
  }

  function setStatus(text, type) {
    els.statusPill.textContent = text;
    els.statusPill.className = `pill ${type || ''}`.trim();
  }

  function renderError(message) {
    setStatus('CHECK INPUT', 'bad');
    els.pmcrMain.textContent = '—';
    els.pmcrSub.textContent = message;
    els.pmcrSub.classList.add('error');
    els.resultDetails.innerHTML = '';
    els.resultNote.textContent = '';
  }

  function detail(label, value) {
    return `<div class="pmcr-result-item"><span>${label}</span><strong>${value}</strong></div>`;
  }

  function calculate() {
    els.pmcrSub.classList.remove('error');
    const offStation = getOffStationMinutes();
    if (offStation.error) {
      renderError(offStation.error);
      return;
    }

    const dutiesComplete = els.dutiesCompleteTime.value
      ? parseZuluInput(els.dutiesCompleteTime.value)
      : null;
    if (els.dutiesCompleteTime.value && !dutiesComplete) {
      renderError('Enter a valid duties-complete date/time.');
      return;
    }

    const offMinutes = offStation.minutes;
    if (offMinutes < MINIMUM_OFF_STATION_MINUTES) {
      setStatus('16-HOUR RULE NOT MET', 'warn');
      els.pmcrMain.textContent = 'Not required';
      els.pmcrSub.textContent = 'This mission was under 16 hours off station.';
      els.resultDetails.innerHTML = [
        detail('Total Off-Station Time', formatDuration(offMinutes)),
        detail('Threshold', '16 hours')
      ].join('');
      els.resultNote.textContent = 'The cited rule does not establish a mandatory PMCR amount; SQ/CC recovery direction still applies.';
      return;
    }

    const rawPmcrMinutes = offMinutes / 3;
    const capped = rawPmcrMinutes > MAX_PMCR_MINUTES;
    const pmcrMinutes = Math.min(rawPmcrMinutes, MAX_PMCR_MINUTES);
    const pmcrDisplayMinutes = Math.round(pmcrMinutes);
    const expiration = dutiesComplete
      ? new Date(dutiesComplete.getTime() + (pmcrDisplayMinutes * 60000))
      : null;

    setStatus(capped ? '96-HOUR MAX APPLIED' : 'PMCR APPLIES', capped ? 'warn' : 'ok');
    els.pmcrMain.textContent = formatDuration(pmcrDisplayMinutes);
    els.pmcrSub.textContent = capped
      ? `Uncapped calculation: ${formatDuration(rawPmcrMinutes)}.`
      : 'Minimum PMCR based on the 1:3 off-station ratio.';

    const details = [
      detail('Total Off-Station Time', formatDuration(offMinutes)),
      detail('PMCR Earned', formatDuration(pmcrDisplayMinutes))
    ];
    if (dutiesComplete) {
      details.push(detail('PMCR Begins', formatZulu(dutiesComplete)));
      details.push(detail('PMCR Expires', formatZulu(expiration)));
    } else {
      details.push(detail('PMCR Begins', 'Enter duties-complete time'));
      details.push(detail('PMCR Expires', '—'));
    }
    els.resultDetails.innerHTML = details.join('');
    els.resultNote.textContent = dutiesComplete
      ? 'Pre-departure crew rest cannot begin until the PMCR period expires.'
      : 'PMCR duration is calculated. Add duties-complete time to determine the start and expiration.';
  }

  function setMode(nextMode) {
    mode = nextMode;
    const dateActive = mode === 'date';
    els.dateMode.hidden = !dateActive;
    els.manualMode.hidden = dateActive;
    els.dateModeBtn.className = `btn-multiplier ${dateActive ? 'on' : 'off'}`;
    els.manualModeBtn.className = `btn-multiplier ${dateActive ? 'off' : 'on'}`;
    els.dateModeBtn.setAttribute('aria-pressed', String(dateActive));
    els.manualModeBtn.setAttribute('aria-pressed', String(!dateActive));
  }

  function setNow(target) {
    target.value = utcInputValue();
  }

  function clearAll() {
    [els.departureTime, els.returnTime, els.dutiesCompleteTime, els.offDays, els.offHours, els.offMinutes]
      .forEach((input) => { input.value = ''; });
    setMode('date');
    setStatus('READY', '');
    els.pmcrMain.textContent = '—';
    els.pmcrSub.textContent = 'Enter the mission information.';
    els.pmcrSub.classList.remove('error');
    els.resultDetails.innerHTML = '';
    els.resultNote.textContent = '';
  }

  function updateZuluClock() {
    const now = new Date();
    els.zuluClock.textContent = `Current Zulu: ${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(now.getUTCSeconds())}Z`;
  }

  function init() {
    Object.assign(els, {
      dateModeBtn: q('dateModeBtn'), manualModeBtn: q('manualModeBtn'),
      dateMode: q('dateMode'), manualMode: q('manualMode'),
      departureTime: q('departureTime'), returnTime: q('returnTime'),
      dutiesCompleteTime: q('dutiesCompleteTime'), offDays: q('offDays'),
      offHours: q('offHours'), offMinutes: q('offMinutes'), zuluClock: q('zuluClock'),
      statusPill: q('statusPill'), pmcrMain: q('pmcrMain'), pmcrSub: q('pmcrSub'),
      resultDetails: q('resultDetails'), resultNote: q('resultNote')
    });

    els.dateModeBtn.addEventListener('click', () => setMode('date'));
    els.manualModeBtn.addEventListener('click', () => setMode('manual'));
    q('nowDepartureBtn').addEventListener('click', () => setNow(els.departureTime));
    q('nowReturnBtn').addEventListener('click', () => setNow(els.returnTime));
    q('nowDutiesBtn').addEventListener('click', () => setNow(els.dutiesCompleteTime));
    q('calcBtn').addEventListener('click', calculate);
    q('clearBtn').addEventListener('click', clearAll);

    [els.departureTime, els.returnTime, els.dutiesCompleteTime, els.offDays, els.offHours, els.offMinutes]
      .forEach((input) => input.addEventListener('change', calculate));

    updateZuluClock();
    setInterval(updateZuluClock, 1000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
