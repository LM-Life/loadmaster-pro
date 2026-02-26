// LOAD PLANNING module logic (extracted from module HTML)
(() => {
  'use strict';

// Constants
    const LEMAC = 793.6;     // in
    const MAC   = 309.5;     // in

    // Rounding helpers (whole number, 1 decimal)
    const r0 = n => Math.round(Number(n)||0);
    const r1 = n => Math.round((Number(n)||0)*10)/10;

    // Elements
    const tbody = document.getElementById('payloadBody');
    const totalWeightEl = document.getElementById('totalWeight');
    const totalMom10kEl = document.getElementById('totalMom10k');

    const loadCBEl   = document.getElementById('loadCB');
    const zfCGEl     = document.getElementById('zfCG');
    const zfMACEl    = document.getElementById('zfMAC');
    const payloadTotalEl = document.getElementById('payloadTotal');

    const opWeightEl = document.getElementById('opWeight');
    const opMom10kEl = document.getElementById('opMom10k');

    function goHome(){ window.location.href = "../index.html"; }

    function parseNum(val){
      if(typeof val!=='string') return Number(val)||0;
      return Number(val.replace(/,/g,''))||0;
    }

    // Build a new table row (with CENTER column)
    function newRow(index){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="row-index">${index}</td>
        <td><input type="text" inputmode="numeric" pattern="[0-9]*"   class="inp-left"    placeholder="0"></td>
        <td><input type="text" inputmode="numeric" pattern="[0-9]*"   class="inp-center"  placeholder="0"></td>
        <td><input type="text" inputmode="numeric" pattern="[0-9]*"   class="inp-right"   placeholder="0"></td>
        <td><input type="text" inputmode="numeric" pattern="[0-9.]*" class="inp-station" placeholder="0"></td>
        <td class="out-weight">0</td>
        <td class="out-mom10k">0</td>
        <td class="row-actions"><button type="button" onclick="removeRow(this)">🗑</button></td>
      `;
      tr.querySelectorAll('input').forEach(inp => inp.addEventListener('input', recalc));
      return tr;
    }

    function addRow(){ tbody.appendChild(newRow(tbody.children.length+1)); recalc(); }
    function removeRow(btn){ const tr=btn.closest('tr'); if(tr){ tr.remove(); renumberRows(); recalc(); } }
    function renumberRows(){ [...tbody.querySelectorAll('.row-index')].forEach((c,i)=>c.textContent=i+1); }

    function clearAll(){
      tbody.innerHTML=''; addRow();
      opWeightEl.value=''; opMom10kEl.value='';
      recalc();
    }

    // Envelope handling
    let envelopePts = [];
    function seedEnvelope(){
      envelopePts = [{ w: 45000, fwd: 616, aft: 945 }];
      document.getElementById('envCSV').value = "45000,616,945\n";
    }
    function loadEnvelope(){
      const txt = document.getElementById('envCSV').value || '';
      const lines = txt.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).filter(s=>!s.startsWith('#'));
      const parsed = [];
      for(const line of lines){
        const [wS,fS,aS] = line.split(/,\s*/); // trims simple spaces after commas
        const w = Number(wS), f = Number(fS), a = Number(aS);
        if(Number.isFinite(w) && Number.isFinite(f) && Number.isFinite(a)) parsed.push({w,fwd:f,aft:a});
      }
      parsed.sort((a,b)=>a.w-b.w);
      if(parsed.length<1){ alert("No valid points found. Use: payload,fwdFS,aftFS"); return; }
      envelopePts = parsed; recalc();
    }
    function resetEnvelope(){ seedEnvelope(); recalc(); }

    function interpolateEnvelope(payload){
      if(envelopePts.length===0) return null;
      if(payload <= envelopePts[0].w) return { fwd: envelopePts[0].fwd, aft: envelopePts[0].aft };
      if(payload >= envelopePts[envelopePts.length-1].w) return { fwd: envelopePts[envelopePts.length-1].fwd, aft: envelopePts[envelopePts.length-1].aft };
      for(let i=0;i<envelopePts.length-1;i++){
        const p0=envelopePts[i], p1=envelopePts[i+1];
        if(payload>=p0.w && payload<=p1.w){
          const t=(payload-p0.w)/(p1.w-p0.w);
          return { fwd: p0.fwd + t*(p1.fwd-p0.fwd), aft: p0.aft + t*(p1.aft-p0.aft) };
        }
      }
      return null;
    }

    function recalc(){
      let totalWeight=0, totalMom10k=0;

      [...tbody.querySelectorAll('tr')].forEach(tr=>{
        const left   = parseNum(tr.querySelector('.inp-left').value);
        const center = parseNum(tr.querySelector('.inp-center').value);
        const right  = parseNum(tr.querySelector('.inp-right').value);
        const station= parseNum(tr.querySelector('.inp-station').value);

        const weight = r0(left + center + right);
        const mom10k = r0((weight * station) / 10000);

        tr.querySelector('.out-weight').textContent = weight.toLocaleString();
        tr.querySelector('.out-mom10k').textContent = mom10k.toLocaleString();

        totalWeight += weight;
        totalMom10k += mom10k;
      });

      totalWeightEl.textContent = totalWeight.toLocaleString();
      totalMom10kEl.textContent = totalMom10k.toLocaleString();
      payloadTotalEl.value = totalWeight ? totalWeight.toLocaleString() : '';

      const totalMom = totalMom10k * 10000;
      const loadCB   = totalWeight>0 ? totalMom/totalWeight : 0;
      loadCBEl.value = totalWeight>0 ? r1(loadCB).toFixed(1) : '';

      const opW   = parseNum(opWeightEl.value);
      const opM10 = parseNum(opMom10kEl.value);
      const opMom = opM10 * 10000;

      const zfW   = opW + totalWeight;
      const zfMom = opMom + totalMom;
      const zfCG  = zfW>0 ? zfMom / zfW : 0;

      zfCGEl.value  = zfW>0 ? r1(zfCG).toFixed(1) : '';
      const macPct  = zfW>0 ? ((zfCG - LEMAC) / MAC) * 100 : 0;
      zfMACEl.value = zfW>0 ? r1(macPct).toFixed(1) : '';

      // Envelope check
      const envPayloadEl = document.getElementById('envPayload');
      const envFwdEl     = document.getElementById('envFwd');
      const envAftEl     = document.getElementById('envAft');
      const envBadge     = document.getElementById('envBadge');

      envPayloadEl.value = totalWeight>0 ? r0(totalWeight).toLocaleString() : '';

      if(totalWeight>0 && envelopePts.length>0){
        const limits = interpolateEnvelope(totalWeight);
        if(limits){
          const fwd = r1(limits.fwd), aft = r1(limits.aft);
          envFwdEl.value = fwd.toFixed(1);
          envAftEl.value = aft.toFixed(1);

          if(loadCB===0){
            envBadge.innerHTML = `<span class="pill warn">No Load CB yet</span>`;
          } else if(loadCB < fwd){
            envBadge.innerHTML = `<span class="pill bad">FORWARD of limit — Load CB ${r1(loadCB).toFixed(1)} &lt; FS ${fwd.toFixed(1)}</span>`;
          } else if(loadCB > aft){
            envBadge.innerHTML = `<span class="pill bad">AFT of limit — Load CB ${r1(loadCB).toFixed(1)} &gt; FS ${aft.toFixed(1)}</span>`;
          } else {
            envBadge.innerHTML = `<span class="pill ok">WITHIN ENVELOPE — Load CB ${r1(loadCB).toFixed(1)} between FS ${fwd.toFixed(1)} and FS ${aft.toFixed(1)}</span>`;
          }
        } else {
          envFwdEl.value = ''; envAftEl.value = '';
          envBadge.innerHTML = `<span class="pill warn">Payload outside your entered envelope points — add more data</span>`;
        }
      } else {
        envFwdEl.value = ''; envAftEl.value = '';
        envBadge.innerHTML = '';
      }
    }

    // Listeners
    ['opWeight','opMom10k'].forEach(id => {
      document.getElementById(id).addEventListener('input', recalc);
    });

    // Init
    function init(){ seedEnvelope(); addRow(); addRow(); addRow(); recalc(); }
    init();

  function init() {
    // Best-effort bindings for buttons commonly used in modules.
    // If your extracted code already adds listeners on load, this will be harmless.
    const qs = (id) => document.getElementById(id);

    // Generic calculate / clear ids used in some modules
    const calcIds = ['calcBtn','calculateBtn','calc','calculate','btnCalc','btnCalculate'];
    const clearIds = ['clearBtn','clearAllBtn','clear','btnClear','btnReset','resetBtn'];

    for (const id of calcIds) {
      const b = qs(id);
      if (b && typeof window.calculate === 'function') {
        b.addEventListener('click', window.calculate);
        break;
      }
    }

    for (const id of clearIds) {
      const b = qs(id);
      if (b && typeof window.clearAll === 'function') {
        b.addEventListener('click', window.clearAll);
        break;
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
