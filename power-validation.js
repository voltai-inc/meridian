/* Voltai — workload power validation engine.
   Shared by power-signoff.html (full UI) and site-intelligence.html (inline validation).
   DOM-free; mirrors the Python power_signoff package. */
/* Workload Power Validation - JS engine (mirrors the Python power_signoff package).
   Kept DOM-free so it can be unit-tested under node. */
"use strict";

// ---------- tiny deterministic RNG (mulberry32) + gaussian ----------------
function makeRng(seed) {
  let a = seed >>> 0;
  const u = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare = null;
  const gauss = () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u1 = 0, u2 = 0;
    do { u1 = u(); } while (u1 <= 1e-12);
    u2 = u();
    const r = Math.sqrt(-2 * Math.log(u1));
    spare = r * Math.sin(2 * Math.PI * u2);
    return r * Math.cos(2 * Math.PI * u2);
  };
  return { uniform: u, gauss };
}

// ---------- workload traces ------------------------------------------------
function trainingTrace(cap, opts = {}) {
  const o = Object.assign({
    duration_s: 1800, dt: 0.1, iteration_period_s: 3.0, duty_cycle: 0.70,
    high_frac: 1.00, low_frac: 0.45, sync_fraction: 1.0,
    checkpoint_every_s: 1200, checkpoint_dur_s: 20, checkpoint_frac: 0.15,
    startup_ramp_s: 180, job_end_at_s: null, idle_frac: 0.10,
    noise_frac: 0.02, seed: 7,
  }, opts);
  const rng = makeRng(o.seed);
  const n = Math.floor(o.duration_s / o.dt);
  const t = new Float64Array(n), p = new Float64Array(n);
  const steady = cap * (1 - o.sync_fraction) * 0.5 * (o.high_frac + o.low_frac);
  for (let i = 0; i < n; i++) {
    const ti = i * o.dt;
    t[i] = ti;
    const phase = (ti % o.iteration_period_s) / o.iteration_period_s;
    let w = phase < o.duty_cycle ? o.high_frac : o.low_frac;
    if (ti % o.checkpoint_every_s < o.checkpoint_dur_s && ti > o.checkpoint_dur_s)
      w = o.checkpoint_frac;
    const ramp = Math.min(1, ti / o.startup_ramp_s);
    w = o.idle_frac + (w - o.idle_frac) * ramp;
    if (o.job_end_at_s !== null && ti >= o.job_end_at_s) w = o.idle_frac;
    let v = cap * o.sync_fraction * w + steady + rng.gauss() * o.noise_frac * cap;
    p[i] = Math.min(cap, Math.max(0, v));
  }
  return { t, p, dt: o.dt, name: "training", params: o };
}

function inferenceTrace(cap, opts = {}) {
  const o = Object.assign({
    duration_s: 1800, dt: 0.1, base_frac: 0.55, swing_frac: 0.20,
    demand_period_s: 900, batch_noise_frac: 0.05, seed: 11,
  }, opts);
  const rng = makeRng(o.seed);
  const n = Math.floor(o.duration_s / o.dt);
  const t = new Float64Array(n), p = new Float64Array(n);
  const alpha = Math.exp(-o.dt / 2.0);
  const sigEps = o.batch_noise_frac * Math.sqrt(1 - alpha * alpha);
  let ar = 0;
  for (let i = 0; i < n; i++) {
    const ti = i * o.dt;
    t[i] = ti;
    const demand = o.base_frac + o.swing_frac * 0.5 * (1 + Math.sin(2 * Math.PI * ti / o.demand_period_s));
    ar = alpha * ar + rng.gauss() * sigEps;
    p[i] = Math.min(cap, Math.max(0, cap * (demand + ar)));
  }
  return { t, p, dt: o.dt, name: "inference", params: o };
}

function mixedTrace(cap, opts = {}) {
  const share = opts.training_share ?? 0.6;
  const tr = trainingTrace(cap * share, opts);
  const inf = inferenceTrace(cap * (1 - share), { duration_s: opts.duration_s ?? 1800, dt: opts.dt ?? 0.1 });
  const n = Math.min(tr.p.length, inf.p.length);
  const p = new Float64Array(n);
  for (let i = 0; i < n; i++) p[i] = tr.p[i] + inf.p[i];
  return { t: tr.t.slice(0, n), p, dt: tr.dt, name: "mixed", params: opts };
}

