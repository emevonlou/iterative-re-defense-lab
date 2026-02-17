const $ = (sel) => document.querySelector(sel);

const state = {
  i: 0,
  autoplay: false,
  timer: null,
  showTS: true,
  noise: false,
  score: 55
};

const iters = [
  {
    name: "Intake: sample triage",
    note: "Hashing, metadata, env isolation, hypotheses.",
    title: "Start with artifacts, not opinions.",
    desc: "RE senior começa no intake: normalizar evidências (hashes, size, entropy), definir ambiente isolado e hipóteses testáveis. O alvo é reduzir incerteza rápido.",
    mental: "Unknown ≠ unsafe. Unknown = work.",
    tm: [
      "Goal: identify <code>capabilities</code>, <code>persistence</code>, <code>network</code>, <code>impact</code>",
      "Constraints: isolate VM, snapshot, no creds, no prod tokens",
      "Artifacts: <code>SHA256</code>, file type, signing, entropy, strings preview"
    ],
    moves: [
      "Generate hashes; store chain-of-custody notes",
      "Quick static: file type + packer suspicion + imports surface",
      "Set sandbox plan: telemetry first (proc, fs, net)"
    ],
    metrics: { risk: 72, detect: 34, blast: 64, friction: 18 },
    delta: { score: +0 }
  },
  {
    name: "Iteration 1: static analysis",
    note: "Strings, imports, sections, CFG mental map.",
    title: "Static first: map the terrain.",
    desc: "Fazer o binário 'falar' antes de executar: strings, imports, sections, symbols, relocations. Seniors extraem sinais e constroem um mapa do que vale decompilar.",
    mental: "Read before run.",
    tm: [
      "Static signals: suspicious <code>imports</code>, <code>section perms</code>, high entropy",
      "Indicators: URLs, mutex names, user agents, crypto constants",
      "Entry points: main/WinMain, TLS callbacks, init arrays"
    ],
    moves: [
      "Triage packer: entropy + section naming patterns",
      "Build a call graph shortlist (resolver, net, crypto, persistence)",
      "Tag functions: <code>malloc/free</code>, <code>recv/send</code>, <code>execve/CreateProcess</code>"
    ],
    metrics: { risk: 62, detect: 42, blast: 58, friction: 24 },
    delta: { score: +7 }
  },
  {
    name: "Iteration 2: dynamic analysis",
    note: "Instrumentation, syscalls, behavior capture.",
    title: "Execute only with sensors on.",
    desc: "Rodar com instrumentação: processos/threads, file writes, registry/config, syscalls, network. A meta é comportamento, não 'ver se dá erro'.",
    mental: "No sensors, no execution.",
    tm: [
      "Evasion: sleep loops, env checks, debugger detection",
      "Behavior: process injection, persistence, credential access",
      "Network: DNS beacons, TLS SNI, JA3-like fingerprints"
    ],
    moves: [
      "Use tracers: <code>strace</code>/<code>ltrace</code>, eBPF where applicable",
      "Capture net: PCAP + DNS logs; correlate timestamps",
      "Patchless strategy: prefer hooks/tracing over modifying sample"
    ],
    metrics: { risk: 54, detect: 58, blast: 46, friction: 34 },
    delta: { score: +10 }
  },
  {
    name: "Iteration 3: unpacking & deobfuscation",
    note: "Memory dumps, stage extraction, decode routines.",
    title: "If it’s packed, your first program is the unpacker.",
    desc: "Quando packed/obfuscated, seu objetivo é extrair o payload real e o config. Seniors priorizam: dump em ponto certo + reconstrução de IAT/symbol hints quando necessário.",
    mental: "Unpack to understand, not to 'own'.",
    tm: [
      "Packed: high entropy + small import table + weird sections",
      "Stages: loader -> decrypt -> map -> jump",
      "Config: blobs, XOR/RC4/AES patterns, base64 variants"
    ],
    moves: [
      "Dump memory at <code>OEP</code>-like moment (behavioral checkpoint)",
      "Extract config: URLs, keys, sleep, mutex, campaign IDs",
      "Document decode pipeline as pseudo-code"
    ],
    metrics: { risk: 44, detect: 66, blast: 36, friction: 42 },
    delta: { score: +8 }
  },
  {
    name: "Iteration 4: detection engineering",
    note: "IOCs -> YARA + behavioral rules, FP budget.",
    title: "Turn understanding into detections.",
    desc: "A análise só vale ouro quando vira defesa: regras YARA com boas condições, IOCs com validade e contexto, e detecções comportamentais com budget de falsos positivos.",
    mental: "Detections are hypotheses with deadlines.",
    tm: [
      "Fragile IOCs: raw hashes, single URL, single domain",
      "Stronger: code patterns + structural features + behavior",
      "FP risk: generic strings, common libs, packer overlaps"
    ],
    moves: [
      "Write YARA with: unique strings + PE/ELF structure checks",
      "Behavioral rules: syscall sequences, net patterns, persistence writes",
      "Add triage playbook: what to collect when rule hits"
    ],
    metrics: { risk: 28, detect: 82, blast: 22, friction: 40 },
    delta: { score: +12 }
  },
  {
    name: "Iteration 5: reporting & lessons learned",
    note: "Repro steps, confidence, gaps, next actions.",
    title: "Make it reproducible. Make it boring.",
    desc: "Relatório senior: capabilities, evidence, confidence levels, reproduction steps, and what changed. Inclui gaps (o que não foi provado) e próximos passos.",
    mental: "Clarity beats cleverness.",
    tm: [
      "Scope: confirmed vs suspected behaviors",
      "Repro: exact steps, artifacts, logs, hashes",
      "Ops: containment guidance + monitoring window"
    ],
    moves: [
      "Write executive summary + technical appendix (IOCs, rules, config)",
      "Define containment: isolate hosts, rotate creds if indicated",
      "Postmortem: improve telemetry + playbooks + tuning cadence"
    ],
    metrics: { risk: 18, detect: 88, blast: 16, friction: 34 },
    delta: { score: +6 }
  }
];

