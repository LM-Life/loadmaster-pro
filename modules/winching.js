// Winching module logic
document.addEventListener("DOMContentLoaded", initWinching);

function initWinching() {
  document.getElementById("calcWinchingBtn")?.addEventListener("click", calculateWinching);
  document.getElementById("clearWinchingBtn")?.addEventListener("click", clearAllWinching);

  document.getElementById("winchWeight")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      calculateWinching();
    }
  });
}

function calculateWinching() {
  const weight = parseFloat(document.getElementById("winchWeight").value);
  const angle = document.getElementById("winchRamp").value;
  const surface = document.getElementById("winchSurface").value;
  const out = document.getElementById("winchResult");

  if (!Number.isFinite(weight) || weight <= 0) {
    out.textContent = "Please enter a valid cargo weight.";
    return;
  }

  // Max single-line capacities by surface and ramp angle index:
  // [0° , 3.8° , 5° , 15°]
  const maxWeights = {
    pneumatic: [250000, 60038, 49281, 20000],
    tracks:    [ 93750, 51426, 44996, 22303],
    steel:     [416667, 58358, 46699, 17729],
    roller:    [375000, 87250, 70146, 26947],
    greased:   [ 28846, 23043, 21679, 14701],
    dry:       [ 15306, 13513, 13043, 10241],
    skids:     [  9202,  8529,  8345,  7168],
    nonskid:   [  7500,  7049,  6925,  6122]
  };

  const rampIndexMap = { "0": 0, "3.8": 1, "5": 2, "15": 3 };

  if (!(surface in maxWeights) || !(angle in rampIndexMap)) {
    out.textContent = "Invalid selection. Please recheck surface and ramp angle.";
    return;
  }

  const idx = rampIndexMap[angle];
  const singleLineCap = maxWeights[surface][idx];
  const maxLines = 5;
  const maxSnatchBlocks = 4;

  const requiredLines = Math.ceil(weight / singleLineCap);
  const displayLines = Math.min(requiredLines, maxLines);
  const displaySnatch = Math.min(Math.max(displayLines - 1, 0), maxSnatchBlocks);
  const maxAllowable = singleLineCap * maxLines;

  const surfaceText = document.getElementById("winchSurface").selectedOptions[0].text;
  const rampText = document.getElementById("winchRamp").selectedOptions[0].text;

  const withinCapability = weight <= maxAllowable;
  const margin = withinCapability ? (maxAllowable - weight) : (weight - maxAllowable);

  const statusTag = withinCapability
    ? '<span class="tag pass">LOADABLE</span>'
    : '<span class="tag fail">EXCEEDS LIMITS</span>';

  const marginLine = withinCapability
    ? `Margin under max: ${margin.toLocaleString()} lbs`
    : `EXCEEDS MAX by: ${margin.toLocaleString()} lbs`;

  const lines = [
    statusTag,
    `Surface: ${surfaceText}`,
    `Ramp: ${rampText}`,
    `Max Single Line Capacity: ${singleLineCap.toLocaleString()} lbs`,
    `Required Lines: ${requiredLines}  (Displays up to ${maxLines}-line config)`,
    `Recommended Configuration: ${displayLines}-line winch  |  Snatch Blocks: ${displaySnatch}`,
    `Maximum Allowable Cargo (with ${maxLines}-line): ${maxAllowable.toLocaleString()} lbs`,
    marginLine
  ];

  if (!withinCapability) {
    lines.push("", `⚠️ Selected surface/ramp combination exceeds winch capability even with ${maxLines}-line.`);
  }

  out.innerHTML = lines.join("<br>");
}

function clearAllWinching() {
  const weight = document.getElementById("winchWeight");
  const ramp = document.getElementById("winchRamp");
  const surf = document.getElementById("winchSurface");
  const out = document.getElementById("winchResult");

  if (weight) weight.value = "";
  if (ramp) ramp.selectedIndex = 0;
  if (surf) surf.selectedIndex = 0;
  if (out) out.innerHTML = "";
}