// ---------- simulation -----------------------------------------------------
function firstOrderLag(x, dt, tau) {
  const y = new Float64Array(x.length);
  if (tau <= 0) { y.set(x); return y; }
  const a = dt / (tau + dt);
  y[0] = x[0];
  for (let i = 1; i < x.length; i++) y[i] = y[i - 1] + a * (x[i] - y[i - 1]);
  return y;
}

function chainLoads(design, pIt, pMech, share) {
  // loading recorded at each component's OUTPUT (rating convention);
  // input = output/eff becomes next upstream component's output.
  const loads = {};
  const n = pIt.length;
  let p = new Float64Array(n);
  for (let i = 0; i < n; i++) p[i] = pIt[i] * share;
  let mechAdded = false;
  const comps = design.path_components;
  for (let c = comps.length - 1; c >= 0; c--) {
    const comp = comps[c];
    if (comp.kind === "lv_switchgear" && !mechAdded) {
      for (let i = 0; i < n; i++) p[i] += pMech[i] * share;
      mechAdded = true;
    }
    loads[comp.id] = Float64Array.from(p);
    const eff = comp.efficiency ?? 1.0;
    if (eff !== 1.0) for (let i = 0; i < n; i++) p[i] /= eff;
  }
  if (!mechAdded) for (let i = 0; i < n; i++) p[i] += pMech[i] * share;
  return { loads, gridSide: p };
}

function simulate(design, trace, bessTau = 30.0) {
  const { p: pIt, dt } = trace;
  const n = pIt.length;
  const mechRaw = new Float64Array(n);
  for (let i = 0; i < n; i++)
    mechRaw[i] = design.mech_base_mw + design.mech_cooling_ratio * pIt[i];
  const pMech = firstOrderLag(mechRaw, dt, design.mech_lag_s);

  const norm = chainLoads(design, pIt, pMech, 0.5);
  const n1 = chainLoads(design, pIt, pMech, 1.0);

  const pMeter = new Float64Array(n);
  for (let i = 0; i < n; i++) pMeter[i] = 2 * norm.gridSide[i];

  const target = firstOrderLag(pMeter, dt, bessTau);
  const cap = 2 * design.bess_power_mw;
  const pBess = new Float64Array(n), pSm = new Float64Array(n);
  let clipped = false, eUsed = 0;
  for (let i = 0; i < n; i++) {
    const want = pMeter[i] - target[i];
    const b = Math.max(-cap, Math.min(cap, want));
    if (Math.abs(want) > cap + 1e-9) clipped = true;
    pBess[i] = b; pSm[i] = pMeter[i] - b;
    if (b > 0) eUsed += b * dt / 3600;
  }
  return {
    trace, design, t: trace.t, pIt, pMech, pMeter, pMeterSm: pSm, pBess,
    bessEnergyUsedMwh: eUsed, bessClipped: clipped,
    nodeNormal: norm.loads, nodeN1: n1.loads,
  };
}

// ---------- signal analysis ------------------------------------------------
function percentile(arr, q) {
  const a = Float64Array.from(arr).sort();
  const idx = Math.min(a.length - 1, Math.max(0, (q / 100) * (a.length - 1)));
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return a[lo] + (a[hi] - a[lo]) * (idx - lo);
}
const amax = (a) => { let m = -1e30; for (const v of a) if (v > m) m = v; return m; };
const amin = (a) => { let m = 1e30; for (const v of a) if (v < m) m = v; return m; };
const amean = (a) => { let s = 0; for (const v of a) s += v; return s / a.length; };

function maxRamp(p, dt, windowS = 1.0) {
  const k = Math.max(1, Math.round(windowS / dt));
  let m = 0;
  for (let i = k; i < p.length; i++) m = Math.max(m, Math.abs(p[i] - p[i - k]));
  return m / (k * dt);
}
function maxStep(p, dt, windowS = 10.0) {
  const k = Math.max(1, Math.round(windowS / dt));
  let m = 0;
  for (let i = k; i < p.length; i++) m = Math.max(m, Math.abs(p[i] - p[i - k]));
  return m;
}

// iterative radix-2 FFT (in-place, complex)
function fft(re, im, invert) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (2 * Math.PI / len) * (invert ? 1 : -1);
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1, cwi = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j], ui = im[i + j];
        const vr = re[i + j + len / 2] * cwr - im[i + j + len / 2] * cwi;
        const vi = re[i + j + len / 2] * cwi + im[i + j + len / 2] * cwr;
        re[i + j] = ur + vr; im[i + j] = ui + vi;
        re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
        const nwr = cwr * wr - cwi * wi;
        cwi = cwr * wi + cwi * wr; cwr = nwr;
      }
    }
  }
  if (invert) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

