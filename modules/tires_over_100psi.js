document.addEventListener("DOMContentLoaded", initTiresOver100);

function initTiresOver100() {
  document.getElementById("calcTires100Btn")?.addEventListener("click", calculateTiresOver100);
  document.getElementById("clearTires100Btn")?.addEventListener("click", clearAllTiresOver100);

  ["psiWeight", "psiTires", "psiLength", "psiWidth"].forEach((id) => {
    document.getElementById(id)?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        calculateTiresOver100();
      }
    });
  });
}

// TO 1C-17A-9 Figure 4D-14, Sheet 2
const PSI_LIMITS = {
  50:  { aviation: { inflight: Infinity, onoff: Infinity }, vehicle: { inflight: Infinity, onoff: Infinity } },
  55:  { aviation: { inflight: Infinity, onoff: Infinity }, vehicle: { inflight: 933, onoff: 1499 } },
  57:  { aviation: { inflight: 1386, onoff: 1656 }, vehicle: { inflight: 891, onoff: 1483 } },
  60:  { aviation: { inflight: 1289, onoff: 1642 }, vehicle: { inflight: 862, onoff: 1471 } },
  65:  { aviation: { inflight: 1238, onoff: 1638 }, vehicle: { inflight: 843, onoff: 1468 } },
  70:  { aviation: { inflight: 1221, onoff: 1644 }, vehicle: { inflight: 839, onoff: 1473 } },
  75:  { aviation: { inflight: 1219, onoff: 1327 }, vehicle: { inflight: 840, onoff: 1186 } },
  80:  { aviation: { inflight: 1223, onoff: 1221 }, vehicle: { inflight: 745, onoff: 1092 } },
  85:  { aviation: { inflight: 1036, onoff: 1159 }, vehicle: { inflight: 656, onoff: 1037 } },
  90:  { aviation: { inflight: 940, onoff: 1116 }, vehicle: { inflight: 616, onoff: 999 } },
  95:  { aviation: { inflight: 889, onoff: 1083 }, vehicle: { inflight: 589, onoff: 970 } },
  100: { aviation: { inflight: 854, onoff: 1058 }, vehicle: { inflight: 570, onoff: 947 } },
  105: { aviation: { inflight: 827, onoff: 1037 }, vehicle: { inflight: 555, onoff: 929 } },
  110: { aviation: { inflight: 807, onoff: 1020 }, vehicle: { inflight: 543, onoff: 913 } },
  115: { aviation: { inflight: 790, onoff: 1005 }, vehicle: { inflight: 533, onoff: 900 } },
  120: { aviation: { inflight: 776, onoff: 992 }, vehicle: { inflight: 525, onoff: 889 } },
  125: { aviation: { inflight: 764, onoff: 981 }, vehicle: { inflight: 518, onoff: 879 } },
  130: { aviation: { inflight: 754, onoff: 972 }, vehicle: { inflight: 511, onoff: 870 } },
  135: { aviation: { inflight: 745, onoff: 963 }, vehicle: { inflight: 506, onoff: 863 } },
  140: { aviation: { inflight: 737, onoff: 955 }, vehicle: { inflight: 501, onoff: 856 } },
  145: { aviation: { inflight: 730, onoff: 948 }, vehicle: { inflight: 497, onoff: 850 } },
  150: { aviation: { inflight: 724, onoff: 942 }, vehicle: { inflight: 493, onoff: 844 } },
  155: { aviation: { inflight: 718, onoff: 936 }, vehicle: { inflight: 489, onoff: 839 } },
  160: { aviation: { inflight: 713, onoff: 931 }, vehicle: { inflight: 486, onoff: 834 } },
  165: { aviation: { inflight: 709, onoff: 926 }, vehicle: { inflight: 483, onoff: 830 } },
  170: { aviation: { inflight: 704, onoff: 922 }, vehicle: { inflight: 480, onoff: 826 } },
  175: { aviation: { inflight: 700, onoff: 918 }, vehicle: { inflight: 478, onoff: 822 } },
  180: { aviation: { inflight: 697, onoff: 914 }, vehicle: { inflight: 476, onoff: 819 } },
  185: { aviation: { inflight: 693, onoff: 911 }, vehicle: { inflight: 473, onoff: 816 } },
  190: { aviation: { inflight: 690, onoff: 907 }, vehicle: { inflight: 471, onoff: 813 } },
  195: { aviation: { inflight: 687, onoff: 904 }, vehicle: { inflight: 470, onoff: 810 } },
  200: { aviation: { inflight: 685, onoff: 902 }, vehicle: { inflight: 468, onoff: 808 } },
  225: { aviation: { inflight: 673, onoff: 890 }, vehicle: { inflight: 461, onoff: 797 } },
  250: { aviation: { inflight: 665, onoff: 880 }, vehicle: { inflight: 455, onoff: 789 } },
  275: { aviation: { inflight: 658, onoff: 873 }, vehicle: { inflight: 451, onoff: 782 } },
  300: { aviation: { inflight: 653, onoff: 867 }, vehicle: { inflight: 448, onoff: 777 } },
  325: { aviation: { inflight: 649, onoff: 863 }, vehicle: { inflight: 445, onoff: 773 } },
  350: { aviation: { inflight: 645, onoff: 859 }, vehicle: { inflight: 443, onoff: 769 } },
  375: { aviation: { inflight: 642, onoff: 855 }, vehicle: { inflight: 441, onoff: 765 } },
  400: { aviation: { inflight: 640, onoff: 852 }, vehicle: { inflight: 439, onoff: 764 } }
};