const el = {
  timeline: $("#timeline"),
  pillIter: $("#pillIter"),
  pillMode: $("#pillMode"),
  pillHealth: $("#pillHealth"),
  fTitle: $("#fTitle"),
  fDesc: $("#fDesc"),
  fScore: $("#fScore"),
  tmList: $("#tmList"),
  dmList: $("#dmList"),
  mm: $("#mm"),
  terminal: $("#terminal"),
  chkTS: $("#chkTimestamps"),
  chkNoise: $("#chkNoise"),
  mRisk: $("#mRisk"),
  mDetect: $("#mDetect"),
  mBlast: $("#mBlast"),
  mFriction: $("#mFriction"),
  bRisk: $("#bRisk"),
  bDetect: $("#bDetect"),
  bBlast: $("#bBlast"),
  bFriction: $("#bFriction"),
  btnPrev: $("#btnPrev"),
  btnNext: $("#btnNext"),
  btnAuto: $("#btnAuto"),
  btnReset: $("#btnReset"),
  btnInject: $("#btnInject"),
  btnDecision: $("#btnDecision"),
  hint: $("#hint")
};

function clamp(n, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

function nowTS() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

function logLine(level, msg, extra = {}) {
  const div = document.createElement("div");
  div.className = "line";

  const ts = state.showTS ? `<span class="ts">${nowTS()}</span>` : "";

  let lvlClass = "ok";
  if (level === "WARN") lvlClass = "warn";
  if (level === "ALERT") lvlClass = "bad";

  const kw = extra.kw ? ` <span class="kw">${extra.kw}</span>` : "";
  const dim = extra.dim ? ` <span class="dim">${extra.dim}</span>` : "";

  div.innerHTML = `${ts}<span class="lvl ${lvlClass}">${level}</span><span class="msg">${msg}</span>${kw}${dim}`;
  el.terminal.appendChild(div);
  el.terminal.scrollTop = el.terminal.scrollHeight;
}

function setBar(barEl, val) {
  barEl.style.width = `${clamp(val)}%`;
}

function renderTimeline() {
  el.timeline.innerHTML = "";
  iters.forEach((it, idx) => {
    const li = document.createElement("li");
    li.className = "step" + (idx === state.i ? " active" : "");
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.setAttribute("aria-label", `iteration ${idx}: ${it.name}`);

    li.addEventListener("click", () => setIter(idx));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") setIter(idx);
    });

    const delta = it.delta?.score ?? 0;
    const deltaClass = delta >= 0 ? "good" : "bad";
    const deltaTxt = (delta >= 0 ? "+" : "") + delta;

    li.innerHTML = `
      <div class="left">
        <div class="badge">iter ${idx}</div>
        <div>
          <div class="name">${it.name}</div>
          <div class="note">${it.note}</div>
        </div>
      </div>
      <div class="right">
        <div class="delta ${deltaClass}">${deltaTxt} pts</div>
        <div class="delta">${it.metrics.detect}% detect</div>
      </div>
    `;

    el.timeline.appendChild(li);
  });
}

