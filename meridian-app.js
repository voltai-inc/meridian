/* ============================================================================
   Voltai Meridian — AI Factory Site Intelligence UI controller.
   Renders the wizard → recommendation → readiness → financial → candidates →
   comparison → forecast flow, plus the copilot. All analysis comes from
   meridian-engine.js; this file is presentation + interaction only.
   ============================================================================ */
"use strict";

// ─── FORMAT HELPERS ──────────────────────────────────────────────────────────
const fm = n => { const a = Math.abs(n), s = n < 0 ? "−" : ""; return a >= 1e9 ? s + "$" + (a / 1e9).toFixed(2) + "B" : a >= 1e6 ? s + "$" + (a / 1e6).toFixed(0) + "M" : a >= 1e3 ? s + "$" + (a / 1e3).toFixed(0) + "K" : s + "$" + Math.round(a); };
const fmM = n => { const a = Math.abs(n); return a >= 1e9 ? "$" + (a / 1e9).toFixed(2) + "B" : "$" + (a / 1e6).toFixed(1) + "M"; };
const pct = n => Math.round((n || 0) * 100) + "%";
const fc = n => Math.round(n).toLocaleString();
const cents = p => (p * 100).toFixed(1) + "¢";
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const riskClass = r => r === "Low" ? "ok" : r === "Moderate" ? "warn" : "danger";
const verdictClass = v => v === "PASS" ? "ok" : v === "WARN" ? "warn" : "danger";
// The verdict is a real 19-check simulation output. At the recommendation altitude
// a WARN/FAIL means the utility sizing needs a derate iteration, not a dead end —
// framed here the way the deep-dive tool frames it, with the detail one click away.
function verdictPill(v) {
  const map = {
    PASS: ["ok", "Power design: clears", "The scaled 2N electrical design survives this workload's transients at the modeled contracted capacity."],
    WARN: ["warn", "Power: derate advised", "Peak transients approach the contracted limit. A modest IT derate or added BESS clears it — open the full analysis for the 19-check breakdown."],
    FAIL: ["danger", "Power: derate required", "Modeled facility peak exceeds contracted capacity at this sizing. Resolve with an IT derate, more BESS power, or a higher interconnect — a design iteration, not a disqualifier. See full analysis."],
  };
  const [cls, label, tip] = map[v] || map.WARN;
  return `<span class="pill ${cls}" title="${esc(tip)}" style="cursor:help">${label}</span>`;
}

// ─── APP STATE ───────────────────────────────────────────────────────────────
const App = {
  req: null,
  view: "wizard",         // wizard | analyzing | results
  step: 0,
  objective: "balanced",
  selectedId: null,       // hero / detail site
  compareSet: [],         // up to 3 ids
  fcYear: 2030,
  xaiTab: "why",
  candTab: "balanced",
  evals: null,            // cached rank for current objective
  surfaceIds: null,       // copilot filter: ids to float to the top of candidates
  rec: null,
};

// Regions are derived from the shared SITES data layer (meridian-data.js, the same
// candidate pipeline Site Selection renders) — never a separate hardcoded list, so the
// "Where are you building?" options always match the sites actually in the pipeline.
const REGIONS = ["any", ...Array.from(new Set(SITES.map(s => s.state)))];

// ─── WIZARD DEFINITION ───────────────────────────────────────────────────────
const WIZARD = [
  {
    key: "region", q: "Where are you building?", sub: "Target region for the AI factory. We'll rank every candidate site in the pipeline against your requirements.",
    type: "options", cols: "three",
    opts: () => REGIONS.map(r => { const n = SITES.filter(s => s.state === r).length; return { v: r, t: r === "any" ? "Any region" : r, s: r === "any" ? "Compare the full pipeline" : `${n} site${n === 1 ? "" : "s"} tracked` }; }),
  },
  {
    key: "powerMW", q: "How much power do you need?", sub: "Target capacity at the meter — enter any value. Drives the compute design, CAPEX, and which sites can serve the load.",
    type: "number", min: 1, step: 5, unit: "MW",
    presets: [25, 50, 100, 250, 500, 1000],
  },
  {
    key: "chip", q: "Which GPU platform?", sub: "The silicon shapes power behavior, performance, cost, and lead time. Shipping platforms first.",
    type: "chips",
  },
  {
    key: "workload", q: "What will it run?", sub: "Training draws synchronized, transient-heavy power; inference is steadier. This changes the electrical verdict and the economics.",
    type: "options", cols: "three",
    opts: () => [
      { v: "train", t: "Training", s: "Synchronized, bursty load" },
      { v: "mix", t: "Mixed", s: "Training + inference fleet" },
      { v: "infer", t: "Inference", s: "Steady, latency-sensitive" },
    ],
  },
  {
    key: "budget", q: "How tight is the budget?", sub: "Sets how heavily cost per MW weighs in the recommendation.",
    type: "options", cols: "three",
    opts: () => [
      { v: "flexible", t: "Flexible", s: "Optimize for performance & scale" },
      { v: "moderate", t: "Moderate", s: "Balance cost and capability" },
      { v: "tight", t: "Tight", s: "Minimize CAPEX / $ per MW" },
    ],
  },
  {
    key: "sustainability", q: "How much does sustainability matter?", sub: "Raises the weight on cooling efficiency, renewable supply, and water availability.",
    type: "slider", min: 0, max: 100, step: 10, unit: "%", pctScale: true,
    scale: ["Not a factor", "Balanced", "Top priority"],
  },
  {
    key: "latency", q: "What are your latency needs?", sub: "Low-latency inference raises the weight on fiber connectivity and grid proximity.",
    type: "options", cols: "three",
    opts: () => [
      { v: "standard", t: "Standard", s: "Training / batch — latency-tolerant" },
      { v: "low", t: "Low", s: "Regional inference serving" },
      { v: "ultra-low", t: "Ultra-low", s: "Edge / real-time inference" },
    ],
  },
];

// ─── SVG: SCORE RING ─────────────────────────────────────────────────────────
function scoreRing(score, size = 172, stroke = 13, label = "Overall Score", showLabel = true) {
  const r = (size - stroke) / 2, cx = size / 2, C = 2 * Math.PI * r;
  const off = C * (1 - score / 100);
  const id = "g" + Math.random().toString(36).slice(2, 7);
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a0000"/><stop offset="1" stop-color="#c92121"/></linearGradient></defs>
      <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="#eef2f6" stroke-width="${stroke}"/>
      <circle class="rc" cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
    </svg>
    <div class="center"><div class="v">${score}${showLabel ? "<small>/100</small>" : ""}</div>${showLabel ? `<div class="l">${label}</div>` : ""}</div>
  </div>`;
}
function miniRing(score, size = 52) {
  const stroke = 5, r = (size - stroke) / 2, cx = size / 2, C = 2 * Math.PI * r, off = C * (1 - score / 100);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="#eef2f6" stroke-width="${stroke}"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="#AF0000" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
    <text x="${cx}" y="${cx}" transform="rotate(90 ${cx} ${cx})" text-anchor="middle" dominant-baseline="central" font-family="Space Grotesk" font-weight="700" font-size="15" fill="#060a0e">${score}</text>
  </svg>`;
}