function fmt(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// If PSI falls between chart entries, TO says use the greater number (next higher PSI row).
function getChartRowForPsi(psi) {
  const keys = Object.keys(PSI_LIMITS).map(Number).sort((a, b) => a - b);
  if (psi < keys[0]) return { key: keys[0], row: PSI_LIMITS[keys[0]], belowChart: true, aboveChart: false };
  const key = keys.find((k) => psi <= k);
  if (key !== undefined) return { key, row: PSI_LIMITS[key], belowChart: false, aboveChart: false };
  const maxKey = keys[keys.length - 1];
  return { key: maxKey, row: PSI_LIMITS[maxKey], belowChart: false, aboveChart: true };
}

function calculateTiresOver100() {
  const axleWeight = parseFloat((document.getElementById("psiWeight").value || "").replace(/,/g, ""));
  const numberOfTires = parseFloat((document.getElementById("psiTires").value || "").replace(/,/g, ""));
  const length = parseFloat((document.getElementById("psiLength").value || "").replace(/,/g, ""));
  const width = parseFloat((document.getElementById("psiWidth").value || "").replace(/,/g, ""));
  const tireType = document.getElementById("psiType").value;
  const out = document.getElementById("psiResult");

  if (![axleWeight, numberOfTires, length, width].every((v) => Number.isFinite(v) && v > 0)) {
    out.innerHTML = '<span class="bad pill">Please fill out all fields with valid numbers.</span>';
    return;
  }

  if (!(tireType === "vehicle" || tireType === "aviation")) {
    out.innerHTML = '<span class="bad pill">Please select a valid tire type.</span>';
    return;
  }

  // TO formulas, Figure 4D-14 Sheet 1
  const tireWeight = axleWeight / numberOfTires;
  const area = length * width;
  const psi = tireWeight / area;
  const piw = tireWeight / width;

  const chartInfo = getChartRowForPsi(psi);
  const limits = chartInfo.row[tireType];
  const inflightLimit = limits.inflight;
  const onoffLimit = limits.onoff;

  const inflightOk = piw <= inflightLimit;
  const onoffOk = piw <= onoffLimit;

  const inflightText = Number.isFinite(inflightLimit) ? fmt(inflightLimit) : "NO LIMIT";
  const onoffText = Number.isFinite(onoffLimit) ? fmt(onoffLimit) : "NO LIMIT";

  let html = `
    <div class="result-line"><strong>C.</strong> Tire Weight: ${fmt(tireWeight)} lbs</div>
    <div class="result-line"><strong>D.</strong> Contact Area: ${fmt(area)} sq in</div>
    <div class="result-line"><strong>E.</strong> PSI Tire Contact Pressure: ${fmt(psi)} PSI</div>
    <div class="result-line"><strong>F.</strong> PIW: ${fmt(piw)}</div>
    <div class="result-line"><strong>G.</strong> Tire Type: ${tireType.charAt(0).toUpperCase() + tireType.slice(1)}</div>
    <div class="result-line"><strong>Chart PSI Row Used:</strong> ${chartInfo.key} PSI</div>
    <div class="result-line"><strong>Maximum In-Flight PIW:</strong> ${inflightText}</div>
    <div class="result-line"><strong>Maximum On/Off PIW:</strong> ${onoffText}</div>
  `;

  if (chartInfo.aboveChart) {
    html += `
      <div class="result-line"><span class="bad pill">PSI exceeds chart limits.</span></div>
      <div class="result-line">Refer to TO guidance for additional procedures.</div>
    `;
    out.innerHTML = html;
    return;
  }

  if (chartInfo.belowChart) {
    html += `
      <div class="result-line"><span class="ok pill">PSI is below the first chart row.</span></div>
      <div class="result-line">Using the ${chartInfo.key} PSI row as the controlling minimum row.</div>
    `;
  } else if (Math.abs(psi - chartInfo.key) > 1e-9) {
    html += `
      <div class="result-line"><span class="warn pill">PSI falls between chart rows.</span></div>
      <div class="result-line">Using the next higher row (${chartInfo.key} PSI) per TO guidance.</div>
    `;
  }

  html += `
    <div class="result-line"><strong>In-Flight Parking:</strong> ${inflightOk ? '<span class="ok pill">Within Limit</span>' : '<span class="bad pill">Exceeds Limit</span>'}</div>
    <div class="result-line"><strong>On/Off Loading:</strong> ${onoffOk ? '<span class="ok pill">Within Limit</span>' : '<span class="bad pill">Exceeds Limit</span>'}</div>
  `;

  if (!inflightOk || !onoffOk) {
    html += `
      <div class="result-line"><span class="warn pill">Shoring may be required.</span></div>
      <div class="result-line">When PIW exceeds floor limits, rolling and/or parking shoring may be used to reduce PIW within allowable limits.</div>
    `;
  }

  out.innerHTML = html;
}

function clearAllTiresOver100() {
  document.getElementById("psiWeight").value = "";
  document.getElementById("psiTires").value = "";
  document.getElementById("psiLength").value = "";
  document.getElementById("psiWidth").value = "";
  document.getElementById("psiType").value = "vehicle";
  document.getElementById("psiResult").innerHTML = "";
}
