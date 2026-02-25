// LOADABILITY 5 STEPS module logic (extracted from module HTML)
(() => {
  'use strict';

(function(){
    const KEY = "lp_loadability5_wizard";
    const hasLP = typeof window.LP !== "undefined";
    const saveJSON = hasLP && LP.saveJSON ? (k,v)=>LP.saveJSON(k,v) : (k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
    const loadJSON = hasLP && LP.loadJSON ? (k,f)=>LP.loadJSON(k,f) : (k,f)=>{ try{ const raw=localStorage.getItem(k); return raw?JSON.parse(raw):f; }catch(e){ return f; } };

    const steps = [
      { id: "s1", title: "Step 1 — Vehicle Projection Limit", questions: [
        { key: "s1.len",   type: "number", label: "What is the overall vehicle length (inches)?", help: "Include any front/rear overhangs." },
        { key: "s1.width", type: "number", label: "What is the overall vehicle width (inches)?", help: "Widest point, including mirrors/attachments." },
        { key: "s1.ok",    type: "yesno",  label: "Does the vehicle fit within the aircraft projection limits?", help: "If unsure, mark No and note mitigation." },
        { key: "s1.note",  type: "text",   label: "Notes / mitigation (optional)" }
      ]},
      { id: "s2", title: "Step 2 — Ramp Toe Contact Limit", questions: [
        { key: "s2.angle", type: "number", label: "What is the approach angle or limiting geometry (degrees)?", help: "Estimate if exact value not available." },
        { key: "s2.risk",  type: "yesno",  label: "Any risk of ramp toe contact based on geometry?" },
        { key: "s2.shor",  type: "yesno",  label: "Is approach shoring required?" },
        { key: "s2.note",  type: "text",   label: "Notes (e.g., shoring thickness/placement)" }
      ]},
      { id: "s3", title: "Step 3 — Ground Contact Limit", questions: [
        { key: "s3.clear", type: "yesno",  label: "Are undercarriage and overhang clearances adequate during transition?" },
        { key: "s3.path",  type: "text",   label: "List any potential strike points (if any)" },
        { key: "s3.need",  type: "yesno",  label: "Is sleeper or parking shoring required?" },
        { key: "s3.note",  type: "text",   label: "Notes / actions" }
      ]},
      { id: "s4", title: "Step 4 — Ramp Crest Limit", questions: [
        { key: "s4.break", type: "number", label: "Vehicle breakover angle (degrees), if known", help: "Optional" },
        { key: "s4.hit",   type: "yesno",  label: "Any potential crest contact at hinge/crest?" },
        { key: "s4.mit",   type: "text",   label: "Mitigation (e.g., technique/shoring)" }
      ]},
      { id: "s5", title: "Step 5 — Parking Overhang Limit", questions: [
        { key: "s5.obs",   type: "yesno",  label: "Any overhang conflict with interior obstacles while parked?" },
        { key: "s5.eg",    type: "yesno",  label: "Is egress/aisle/access maintained?" },
        { key: "s5.sec",   type: "yesno",  label: "Parking secure/ready (chocks/shoring/restraint)?" },
        { key: "s5.note",  type: "text",   label: "Notes / configuration details" }
      ]}
    ];

    const qList = steps.flatMap(s => s.questions.map((q, i) => ({...q, stepId: s.id, stepIndex: i, stepTitle: s.title})));
    const indexByKey = Object.fromEntries(qList.map((q,i)=>[q.key, i]));

    let state = loadJSON(KEY, { answers: {}, currentIndex: 0 });

    const stepTitle   = document.getElementById("step-title");
    const stepSubtitle= document.getElementById("step-subtitle");
    const qText       = document.getElementById("q-text");
    const qControls   = document.getElementById("q-controls");
    const qHelp       = document.getElementById("q-help");
    const progressBar = document.getElementById("progress-bar");
    const progressLbl = document.getElementById("progress-label");
    const btnBack     = document.getElementById("btn-back");
    const btnNext     = document.getElementById("btn-next");
    const btnSkip     = document.getElementById("btn-skip");
    const stepStatus  = document.getElementById("step-status");
    const summaryBox  = document.getElementById("summary");

    function save() { saveJSON(KEY, state); }
    function answeredCount() { return Object.keys(state.answers).length; }

    function questionsForStep(stepId) {
      return qList.filter(q => q.stepId === stepId);
    }

    function stepComplete(stepId) {
      const qs = questionsForStep(stepId);
      return qs.every(q => state.answers[q.key] !== undefined && state.answers[q.key] !== "");
    }

    function renderStepStatus() {
      stepStatus.innerHTML = "";
      steps.forEach(s => {
        const li = document.createElement("li");
        const done = stepComplete(s.id);
        li.innerHTML = `<span>${s.title}</span><span class="pill" style="border-color:${done ? '#2aa84a' : '#444'}">${done ? 'Complete' : 'Incomplete'}</span>`;
        stepStatus.appendChild(li);
      });
    }

    function renderProgress() {
      const pct = (answeredCount() / qList.length) * 100;
      progressBar.style.width = pct + "%";
      progressLbl.textContent = Math.round(pct) + "% complete";
    }

    function setIndex(i) {
      state.currentIndex = Math.max(0, Math.min(qList.length - 1, i));
      save();
      render();
    }

    function render() {
      const q = qList[state.currentIndex];
      stepTitle.textContent = q.stepTitle;
      const idxInStep = q.stepIndex + 1;
      const totalInStep = questionsForStep(q.stepId).length;
      stepSubtitle.textContent = `Question ${idxInStep} of ${totalInStep}`;

      qText.textContent = q.label;
      qHelp.textContent = q.help || "";
      qControls.innerHTML = "";

      const currentValue = state.answers[q.key];

      if (q.type === "yesno") {
        const yes = document.createElement("button");
        yes.className = "btn";
        yes.textContent = "Yes";
        yes.onclick = () => { state.answers[q.key] = true; save(); advance(); };

        const no = document.createElement("button");
        no.className = "btn";
        no.textContent = "No";
        no.onclick = () => { state.answers[q.key] = false; save(); advance(); };

        qControls.appendChild(yes);
        qControls.appendChild(no);
      }
      else if (q.type === "number") {
        const input = document.createElement("input");
        input.type = "number";
        input.step = "any";
        input.value = currentValue ?? "";
        input.placeholder = "Enter a number";
        input.oninput = () => { state.answers[q.key] = input.value === "" ? "" : Number(input.value); save(); };
        input.onkeydown = (e)=>{ if(e.key === "Enter" && input.value !== "") advance(); };
        qControls.appendChild(input);

        const nextBtn = document.createElement("button");
        nextBtn.className = "btn btn-primary";
        nextBtn.textContent = "Next ▶";
        nextBtn.onclick = () => { if(input.value !== "") advance(); };
        qControls.appendChild(nextBtn);
      }
      else if (q.type === "text") {
        const ta = document.createElement("textarea");
        ta.placeholder = "Type notes... (optional)";
        ta.value = currentValue ?? "";
        ta.oninput = () => { state.answers[q.key] = ta.value; save(); };
        qControls.appendChild(ta);

        const nextBtn = document.createElement("button");
        nextBtn.className = "btn btn-primary";
        nextBtn.textContent = "Next ▶";
        nextBtn.onclick = advance;
        qControls.appendChild(nextBtn);
      }

      btnBack.disabled = state.currentIndex === 0;
      btnNext.onclick = advance;
      btnSkip.onclick = () => { state.answers[q.key] = ""; save(); advance(); };

      renderProgress();
      renderStepStatus();
      renderSummary();
    }

    function advance() {
      if (state.currentIndex < qList.length - 1) {
        setIndex(state.currentIndex + 1);
      } else {
        render(); // end
      }
    }

    function reset() {
      state = { answers: {}, currentIndex: 0 };
      save(); render();
    }

    function renderSummary() {
      const lines = [];
      steps.forEach(s => {
        lines.push(s.title);
        questionsForStep(s.id).forEach(q => {
          const v = state.answers[q.key];
          let text;
          if (q.type === "yesno") text = v === undefined ? "—" : (v ? "Yes" : "No");
          else if (q.type === "number") text = v === undefined ? "—" : String(v);
          else text = v ? v : "—";
          lines.push(`  • ${q.label}: ${text}`);
        });
        lines.push("");
      });
      summaryBox.textContent = lines.join("\n");
    }

    document.getElementById("btn-export").addEventListener("click", function(){
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data: state }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "loadability5_wizard_export.json";
      a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById("btn-reset").addEventListener("click", reset);

    render();
  })();

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