function oscillationBand(p, dt, fLo = 0.05, fHi = 1.0) {
  const n0 = p.length;
  let n = 1; while (n < n0) n <<= 1;
  const mean = amean(p);
  const re = new Float64Array(n), im = new Float64Array(n);
  const reW = new Float64Array(n), imW = new Float64Array(n);
  for (let i = 0; i < n0; i++) {
    const x = p[i] - mean;
    re[i] = x;
    reW[i] = x * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n0 - 1))); // hann over data
  }
  fft(reW, imW, false);
  const df = 1 / (n * dt);
  let domF = 0, best = -1;
  const kLo = Math.ceil(fLo / df), kHi = Math.floor(fHi / df);
  for (let k = kLo; k <= Math.min(kHi, n / 2); k++) {
    const mag = reW[k] * reW[k] + imW[k] * imW[k];
    if (mag > best) { best = mag; domF = k * df; }
  }
  if (best < 0) return { domFreq: 0, p2p: 0 };
  // band-pass raw signal: zero out-of-band bins (keep conjugate symmetry), invert
  fft(re, im, false);
  for (let k = 0; k <= n / 2; k++) {
    const f = k * df;
    if (f < fLo || f > fHi) {
      re[k] = im[k] = 0;
      if (k > 0 && k < n / 2) { re[n - k] = im[n - k] = 0; }
    } else if (k > 0 && k < n / 2) {
      // keep mirror as-is (it is within band by symmetry)
    }
  }
  fft(re, im, true);
  const lo = Math.floor(n0 / 10), hi = n0 - Math.floor(n0 / 10);
  let mx = -1e30, mn = 1e30;
  for (let i = lo; i < hi; i++) { if (re[i] > mx) mx = re[i]; if (re[i] < mn) mn = re[i]; }
  return { domFreq: domF, p2p: mx - mn };
}