// ─── SVG: RADAR ──────────────────────────────────────────────────────────────
function radarChart(rd, size = 250) {
  const cx = size / 2, cy = size / 2, R = size / 2 - 34, N = rd.order.length;
  const ang = i => (Math.PI * 2 * i / N) - Math.PI / 2;
  const pt = (i, rad) => [cx + Math.cos(ang(i)) * rad, cy + Math.sin(ang(i)) * rad];
  let g = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  // rings
  [0.25, 0.5, 0.75, 1].forEach(f => {
    let p = "";
    for (let i = 0; i < N; i++) { const [x, y] = pt(i, R * f); p += `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)} `; }
    g += `<path d="${p}Z" fill="none" stroke="#e6ebf1" stroke-width="1"/>`;
  });
  // spokes + labels
  for (let i = 0; i < N; i++) {
    const [x, y] = pt(i, R); g += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#eef2f6" stroke-width="1"/>`;
    const [lx, ly] = pt(i, R + 15); const short = rd.label[rd.order[i]].split(" ")[0];
    const anchor = Math.abs(lx - cx) < 6 ? "middle" : lx > cx ? "start" : "end";
    g += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" font-family="IBM Plex Mono" font-size="8.5" fill="#8a929b">${short}</text>`;
  }
  // data polygon
  let dp = "";
  for (let i = 0; i < N; i++) { const [x, y] = pt(i, R * rd.cat[rd.order[i]].score / 100); dp += `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)} `; }
  g += `<path d="${dp}Z" fill="rgba(175,0,0,.12)" stroke="#AF0000" stroke-width="1.8" stroke-linejoin="round"/>`;
  for (let i = 0; i < N; i++) { const [x, y] = pt(i, R * rd.cat[rd.order[i]].score / 100); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#AF0000"/>`; }
  g += `</svg>`;
  return g;
}

// ─── SVG: FORECAST CHART ─────────────────────────────────────────────────────
function forecastChart(fcData, site) {
  const W = 560, H = 220, pL = 46, pR = 46, pT = 20, pB = 34;
  const base = { year: fcData.base, price: regionPower(site.state).price, renewable: regionPower(site.state).renewable, gridAvail: regionPower(site.state).reliability };
  const rows = [base, ...fcData.rows];
  const years = rows.map(r => r.year);
  const xMin = years[0], xMax = years[years.length - 1];
  const sx = y => pL + (y - xMin) / (xMax - xMin) * (W - pL - pR);
  const prices = rows.map(r => r.price);
  const pMax = Math.max(...prices) * 1.15, pMin = Math.min(...prices) * 0.85;
  const syP = v => pT + (1 - (v - pMin) / (pMax - pMin)) * (H - pT - pB);
  const syPct = v => pT + (1 - v) * (H - pT - pB);
  let g = `<svg width="100%" viewBox="0 0 ${W} ${H}" style="display:block">`;
  // gridlines / year ticks
  years.forEach(y => { g += `<line x1="${sx(y).toFixed(0)}" y1="${pT}" x2="${sx(y).toFixed(0)}" y2="${H - pB}" stroke="#f0f3f7" stroke-width="1"/>`;
    g += `<text x="${sx(y).toFixed(0)}" y="${H - pB + 16}" text-anchor="middle" font-family="IBM Plex Mono" font-size="11" fill="#5b646e">${y}</text>`; });
  // renewable area (right axis, %)
  let ra = `M${sx(rows[0].year)},${syPct(rows[0].renewable).toFixed(1)} `;
  rows.forEach(r => ra += `L${sx(r.year).toFixed(1)},${syPct(r.renewable).toFixed(1)} `);
  ra += `L${sx(rows[rows.length - 1].year)},${H - pB} L${sx(rows[0].year)},${H - pB} Z`;
  g += `<path d="${ra}" fill="rgba(30,122,90,.08)"/>`;
  let rl = ""; rows.forEach((r, i) => rl += `${i ? "L" : "M"}${sx(r.year).toFixed(1)},${syPct(r.renewable).toFixed(1)} `);
  g += `<path d="${rl}" fill="none" stroke="#1e7a5a" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  rows.forEach(r => g += `<circle cx="${sx(r.year).toFixed(1)}" cy="${syPct(r.renewable).toFixed(1)}" r="2.4" fill="#1e7a5a"/>`);
  // price line (left axis)
  let pl = ""; rows.forEach((r, i) => pl += `${i ? "L" : "M"}${sx(r.year).toFixed(1)},${syP(r.price).toFixed(1)} `);
  g += `<path d="${pl}" fill="none" stroke="#AF0000" stroke-width="2.2"/>`;
  rows.forEach(r => { g += `<circle cx="${sx(r.year).toFixed(1)}" cy="${syP(r.price).toFixed(1)}" r="3.2" fill="#AF0000"/>`;
    g += `<text x="${sx(r.year).toFixed(1)}" y="${(syP(r.price) - 9).toFixed(1)}" text-anchor="middle" font-family="IBM Plex Mono" font-size="9.5" fill="#8a0000">${cents(r.price)}</text>`; });
  // axis labels
  g += `<text x="${pL - 6}" y="${pT + 4}" text-anchor="end" font-family="IBM Plex Mono" font-size="9" fill="#AF0000">$/kWh</text>`;
  g += `<text x="${W - pR + 6}" y="${pT + 4}" text-anchor="start" font-family="IBM Plex Mono" font-size="9" fill="#1e7a5a">%RE</text>`;
  g += `</svg>`;
  return g;
}

// ─── MOUNT / ROUTER ──────────────────────────────────────────────────────────
function loadReq() { try { const r = JSON.parse(localStorage.getItem("meridian_req")); return r; } catch (e) { return null; } }
function saveReq() { try { localStorage.setItem("meridian_req", JSON.stringify(App.req)); } catch (e) {} }

// ─── CUSTOM SITES ─────────────────────────────────────────────────────────────
// User-added candidate sites, merged into the evaluation pool alongside SITES.
function loadCustomSites() { try { return JSON.parse(localStorage.getItem("meridian_custom_sites")) || []; } catch (e) { return []; } }
function saveCustomSites() { try { localStorage.setItem("meridian_custom_sites", JSON.stringify(App.customSites || [])); } catch (e) {} }
// The full candidate pool the engine ranks against.
function pool() { return SITES.concat(App.customSites || []); }

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
// Shared across pages: a project can carry a saved Meridian deliverable whose
// requirements (power, chip, workload, region) can be loaded into the wizard.
function loadProjects() { try { return JSON.parse(localStorage.getItem("meridian_projects")) || []; } catch (e) { return []; } }

function boot() {
  App.req = Object.assign({}, DEFAULT_REQ, loadReq() || {});
  App.customSites = loadCustomSites();
  // deep-link handling
  const qs = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  const deepSite = qs.get("site");
  const legacyMw = hash.get("mw") || qs.get("mw");
  const legacyClimate = hash.get("climate") || qs.get("climate");
  const legacyLoc = hash.get("loc") || qs.get("loc");

  if (legacyMw) App.req.powerMW = Math.max(1, Math.round(parseFloat(legacyMw)));
  if (deepSite) {
    App.selectedId = deepSite; App.req._done = true; renderResults();
    return;
  }
  if (legacyLoc || legacyMw) {
    // came from site-selection: preselect the matching site, go to results
    const match = SITES.find(s => legacyLoc && (s.addr === legacyLoc || legacyLoc.includes(s.name)));
    if (match) App.selectedId = match.id;
    App.req._done = true; renderResults(); return;
  }
  if (App.req._done && loadReq()) { renderResults(); return; }
  renderWizard();
}

// ─── REGION-STEP EXTRAS: load-from-project + add-a-site ──────────────────────
const CLIMATES = ["cold_dry", "temperate", "hot_dry", "hot_humid"];
const SITE_REGIONS = REGIONS.filter(r => r !== "any");

// A user-typed address still has to land in a power region — the engine prices
// energy, grid reliability, water and supply off REGION_POWER[state]. Read the
// region out of the address (region name, or its postal code), else fall back to
// the region the wizard is targeting, else a neutral label → REGION_DEFAULT.
const REGION_CODES = { LA: "Louisiana", KY: "Kentucky", OH: "Ohio", MS: "Mississippi", AB: "Alberta, Canada" };
function regionFromAddress(addr) {
  const a = (addr || "").trim();
  if (!a) return "";
  const named = SITE_REGIONS.find(r => a.toLowerCase().includes(r.split(",")[0].toLowerCase()));
  if (named) return named;
  const coded = (a.toUpperCase().match(/\b[A-Z]{2}\b/g) || []).map(c => REGION_CODES[c]).find(Boolean);
  return coded || "";
}

function regionExtras() {
  const projects = loadProjects().filter(p => p.deliverable);
  const projOpts = projects.length
    ? `<select id="wz-proj">${projects.map(p => `<option value="${p.id}">${esc(p.name)} · ${p.deliverable.powerMW} MW · ${p.deliverable.chip}</option>`).join("")}</select>
       <button class="wz-btn-sm" onclick="Wizard.loadProject()">Load requirements →</button>`
    : `<div style="font-size:12px;color:var(--faint)">No saved deliverables yet. In <b>Meridian</b>, open <b>Deliverables</b> and choose <b>Save to project</b>.</div>`;

  const custom = App.customSites || [];
  const siteList = custom.length
    ? `<div class="wz-sitelist">${custom.map(s => `<div class="wz-siterow"><span class="nm">${esc(s.name)}</span><span class="meta">${esc(s.addr)} · ${s.mwNum} MW</span><button class="x" title="Remove" onclick="Wizard.removeSite('${s.id}')">✕</button></div>`).join("")}</div>`
    : "";

  return `<div class="wz-extras">
    <div class="wz-extra">
      <div class="wz-extra-h">Pull requirements from Meridian</div>
      <div class="wz-extra-sub">Load a saved deliverable's power, chip, workload &amp; region into this analysis.</div>
      ${projOpts}
    </div>
    <div class="wz-extra">
      <div class="wz-extra-h">Add your own site</div>
      <div class="wz-extra-sub">Drop a candidate straight into the pipeline — it's ranked alongside the tracked sites.</div>
      ${siteList}
      <button class="wz-btn-ghost" onclick="Wizard.toggleAddSite()">+ Add a site</button>
      <div class="wz-addsite" id="wz-addsite" style="display:none">
        <div class="wz-field"><label>Site name</label><input id="as-name" type="text" placeholder="e.g. Riverbend Campus"></div>
        <div class="wz-field"><label>Full address</label><input id="as-addr" type="text" placeholder="e.g. 501 Denim Way, Madison County MS 39110"></div>
        <div class="wz-field-row">
          <div class="wz-field"><label>Power (MW)</label><input id="as-mw" type="number" min="1" step="5" placeholder="e.g. 100"></div>
          <div class="wz-field"><label>Climate</label><select id="as-climate">${CLIMATES.map(c => `<option value="${c}">${CLIMATE_LABEL[c]}</option>`).join("")}</select></div>
        </div>
        <button class="wz-btn-sm" onclick="Wizard.addSite()">Add to pipeline</button>
      </div>
    </div>
  </div>`;
}

// ─── WIZARD RENDER ───────────────────────────────────────────────────────────
function renderWizard() {
  App.view = "wizard";
  const main = document.getElementById("main");
  const step = WIZARD[App.step];
  const total = WIZARD.length;
  const progress = ((App.step) / total) * 100;
  const cur = App.req[step.key];

  let control = "";
  if (step.type === "options") {
    control = `<div class="wz-options ${step.cols || ""}">` + step.opts().map(o =>
      `<button class="opt ${cur === o.v ? "on" : ""}" onclick="Wizard.pick('${step.key}',${JSON.stringify(o.v).replace(/"/g, "&quot;")})">
        <div class="ot">${esc(o.t)}${o.badge ? `<span class="obadge">${o.badge}</span>` : ""}</div><div class="ots">${esc(o.s)}</div></button>`).join("") + `</div>`;
  } else if (step.type === "chips") {
    control = `<div class="wz-options two">` + Object.keys(CHIPS).map(k => {
      const c = CHIPS[k];
      return `<button class="opt ${cur === k ? "on" : ""}" onclick="Wizard.pick('chip','${k}')">
        <div class="ot">${esc(c.n)}${c.st === "road" ? `<span class="obadge">roadmap</span>` : c.ver ? `<span class="obadge">verified</span>` : ""}</div>
        <div class="ots">${c.kw} kW/rack · ${c.tf} TFLOPS · ${c.lead} lead</div></button>`;
    }).join("") + `</div>`;
  } else if (step.type === "slider") {
    const val = cur != null ? cur : step.min;
    const disp = step.pctScale ? Math.round(val) : val;
    control = `<div class="wz-slider">
      <div class="val" id="wz-sval">${step.pctScale ? disp : disp}<small> ${step.unit}</small></div>
      <input type="range" min="${step.min}" max="${step.max}" step="${step.step}" value="${val}" oninput="Wizard.slide('${step.key}',this.value,${step.pctScale ? 1 : 0})">
      <div class="wz-scale">${step.scale.map(s => `<span>${s}</span>`).join("")}</div>
    </div>`;
  } else if (step.type === "number") {
    const val = cur != null ? cur : (step.presets ? step.presets[1] : step.min);
    control = `<div class="wz-number">
      <div class="wz-num-field">
        <input type="number" id="wz-num" min="${step.min}" step="${step.step}" value="${val}"
          oninput="Wizard.num('${step.key}',this.value)"><span class="wz-num-unit">${step.unit}</span>
      </div>
      ${step.presets ? `<div class="wz-presets">${step.presets.map(p => `<button class="wz-preset ${cur === p ? "on" : ""}" onclick="Wizard.setNum('${step.key}',${p})">${p} ${step.unit}</button>`).join("")}</div>` : ""}
    </div>`;
  }

  main.innerHTML = `<div class="wizard">
    <div class="wz-top"><img src="_ds/voltai-logo-red.png" alt="Voltai"><span class="eyebrow">Pipeline Analysis · Business Requirements</span></div>
    <div class="wz-progress"><i style="width:${progress}%"></i></div>
    <div class="wz-step-n">STEP ${String(App.step + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</div>
    <div class="wz-stage fade-in" id="wz-stage">
      <div class="wz-q">${step.q}</div>
      <div class="wz-sub">${step.sub}</div>
      ${control}
      ${step.key === "region" ? regionExtras() : ""}
    </div>
    <div class="wz-nav">
      ${App.step > 0 ? `<button class="btn btn-ghost" onclick="Wizard.back()"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 3 5 8l5 5"/></svg>Back</button>` : ""}
      <button class="wz-skip" onclick="Wizard.skipAll()">Skip — use smart defaults</button>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-lg" onclick="Wizard.next()">${App.step === total - 1 ? "Analyze sites" : "Continue"}
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3l5 5-5 5"/></svg></button>
    </div>
  </div>`;
}

const Wizard = {
  pick(key, v) { App.req[key] = v; saveReq(); if (App.step < WIZARD.length - 1) setTimeout(() => this.next(), 160); else renderWizard(); },
  slide(key, v, isPct) { App.req[key] = isPct ? parseFloat(v) / 100 : parseFloat(v); const el = document.getElementById("wz-sval"); const step = WIZARD[App.step]; if (el) el.innerHTML = `${isPct ? Math.round(v) : v}<small> ${step.unit}</small>`; saveReq(); },
  num(key, v) { let n = parseFloat(v); if (isNaN(n)) return; App.req[key] = n; saveReq(); document.querySelectorAll(".wz-preset").forEach(b => b.classList.remove("on")); },
  setNum(key, v) { App.req[key] = v; saveReq(); const inp = document.getElementById("wz-num"); if (inp) inp.value = v; document.querySelectorAll(".wz-preset").forEach(b => b.classList.toggle("on", parseFloat(b.textContent) === v)); },
  next() { if (App.step < WIZARD.length - 1) { App.step++; renderWizard(); } else { this.finish(); } },
  back() { if (App.step > 0) { App.step--; renderWizard(); } },
  skipAll() { App.req = Object.assign({}, DEFAULT_REQ, App.req); this.finish(); },
  finish() { App.req._done = true; saveReq(); renderAnalyzing(); },

  // ── add a custom site ──
  toggleAddSite() { const el = document.getElementById("wz-addsite"); if (el) el.style.display = el.style.display === "none" ? "grid" : "none"; },
  addSite() {
    const val = id => (document.getElementById(id) || {}).value;
    const name = (val("as-name") || "").trim();
    const addr = (val("as-addr") || "").trim();
    const mwNum = parseFloat(val("as-mw"));
    const climate = val("as-climate");
    if (!name) { alert("Give the site a name."); return; }
    if (!addr) { alert("Enter the site's full address."); return; }
    if (isNaN(mwNum) || mwNum <= 0) { alert("Enter the site's power in MW."); return; }
    const state = regionFromAddress(addr)
      || (App.req.region && App.req.region !== "any" ? App.req.region : "Other region");
    const site = {
      id: "custom-" + Date.now().toString(36), name, addr, stage: "Custom", state,
      mw: mwNum + " MW", mwNum, size: "—", acres: null, type: "User-added", price: "TBD", priceNum: null,
      contact: "", utility: "", climate, lat: null, lng: null, approx: true,
      notes: "User-added candidate site.", custom: true,
    };
    App.customSites = (App.customSites || []).concat(site);
    saveCustomSites();
    renderWizard();
  },
  removeSite(id) { App.customSites = (App.customSites || []).filter(s => s.id !== id); saveCustomSites(); renderWizard(); },

  // ── load requirements from a saved Meridian deliverable ──
  loadProject() {
    const sel = document.getElementById("wz-proj");
    if (!sel) return;
    const proj = loadProjects().find(p => p.id === sel.value);
    if (!proj || !proj.deliverable) return;
    const d = proj.deliverable;
    App.req.powerMW = d.powerMW || App.req.powerMW;
    App.req.chip = CHIPS[d.chip] ? d.chip : App.req.chip;
    if (d.workload) App.req.workload = d.workload;
    // Pull the region straight from the Meridian deliverable: prefer an explicit
    // region, else infer it from the analyzed site's state, else leave it open.
    const delRegion = REGIONS.includes(d.region) ? d.region
      : (d.site && REGIONS.includes(d.site.state)) ? d.site.state
      : "any";
    App.req.region = delRegion;
    // add the analyzed site as a candidate if it isn't already there
    if (d.site && d.site.name && !(App.customSites || []).some(s => s.name === d.site.name)) {
      App.customSites = (App.customSites || []).concat(Object.assign({
        id: "proj-" + proj.id, stage: "From Meridian", type: "Meridian deliverable",
        addr: d.site.addr || d.location || d.site.state || "Location TBD",
        size: "—", acres: null, price: "TBD", priceNum: null, contact: "", lat: null, lng: null,
        approx: true, notes: "Loaded from Meridian deliverable “" + proj.name + "”.", custom: true,
      }, d.site));
      saveCustomSites();
    }
    saveReq();
    this.finish();
  },
};

// ─── ANALYZING (skeleton) ────────────────────────────────────────────────────
function renderAnalyzing() {
  App.view = "analyzing";
  const main = document.getElementById("main");
  const steps = ["Scanning candidate pipeline", "Simulating power envelope (19 checks)", "Modeling CAPEX / OPEX / TCO", "Scoring AI-factory readiness", "Ranking & generating recommendation"];
  main.innerHTML = `<div class="analyzing">
    <div class="spinner"></div>
    <h2>Analyzing ${pool().length} candidate sites</h2>
    <div class="eyebrow">Matching your requirements against the pipeline</div>
    <div class="steps">${steps.map((s, i) => `<div class="astep" id="as-${i}"><span class="ai"></span>${s}</div>`).join("")}</div>
  </div>`;
  let i = 0;
  const tick = () => {
    if (i > 0) { const p = document.getElementById("as-" + (i - 1)); if (p) p.classList.add("done"); }
    const el = document.getElementById("as-" + i); if (el) el.classList.add("on");
    i++;
    if (i <= steps.length) setTimeout(tick, 340);
    else setTimeout(() => renderResults(), 260);
  };
  setTimeout(tick, 200);
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────
function computeRec() {
  App.rec = recommend(App.req, pool());
  App.evals = rank(pool(), App.req, App.objective);
  if (!App.selectedId) App.selectedId = App.rec.top.site.id;
}
function evalById(id) { return App.rec.all.find(e => e.site.id === id) || evaluate(pool().find(s => s.id === id), App.req); }

function renderResults() {
  App.view = "results";
  if (!App.req._done) App.req._done = true;
  computeRec();
  const heroEval = evalById(App.selectedId);
  const main = document.getElementById("main");
  main.innerHTML = `<div class="wrap fade-in">
    ${topbar()}
    ${heroSection(heroEval)}
    ${xaiSection(heroEval)}
    ${readinessSection(heroEval)}
    ${financialSection(heroEval)}
    ${candidatesSection()}
    ${compareSection()}
    ${forecastSection(heroEval)}
    <div style="margin-top:40px;text-align:center;color:var(--faint);font-size:11px;font-family:var(--m)">
      MODELED · NOT MEASURED · PRE-ENGINEERING — figures are planning estimates from the Pipeline Analysis engine. © Voltai Inc. 2026
    </div>
  </div>`;
  window.scrollTo({ top: 0 });
}

function topbar() {
  const r = App.req;
  const chipsHtml = [
    ["Region", r.region === "any" ? "Any" : r.region],
    ["Power", r.powerMW + " MW"],
    ["Platform", CHIPS[r.chip] ? r.chip : "—"],
    ["Workload", { train: "Training", infer: "Inference", mix: "Mixed" }[r.workload]],
    ["Sustainability", pct(r.sustainability)],
  ].map(([k, v]) => `<span class="chip"><span class="k">${k}</span><b>${esc(v)}</b></span>`).join("");
  return `<div class="topbar">
    <div class="title"><span class="eyebrow">AI Factory Site Intelligence</span><h1>Your recommendation</h1></div>
    <div class="req-chips">${chipsHtml}</div>
    <button class="btn btn-ghost" onclick="Results.editReq()"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M11 2l3 3-8 8-4 1 1-4z"/></svg>Edit requirements</button>
  </div>`;
}

function heroSection(e) {
  const s = e.site, fin = e.fin;
  const v = validate(e.confirmedMW, App.req, s.climate);
  const exp = explain(e, App.rec.all);
  const isTop = App.rec.top.site.id === s.id;
  const rankN = App.rec.all.findIndex(x => x.site.id === s.id) + 1;
  const badge = isTop
    ? `<span class="badge-rec"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 1.5 10 6l4.5.4-3.4 3 1 4.4L8 11.6 3.9 13.8l1-4.4L1.5 6.4 6 6z"/></svg>Recommended Site</span>`
    : `<span class="badge-rec" style="background:var(--sunken);color:var(--muted);border-color:var(--border)">Selected · Rank #${rankN} of ${App.rec.all.length}</span>`;
  const topNote = isTop ? "" : `<div style="margin-top:10px;font-size:12.5px;color:var(--muted)">Your top-ranked site is <b style="color:var(--red-deep);cursor:pointer" onclick="Results.selectSite('${App.rec.top.site.id}')">${esc(App.rec.top.site.name)}</b> (${App.rec.top.score}/100). <span style="cursor:pointer;text-decoration:underline" onclick="Results.selectSite('${App.rec.top.site.id}')">View →</span></div>`;
  return `<section class="hero fade-in">
    <div class="hero-grid">
      <div>
        ${badge}
        <h1>${esc(s.name)}</h1>
        <div class="loc"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1.5c-2.5 0-4.5 2-4.5 4.5 0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5Z"/><circle cx="8" cy="6" r="1.6"/></svg>${esc(s.addr)}</div>
        <p class="hero-explain">${exp.why.replace(/(\d+\/100|\d+% confidence)/g, "<b>$1</b>")}</p>${topNote}
        <div class="hero-cta">
          <a class="btn btn-primary btn-lg" href="${twinLink(e)}">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 1.5 14 5v6l-6 3.5L2 11V5z"/><path d="M8 8 14 5M8 8 2 5M8 8v6.5"/></svg>Open in Digital Twin</a>
          <a class="btn btn-ghost btn-lg" href="${fullAnalysisLink(e)}">View full analysis</a>
          <button class="btn btn-ghost btn-lg" onclick="Results.addCompare('${s.id}');document.getElementById('sec-compare').scrollIntoView({behavior:'smooth'})">Compare</button>
        </div>
      </div>
      <div class="ring-wrap">
        ${scoreRing(e.score)}
        <div class="conf-badge"><span class="cdot"></span>${e.confidence}% AI confidence</div>
        ${verdictPill(v.rep.verdict)}
      </div>
    </div>
    <div class="hero-kpis">
      ${heroKpi("Est. CAPEX", fmM(fin.totalCapex), fm(fin.costPerMW) + "/MW")}
      ${heroKpi("Est. OPEX", fmM(fin.opex) + "<small>/yr</small>", cents(e.region.price) + "/kWh")}
      ${heroKpi("Risk level", `<span class="pill ${riskClass(e.risk)}" style="font-size:14px;padding:3px 10px">${e.risk}</span>`, "execution risk")}
      ${heroKpi("Expandability", Math.round(e.expandability) + "<small>/100</small>", s.mwCeil ? "to " + s.mwCeil + "+ MW" : "phase-2 headroom")}
      ${heroKpi("Sustainability", e.sustainability + "<small>/100</small>", "PUE " + fin.pue.toFixed(2))}
    </div>
  </section>`;
}
function heroKpi(l, v, s) { return `<div class="k"><div class="kv">${v}</div><div class="kl">${l}</div>${s ? `<div class="kl" style="text-transform:none;letter-spacing:0;color:var(--muted);font-size:10.5px">${s}</div>` : ""}</div>`; }

// ─── EXPLAINABLE AI ──────────────────────────────────────────────────────────
function xaiSection(e) {
  const exp = explain(e, App.rec.all);
  const tabs = [["why", "Why this site"], ["whynot", "Why not others"], ["risks", "Risks"], ["assumptions", "Assumptions"], ["improve", "Improve score"]];
  const body = {
    why: `<div class="xai-list">${exp.drivers.map(d => `<div class="item"><span class="mk pos">+</span><div><b>${e.readiness.label[d.k] || d.k}</b> — scoring ${Math.round(d.score)}/100, one of the strongest contributors to this recommendation.</div></div>`).join("")}
      <div class="item"><span class="mk neu">≡</span><div>${esc(exp.why)}</div></div></div>`,
    whynot: `<div class="xai-list">${exp.whyNot.map(w => `<div class="item"><span class="mk neg">−</span><div>${esc(w)}</div></div>`).join("")}</div>`,
    risks: `<div class="xai-list">${exp.risks.map(w => `<div class="item"><span class="mk neg">!</span><div>${esc(w)}</div></div>`).join("")}</div>`,
    assumptions: `<div class="xai-list">${exp.assumptions.map(w => `<div class="item"><span class="mk neu">·</span><div>${esc(w)}</div></div>`).join("")}</div>`,
    improve: `<div class="xai-list">${exp.improve.map(w => `<div class="item"><span class="mk imp">↑</span><div>${esc(w)}</div></div>`).join("")}</div>`,
  };
  return `<section class="section" id="sec-xai">
    <div class="section-head"><span class="idx">01</span><h2>Explainable recommendation</h2><span class="eyebrow">no black-box scoring</span></div>
    <div class="card">
      <div style="padding:16px 22px 0"><div class="xai-tabs">${tabs.map(([k, l]) => `<button class="${App.xaiTab === k ? "on" : ""}" onclick="Results.xai('${k}')">${l}</button>`).join("")}</div></div>
      <div class="xai-body">${body[App.xaiTab]}</div>
    </div>
  </section>`;
}

// ─── READINESS ───────────────────────────────────────────────────────────────
function readinessSection(e) {
  const rd = e.readiness;
  return `<section class="section" id="sec-readiness">
    <div class="section-head"><span class="idx">02</span><h2>AI Factory Readiness</h2><span class="eyebrow">9-dimension scorecard</span></div>
    <div class="readiness-grid">
      <div class="card radar-card">
        <div class="radar-score"><div class="v">${Math.round(rd.overall)}</div><div class="l">Readiness Score</div></div>
        ${radarChart(rd)}
      </div>
      <div class="card" style="padding:20px"><div class="cat-list">${rd.order.map(k => {
        const c = rd.cat[k];
        return `<div class="cat"><div class="top"><span class="nm">${rd.label[k]}</span><span class="sc">${Math.round(c.score)}</span></div>
          <div class="bar"><i style="width:${c.score}%"></i></div><div class="nt">${esc(c.note)}</div></div>`;
      }).join("")}</div></div>
    </div>
  </section>`;
}

// ─── FINANCIAL ───────────────────────────────────────────────────────────────
function financialSection(e) {
  const f = e.fin;
  const kpis = [
    ["CAPEX", fmM(f.totalCapex), `${fm(f.gpuCapex)} GPUs + ${fm(f.facCapex)} facility`, "accent"],
    ["OPEX / year", fmM(f.opex), "energy + staff + maintenance", ""],
    ["5-year TCO", fmM(f.tco5), "capex + 5y operating", ""],
    ["10-year TCO", fmM(f.tco10), "with year-5 GPU refresh", ""],
    ["ROI (NPV/CAPEX)", pct(f.roi), `IRR ${pct(f.irr)}`, "accent"],
    ["Cost per MW", fm(f.costPerMW), "all-in built cost", ""],
    ["Cost per GPU", fm(f.costPerGPU), `${fc(f.gpus)} GPUs · ${fc(f.racks)} racks`, ""],
    ["Cost / training-hr", "$" + f.costPerTrainHour.toFixed(2), "annualized, per GPU-hour", ""],
    ["Annual energy", fmM(f.energySpend), `${cents(e.region.price)}/kWh · PUE ${f.pue.toFixed(2)}`, ""],
  ];
  return `<section class="section" id="sec-financial">
    <div class="section-head"><span class="idx">03</span><h2>Financial Intelligence</h2><span class="eyebrow">${e.confirmedMW} MW · ${CHIPS[App.req.chip].n}</span></div>
    <div class="kpi-grid">${kpis.map(([l, v, s, cls]) => `<div class="card kpi ${cls}"><div class="kl">${l}</div><div class="kv">${v}</div><div class="ks">${esc(s)}</div></div>`).join("")}</div>
  </section>`;
}

// ─── CANDIDATES ──────────────────────────────────────────────────────────────
function candidatesSection() {
  const objs = OBJECTIVES;
  let evals = App.evals;
  if (App.surfaceIds && App.surfaceIds.length) {
    const set = new Set(App.surfaceIds);
    evals = evals.slice().sort((a, b) => (set.has(b.site.id) ? 1 : 0) - (set.has(a.site.id) ? 1 : 0));
  }
  const surfacing = App.surfaceIds && App.surfaceIds.length && App.surfaceIds.length < pool().length;
  return `<section class="section" id="sec-candidates">
    <div class="section-head"><span class="idx">04</span><h2>Ranked candidate sites</h2><span class="spacer"></span></div>
    <div class="cand-toolbar">
      <span class="eyebrow" style="margin-right:2px">Optimize for</span>
      <div class="seg">${Object.keys(objs).map(k => `<button class="${App.objective === k ? "on" : ""}" onclick="Results.setObjective('${k}')">${objs[k].label}</button>`).join("")}</div>
      ${surfacing ? `<span class="chip" style="background:var(--red-tint);border-color:#f2d9d9;color:var(--red-deep)">Copilot filter · ${App.surfaceIds.length} sites<span style="margin-left:6px;cursor:pointer;font-weight:700" onclick="Results.clearSurface()">✕</span></span>` : ""}
    </div>
    <div class="cand-grid">${evals.map((e, i) => candCard(e, i)).join("")}</div>
  </section>`;
}
function candCard(e, i) {
  const s = e.site, sel = App.selectedId === s.id, inCmp = App.compareSet.includes(s.id);
  return `<div class="card cand ${sel ? "sel" : ""}" onclick="Results.selectSite('${s.id}')">
    <span class="rankbadge">#${i + 1}</span>
    <div class="chd"><div class="miniring">${miniRing(e.score)}</div>
      <div style="min-width:0"><div class="nm">${esc(s.name)}</div><div class="st">${esc(s.addr)} · ${s.stage} · ${esc(s.mw)}</div></div></div>
    <div class="metrics">
      <div class="met"><span class="ml">Confidence</span><span class="mv">${e.confidence}%</span></div>
      <div class="met"><span class="ml">Cost / MW</span><span class="mv">${fm(e.fin.costPerMW)}</span></div>
      <div class="met"><span class="ml">Risk</span><span class="mv"><span class="pill ${riskClass(e.risk)}">${e.risk}</span></span></div>
      <div class="met"><span class="ml">Power</span><span class="mv">${Math.round(e.comp.power)}/100</span></div>
      <div class="met"><span class="ml">Climate</span><span class="mv">${Math.round(e.comp.cooling)}/100</span></div>
    </div>
    <div class="cta-row" onclick="event.stopPropagation()">
      <label class="cmpbox"><input type="checkbox" ${inCmp ? "checked" : ""} onchange="Results.toggleCompare('${s.id}',this.checked)">Compare</label>
      <span class="spacer" style="flex:1"></span>
      <a class="btn btn-ghost" style="padding:5px 11px;font-size:11.5px" href="${fullAnalysisLink(e)}">Analyze →</a>
    </div>
  </div>`;
}

// ─── COMPARE ─────────────────────────────────────────────────────────────────
function compareSection() {
  const ids = App.compareSet;
  let inner;
  if (ids.length < 2) {
    inner = `<div class="cmp-panel" style="color:var(--muted);font-size:13.5px">Select <b>2–3 sites</b> using the “Compare” checkboxes above to see a side-by-side breakdown and a plain-language tradeoff analysis.</div>`;
  } else {
    const evals = ids.map(evalById);
    const rows = [
      ["Overall score", e => e.score, true, e => e.score + "/100"],
      ["AI confidence", e => e.confidence, true, e => e.confidence + "%"],
      ["Cost / MW", e => -e.fin.costPerMW, true, e => fm(e.fin.costPerMW)],
      ["Total CAPEX", e => -e.fin.totalCapex, false, e => fmM(e.fin.totalCapex)],
      ["OPEX / yr", e => -e.fin.opex, false, e => fmM(e.fin.opex)],
      ["10-yr TCO", e => -e.fin.tco10, true, e => fmM(e.fin.tco10)],
      ["ROI", e => e.fin.roi, true, e => pct(e.fin.roi)],
      ["Risk", e => -e.riskScore, true, e => e.risk],
      ["Readiness", e => e.readiness.overall, true, e => Math.round(e.readiness.overall) + "/100"],
      ["Sustainability", e => e.sustainability, true, e => e.sustainability + "/100"],
      ["Power / kWh", e => -e.region.price, false, e => cents(e.region.price)],
    ];
    // pairwise tradeoff narrative (top two by score)
    const sorted = evals.slice().sort((a, b) => b.score - a.score);
    const td = tradeoff(sorted[0], sorted[1]);
    const th = `<th></th>` + evals.map(e => `<th>${esc(e.site.name)}<br><span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">${esc(e.site.addr)}</span></th>`).join("");
    const body = rows.map(([label, keyFn, higherBetter, fmt]) => {
      const vals = evals.map(keyFn);
      const best = Math.max(...vals);
      return `<tr><td class="rl">${label}</td>` + evals.map((e, i) => `<td><span class="v ${vals[i] === best && evals.length > 1 ? "best" : ""}">${fmt(e)}</span></td>`).join("") + `</tr>`;
    }).join("");
    inner = `<div class="cmp-panel">
      <div class="cmp-natural"><b>AI tradeoff:</b> ${esc(td.summary)}</div>
      <div class="cmp-scroll"><table class="cmp-table"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div>
    </div>`;
  }
  return `<section class="section" id="sec-compare">
    <div class="section-head"><span class="idx">05</span><h2>AI tradeoff comparison</h2><span class="eyebrow">${ids.length}/3 selected</span>
      ${ids.length ? `<span class="spacer"></span><button class="btn btn-ghost" style="padding:6px 12px" onclick="Results.clearCompare()">Clear</button>` : ""}</div>
    <div class="card">${inner}</div>
  </section>`;
}

// ─── FORECAST ────────────────────────────────────────────────────────────────
function forecastSection(e) {
  const fcData = forecast(e.site);
  const row = fcData.rows.find(r => r.year === App.fcYear) || fcData.rows[1];
  const base = regionPower(e.site.state);
  const dPrice = ((row.price - base.price) / base.price * 100);
  const metrics = [
    ["Electricity price", cents(row.price), `${dPrice >= 0 ? "+" : ""}${dPrice.toFixed(0)}% vs 2026`],
    ["Renewable share", pct(row.renewable), `from ${pct(base.renewable)} today`],
    ["Grid availability", pct(row.gridAvail), `congestion index ${pct(row.congestion)}`],
    ["Construction congestion", pct(row.construction), "regional build pressure"],
    ["Regulatory outlook", pct(row.regulatory), row.regulatory >= 0.6 ? "favorable" : "tightening"],
    ["Expansion opportunity", pct(row.expansion), "phase-2 headroom"],
  ];
  return `<section class="section" id="sec-forecast">
    <div class="section-head"><span class="idx">06</span><h2>Future forecast</h2><span class="eyebrow">${esc(e.site.state)}</span>
      <span class="spacer"></span><div class="seg">${FORECAST_YEARS.map(y => `<button class="${App.fcYear === y ? "on" : ""}" onclick="Results.setYear(${y})">${y}</button>`).join("")}</div></div>
    <div class="card fc-body">
      <div class="fc-grid">
        <div>${forecastChart(fcData, e.site)}<div class="fc-note">${esc(fcData.note)}</div></div>
        <div class="fc-metrics">${metrics.map(([l, v, d]) => `<div class="fc-m"><div class="fl">${l}</div><div class="fv">${v}</div><div class="fd">${esc(d)}</div></div>`).join("")}</div>
      </div>
    </div>
  </section>`;
}

// ─── DEEP LINKS ──────────────────────────────────────────────────────────────
function fullAnalysisLink(e) {
  const s = e.site;
  const p = new URLSearchParams({ mode: "2", demo: "0", mw: s.mwNum || App.req.powerMW, loc: s.addr, utility: s.utility || "Utility TBD", climate: s.climate });
  return "site-intelligence.html#" + p.toString();
}

// ─── RESULTS INTERACTIONS ────────────────────────────────────────────────────
const Results = {
  editReq() { App.step = 0; renderWizard(); },
  xai(k) { App.xaiTab = k; const e = evalById(App.selectedId); document.getElementById("sec-xai").outerHTML = xaiSection(e); },
  setObjective(k) { App.objective = k; App.surfaceIds = null; App.evals = rank(pool(), App.req, k); document.getElementById("sec-candidates").outerHTML = candidatesSection(); },
  clearSurface() { App.surfaceIds = null; document.getElementById("sec-candidates").outerHTML = candidatesSection(); },
  selectSite(id) {
    App.selectedId = id; renderResults();
  },
  toggleCompare(id, on) {
    if (on) { if (!App.compareSet.includes(id) && App.compareSet.length < 3) App.compareSet.push(id); }
    else App.compareSet = App.compareSet.filter(x => x !== id);
    document.getElementById("sec-compare").outerHTML = compareSection();
    document.getElementById("sec-candidates").outerHTML = candidatesSection();
  },
  addCompare(id) { if (!App.compareSet.includes(id) && App.compareSet.length < 3) App.compareSet.push(id); document.getElementById("sec-compare").outerHTML = compareSection(); document.getElementById("sec-candidates").outerHTML = candidatesSection(); },
  clearCompare() { App.compareSet = []; document.getElementById("sec-compare").outerHTML = compareSection(); document.getElementById("sec-candidates").outerHTML = candidatesSection(); },
  setYear(y) { App.fcYear = y; const e = evalById(App.selectedId); document.getElementById("sec-forecast").outerHTML = forecastSection(e); },
};

// ─── COPILOT ─────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Find locations supporting a 100 MW AI factory",
  "Compare Louisiana and Ohio",
  "Show regions under $0.08/kWh",
  "Which sites support GB300 deployment",
  "Minimize carbon footprint",
  "Show lowest-risk locations",
];
const Copilot = {
  msgs: [],
  open() {
    document.getElementById("copilot").classList.add("on");
    document.getElementById("cp-backdrop").classList.add("on");
    document.getElementById("cp-fab").style.display = "none";
    if (!this.msgs.length) this.greet();
    setTimeout(() => document.getElementById("cp-in").focus(), 300);
  },
  close() { document.getElementById("copilot").classList.remove("on"); document.getElementById("cp-backdrop").classList.remove("on"); document.getElementById("cp-fab").style.display = ""; },
  greet() {
    const t = document.getElementById("cp-thread");
    t.innerHTML = `<div class="cp-msg bot">Ask me to filter, rank, or compare sites — the dashboard updates live. Try one of these:</div>
      <div class="cp-suggest">${SUGGESTIONS.map(s => `<button onclick="Copilot.ask('${s.replace(/'/g, "\\'")}')">${s}</button>`).join("")}</div>`;
  },
  bubble(cls, text) {
    const t = document.getElementById("cp-thread");
    const d = document.createElement("div"); d.className = "cp-msg " + cls; d.textContent = text; t.appendChild(d); t.scrollTop = t.scrollHeight; return d;
  },
  ask(q) { document.getElementById("cp-in").value = q; this.send(); },
  send() {
    const inp = document.getElementById("cp-in"); const text = inp.value.trim(); if (!text) return;
    inp.value = ""; this.bubble("user", text);
    const sug = document.querySelector(".cp-suggest"); if (sug) sug.remove();
    // local deterministic reasoning drives the dashboard
    const res = copilot(text, App.req, pool());
    this.apply(res);
    const b = this.bubble("bot", res.answer);
    const actLabel = { filter: "Filtered candidates", sort: "Re-ranked candidates", compare: "Opened comparison", recommend: "Updated recommendation" }[res.action];
    if (actLabel) { const a = document.createElement("span"); a.className = "act"; a.textContent = "→ " + actLabel + " on the dashboard"; b.appendChild(a); }
    this.msgs.push({ role: "user", content: text });
    // optional richer prose via Claude if a key is set
    if (this.getKey()) this.enrich(text, res);
  },
  apply(res) {
    App.req._done = true;
    if (res.action === "compare" && res.sites) { App.compareSet = res.sites.slice(0, 3); App.surfaceIds = null; }
    else if (res.action === "sort" && res.objective) { App.objective = res.objective; App.surfaceIds = null; if (res.sites && res.sites[0]) App.selectedId = res.sites[0]; }
    else if (res.action === "filter" && res.sites) {
      App.objective = "balanced";
      App.surfaceIds = res.sites.length < pool().length ? res.sites : null;
      if (res.sites[0]) App.selectedId = res.sites[0];
    } else if (res.action === "recommend") {
      App.surfaceIds = null; App.selectedId = App.rec ? App.rec.top.site.id : App.selectedId;
    }
    renderResults();
    if (res.action === "compare") setTimeout(() => { const el = document.getElementById("sec-compare"); if (el) el.scrollIntoView({ behavior: "smooth" }); }, 120);
    else setTimeout(() => { const el = document.getElementById("sec-candidates"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 120);
  },
  getKey() { return localStorage.getItem("anthropic_key") || ""; },
  saveKey() { const v = document.getElementById("cp-keyin").value.trim(); if (v) { localStorage.setItem("anthropic_key", v); document.getElementById("cp-key").classList.remove("on"); this.bubble("bot", "API key saved (this browser only). I'll add richer explanations to my answers."); } },
  async enrich(text, res) {
    const pending = this.bubble("bot", "…");
    const ctx = App.rec.all.slice(0, 6).map(e => `${e.site.name} (${e.site.state}): score ${e.score}, conf ${e.confidence}%, ${cents(e.region.price)}/kWh, risk ${e.risk}, ${fmM(e.fin.totalCapex)} capex, ${e.ttfr.mo}mo`).join("; ");
    const SYSTEM = `You are the Pipeline Analysis copilot for Voltai. You help plan AI factory locations from a fixed candidate pipeline. Be concise (2-4 sentences), quantitative, and decision-oriented. The deterministic engine already updated the dashboard: ${res.answer}. Current top sites: ${ctx}. Do not invent sites outside this list.`;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "content-type": "application/json", "x-api-key": this.getKey(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-opus-4-8", max_tokens: 400, system: SYSTEM, messages: [{ role: "user", content: text }] }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error?.message || ("HTTP " + r.status));
      const reply = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n") || "(no reply)";
      pending.textContent = reply;
    } catch (e) { pending.className = "cp-msg bot"; pending.textContent = "(Local reasoning shown above. Claude enrichment unavailable: " + e.message + ")"; }
  },
};
document.getElementById("cp-in").addEventListener("keydown", e => { if (e.key === "Enter") Copilot.send(); });

// ─── GO ──────────────────────────────────────────────────────────────────────
boot();