function bootBurstForIter(idx) {
  const bursts = [
    ["INFO", "SIMULATION: sample intake normalized", "kw=sha256:demo", "dim= • chain-of-custody (demo)"],
    ["INFO", "SIMULATION: static scan executed", "kw=surface=imports", "dim= • entropy check (demo)"],
    ["WARN", "SIMULATION: packer traits suspected", "kw=entropy=high", "dim= • import table thin (demo)"],
    ["INFO", "SIMULATION: dynamic plan armed", "kw=trace=syscalls", "dim= • net capture on (demo)"],
    ["INFO", "SIMULATION: behavioral checkpoint hit", "kw=checkpoint=stage1", "dim= • memory snapshot (demo)"],
    ["WARN", "SIMULATION: config blob decoded (partial)", "kw=config=extracted", "dim= • validate confidence (demo)"],
    ["INFO", "SIMULATION: detections drafted", "kw=rules=building", "dim= • FP budget (demo)"],
    ["INFO", "SIMULATION: report assembled", "kw=deliverable=ready", "dim= • repro steps (demo)"]
  ];

  const pick = (arr, n) => {
    const out = [];
    const used = new Set();
    while (out.length < n) {
      const r = Math.floor(Math.random() * arr.length);
      if (used.has(r)) continue;
      used.add(r);
      out.push(arr[r]);
    }
    return out;
  };

  const n = 3 + Math.min(idx, 2);
  pick(bursts, n).forEach(([lvl, msg, kw, dim]) => logLine(lvl, msg, { kw, dim }));
}

function renderFocus() {
  const it = iters[state.i];

  el.pillIter.textContent = `iter ${state.i}`;
  el.fTitle.textContent = it.title;
  el.fDesc.textContent = it.desc;
  el.mm.textContent = it.mental;

  state.score = clamp(
    55 + iters.slice(0, state.i + 1).reduce((acc, x) => acc + (x.delta?.score ?? 0), 0),
    0,
    100
  );
  el.fScore.textContent = String(state.score).padStart(2, "0");

  el.mRisk.textContent = `${it.metrics.risk}%`;
  el.mDetect.textContent = `${it.metrics.detect}%`;
  el.mBlast.textContent = `${it.metrics.blast}%`;
  el.mFriction.textContent = `${it.metrics.friction}%`;

  setBar(el.bRisk, it.metrics.risk);
  setBar(el.bDetect, it.metrics.detect);
  setBar(el.bBlast, it.metrics.blast);
  setBar(el.bFriction, it.metrics.friction);

  // Always simulated
  el.pillHealth.textContent = "simulated";
  el.pillHealth.classList.add("sim");

  el.tmList.innerHTML = "";
  it.tm.forEach((t) => {
    const li = document.createElement("li");
    li.innerHTML = t;
    el.tmList.appendChild(li);
  });

  el.dmList.innerHTML = "";
  it.moves.forEach((m) => {
    const li = document.createElement("li");
    li.innerHTML = m;
    el.dmList.appendChild(li);
  });

  logLine("INFO", `Loaded iteration ${state.i}: ${it.name}`, { dim: " • DEMO METRICS (simulated)" });
  bootBurstForIter(state.i);
}

const injections = [
  { lvl: "WARN", msg: "SIMULATION: high-entropy section suggests packing", kw: "static=entropy", dim: " • validate with import thinness" },
  { lvl: "WARN", msg: "SIMULATION: anti-debug hint: timing checks observed", kw: "evasion=timing", dim: " • prefer tracing vs stepping" },
  { lvl: "ALERT", msg: "SIMULATION: suspicious network beacon pattern", kw: "net=dns_beacon", dim: " • capture PCAP + SNI" },
  { lvl: "WARN", msg: "SIMULATION: write to persistence-like location detected", kw: "fs=persistence", dim: " • correlate parent process" },
  { lvl: "ALERT", msg: "SIMULATION: memory region with RWX permissions observed", kw: "mem=RWX", dim: " • stage loader suspected" },
  { lvl: "WARN", msg: "SIMULATION: config blob candidate found in memory dump", kw: "config=blob", dim: " • decode pipeline needed" }
];