// ---------- checks ---------------------------------------------------------
function runChecks(sim, site) {
  const d = sim.design, dt = sim.trace.dt;
  const checks = [];
  const stat = (loading, warnAt, failAt = 1.0) =>
    loading > failAt ? "FAIL" : loading > warnAt ? "WARN" : "PASS";

  const compCheck = (comp, series, label, detail) => {
    const cont = percentile(series, 95), peak = amax(series);
    const cl = cont / comp.rating_mw;
    const pl = peak / (comp.rating_mw * comp.short_time_factor);
    checks.push({
      id: `${label}_${comp.id}`, name: `${comp.name} — ${label}`,
      status: stat(Math.max(cl, pl), comp.warn_loading ?? 0.8),
      value: `${cont.toFixed(2)} MW p95 / ${peak.toFixed(2)} MW peak`,
      limit: `${comp.rating_mw} MW cont / ${(comp.rating_mw * comp.short_time_factor).toFixed(1)} MW short-time`,
      margin: `${((1 - cl) * 100).toFixed(0)}% cont`, detail,
      contLoad: cl, n1: label.startsWith("N-1"),
    });
  };
  for (const c of d.path_components)
    compCheck(c, sim.nodeNormal[c.id], "normal 2N", "both paths sharing load (per-path figure)");
  for (const c of d.path_components)
    compCheck(c, sim.nodeN1[c.id], "N-1 (single path)", "full facility load on the surviving path during the worst transient");

  const peakMeter = amax(sim.pMeter);
  const load = peakMeter / site.contracted_mw;
  checks.push({
    id: "contracted", name: "Contracted utility capacity", status: stat(load, 0.90),
    value: `${peakMeter.toFixed(2)} MW peak at meter`, limit: `${site.contracted_mw} MW contracted`,
    margin: `${((1 - load) * 100).toFixed(0)}%`,
    detail: "facility peak vs. interconnection agreement",
  });
  const headroomMw = site.contracted_mw - peakMeter;

  const rampRaw = maxRamp(sim.pMeter, dt), rampSm = maxRamp(sim.pMeterSm, dt);
  checks.push({
    id: "ramp_raw", name: "Grid ramp rate — no BESS smoothing",
    status: rampRaw <= site.ramp_limit_mw_per_s ? "PASS" : "FAIL",
    value: `${rampRaw.toFixed(2)} MW/s`, limit: `${site.ramp_limit_mw_per_s} MW/s (assumed)`,
    margin: `${(site.ramp_limit_mw_per_s - rampRaw).toFixed(2)} MW/s`,
    detail: "worst 1-second change in meter power, workload hitting the grid directly",
  });
  checks.push({
    id: "ramp_bess", name: "Grid ramp rate — with BESS smoothing",
    status: rampSm <= site.ramp_limit_mw_per_s ? "PASS" : "FAIL",
    value: `${rampSm.toFixed(2)} MW/s`, limit: `${site.ramp_limit_mw_per_s} MW/s`,
    margin: `${(site.ramp_limit_mw_per_s - rampSm).toFixed(2)} MW/s`,
    detail: `BESS ${2 * d.bess_power_mw} MW total absorbing the fast component` +
      (sim.bessClipped ? " (BESS power limit reached)" : "") +
      `; ${sim.bessEnergyUsedMwh.toFixed(2)} MWh cycled vs ${2 * d.bess_energy_mwh} MWh installed`,
  });

  const avg = amean(sim.pMeter);
  const limMw = site.osc_p2p_limit_frac * avg;
  const oR = oscillationBand(sim.pMeter, dt);
  const oS = oscillationBand(sim.pMeterSm, dt);
  const oStat = (v) => v <= limMw ? "PASS" : v <= 2 * limMw ? "WARN" : "FAIL";
  checks.push({
    id: "osc", name: "Forced-oscillation screen (0.05-1 Hz)", status: oStat(oR.p2p),
    value: `${oR.p2p.toFixed(2)} MW p2p at ~${oR.domFreq.toFixed(2)} Hz`,
    limit: `${limMw.toFixed(2)} MW p2p (${(site.osc_p2p_limit_frac * 100).toFixed(0)}% of avg load)`,
    margin: `${(limMw - oR.p2p).toFixed(2)} MW`,
    detail: "periodic demand that can couple to grid inter-area modes; forcing set by the iteration period",
  });
  checks.push({
    id: "osc_bess", name: "Forced-oscillation screen — with BESS", status: oStat(oS.p2p),
    value: `${oS.p2p.toFixed(2)} MW p2p`, limit: `${limMw.toFixed(2)} MW p2p`,
    margin: `${(limMw - oS.p2p).toFixed(2)} MW`,
    detail: "same screen on the BESS-smoothed meter profile",
  });

  const srcId = d.path_components[0].id;
  const peakIsland = amax(sim.nodeN1[srcId]);
  const gl = d.genset_firm_mw > 0 ? peakIsland / d.genset_firm_mw : 99;
  checks.push({
    id: "genset_cap", name: "Genset firm capacity (islanded, single path)",
    status: stat(gl, 0.90),
    value: `${peakIsland.toFixed(2)} MW peak`, limit: `${d.genset_firm_mw} MW firm (N+1)`,
    margin: `${((1 - gl) * 100).toFixed(0)}%`,
    detail: "utility lost AND one path down — surviving path's gensets carry everything",
  });
  const step = maxStep(sim.pMeter, dt);
  const stepAllow = d.genset_step_frac * d.genset_firm_mw;
  checks.push({
    id: "genset_step", name: "Genset step-load tolerance (islanded)",
    status: step <= stepAllow ? "PASS" : "FAIL",
    value: `${step.toFixed(2)} MW worst 10 s step`,
    limit: `${stepAllow.toFixed(1)} MW (${(d.genset_step_frac * 100).toFixed(0)}% of firm)`,
    margin: `${(stepAllow - step).toFixed(2)} MW`,
    detail: "workload swings the gensets must absorb when islanded without BESS support",
  });

  const counts = { PASS: 0, WARN: 0, FAIL: 0 };
  for (const c of checks) counts[c.status]++;
  const verdict = counts.FAIL ? "FAIL" : counts.WARN ? "WARN" : "PASS";
  return { checks, counts, verdict, headroomMw, headroomFrac: headroomMw / site.contracted_mw,
           oscRaw: oR, oscSm: oS, rampRaw, rampSm, peakMeter };
}

if (typeof module !== "undefined") {
  module.exports = { trainingTrace, inferenceTrace, mixedTrace, simulate, runChecks,
                     oscillationBand, maxRamp, maxStep, percentile };
}