function injectEvent() {
  const it = iters[state.i];
  const e = injections[Math.floor(Math.random() * injections.length)];
  logLine(e.lvl, e.msg, { kw: e.kw, dim: e.dim });

  if (it.metrics.detect < 45) el.hint.textContent = "Tip: instrument first — RE without telemetry vira fanfic.";
  else if (it.metrics.blast > 50) el.hint.textContent = "Tip: translate behavior into containment + blast radius reduction.";
  else if (it.metrics.friction > 45) el.hint.textContent = "Tip: automate collection; seniors don’t click 200 times.";
  else el.hint.textContent = "Tip: iterate → collect → prove → codify into detections.";
}

function runDecision() {
  const it = iters[state.i];

  // DEMO decision pressure formula (simulated)
  const pressure =
    (it.metrics.risk * 0.45) +
    (it.metrics.blast * 0.35) +
    (it.metrics.friction * 0.15) -
    (it.metrics.detect * 0.30);

  const noisy = state.noise ? 10 : 0;
  const verdict = pressure + noisy;

  if (verdict > 58) {
    logLine("ALERT", "Decision (SIM): CONTAIN + COLLECT", { kw: "action=isolate+dump", dim: " • preserve evidence • rotate exposed creds if any" });
  } else if (verdict > 38) {
    logLine("WARN", "Decision (SIM): TRIAGE DEEPER", { kw: "action=dynamic+extract", dim: " • focus config + network + persistence" });
  } else {
    logLine("INFO", "Decision (SIM): CODIFY DETECTION", { kw: "action=yara+behavior", dim: " • tune FP • ship playbook" });
  }

  const nud = verdict > 58 ? -1 : verdict > 38 ? +2 : +3;
  state.score = clamp(state.score + nud, 0, 100);
  el.fScore.textContent = String(state.score).padStart(2, "0");
}

function setIter(idx) {
  state.i = clamp(idx, 0, iters.length - 1);
  renderTimeline();
  renderFocus();
}

function nextIter() {
  if (state.i < iters.length - 1) setIter(state.i + 1);
  else {
    logLine("INFO", "Reached final iteration", { dim: " • reset to run another drill (SIM)" });
    stopAuto();
  }
}

function prevIter() {
  if (state.i > 0) setIter(state.i - 1);
}

function startAuto() {
  if (state.autoplay) return;
  state.autoplay = true;
  el.pillMode.textContent = "autoplay";
  el.btnAuto.textContent = "Stop";

  state.timer = setInterval(() => {
    injectEvent();
    runDecision();
    nextIter();
  }, 1900);
}

function stopAuto() {
  state.autoplay = false;
  el.pillMode.textContent = "manual";
  el.btnAuto.textContent = "Autoplay";
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
}

function toggleAuto() {
  state.autoplay ? stopAuto() : startAuto();
}

function resetAll() {
  stopAuto();
  el.terminal.innerHTML = "";
  state.i = 0;
  state.score = 55;

  renderTimeline();

  logLine("INFO", "Boot: Iterative RE Defense Lab (SIMULATION MODE)", { dim: " • demo metrics" });
  logLine("INFO", "Keys: → iterate • Space autoplay • R reset • Inject/Decision buttons", { dim: " • no host telemetry collected" });

  renderFocus();
}

el.btnNext.addEventListener("click", nextIter);
el.btnPrev.addEventListener("click", prevIter);
el.btnAuto.addEventListener("click", toggleAuto);
el.btnReset.addEventListener("click", resetAll);
el.btnInject.addEventListener("click", injectEvent);
el.btnDecision.addEventListener("click", runDecision);

el.chkTS.addEventListener("change", (e) => {
  state.showTS = e.target.checked;
  logLine("INFO", `timestamps=${state.showTS ? "on" : "off"}`, { dim: " • affects UI only (SIM)" });
});

el.chkNoise.addEventListener("change", (e) => {
  state.noise = e.target.checked;
  logLine("INFO", `noise=${state.noise ? "on" : "off"}`, { dim: " • alert fatigue simulation" });
});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") nextIter();
  if (e.key === "ArrowLeft") prevIter();
  if (e.key === " ") {
    e.preventDefault();
    toggleAuto();
  }
  if (e.key.toLowerCase() === "r") resetAll();
});

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

resetAll();
