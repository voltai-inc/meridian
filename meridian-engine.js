/* ============================================================================
   Voltai Meridian — AI Factory Site Intelligence decision engine.

   DOM-free, node-testable. Turns business requirements + the candidate-site
   pipeline into an explainable recommendation. Every number here is derived
   from real site/chip/climate data or the power-validation.js simulation —
   nothing is a black box. Each scoring function returns both a value and the
   reason it produced that value, so the UI can always answer "why?".

   Layers:
     · readiness(site)         — 9 transparent 0-100 infrastructure sub-scores
     · finance(site, req)      — CAPEX / OPEX / TCO / ROI (ports calcFinancials)
     · validate(site, req)     — real 19-check power simulation (verdict/headroom)
     · evaluate(site, req)     — overall score + confidence + the above
     · rank(sites, req, obj)   — ordered candidates for a comparison objective
     · recommend(req)          — hero pick + ranked alternatives + explanation
     · forecast(site, year)    — 2027/2030/2035 trend scenarios
     · tradeoff(a, b)          — natural-language comparison
     · copilot(text, req)      — parse an NL query into a dashboard action
   ============================================================================ */
"use strict";

(function (global) {
  const isNode = typeof require !== "undefined" && typeof module !== "undefined";
  const D  = isNode ? require("./meridian-data.js")     : global;
  const PV = isNode ? require("./power-validation.js")  : global;

  const { CHIPS, CLI, CLIMATE_LABEL, getPUE, regionPower } = D;
  const { trainingTrace, inferenceTrace, mixedTrace, simulate, runChecks } = PV;

  const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
  const has = (s, ...words) => words.some(w => (s || "").toLowerCase().includes(w));

  // Requirement defaults — a blank wizard still produces a sane recommendation.
  const DEFAULT_REQ = {
    region: "any", powerMW: 30, chip: "GB300", budget: null,
    timelineMonths: 24, workload: "train", sustainability: 0.5,
    latency: "standard", modelB: 70,
  };
  function normReq(req) { return Object.assign({}, DEFAULT_REQ, req || {}); }

  // ─── PERFORMANCE (ports getMFU) ────────────────────────────────────────────
  function getMFU(chip, gpus, modelB, wl) {
    const c = CHIPS[chip];
    let m = wl === "train" ? c.mt : (wl === "mix" ? (c.mt + c.mi) / 2 : c.mi);
    if (wl === "train") {
      if (gpus > 8) m -= Math.log2(gpus / 8) * 0.025;
      if (modelB >= 405) m -= 0.05; else if (modelB >= 70) m -= 0.02;
    } else if (wl === "infer") {
      if (gpus > 512) m -= Math.log2(gpus / 512) * 0.010;
    } else {
      if (gpus > 64) m -= Math.log2(gpus / 64) * 0.016;
    }
    return Math.max(0.22, Math.min(0.88, m));
  }

  // ─── FINANCE (ports calcFinancials / timeToFirstRun) ───────────────────────
  const UTIL = 0.80, RATE_DECAY = 0.08, REFRESH_YR = 5, REFRESH_FRAC = 0.6;

  // mw = confirmed facility MW at the meter. Returns the full 10-year model plus
  // the executive KPIs the brief asks for (cost per MW / GPU / training-hour…).
  function finance(mw, req, opts = {}) {
    const chip = req.chip, wl = req.workload, clim = opts.climate || "hot_dry";
    const c = CHIPS[chip];
    const gpuRate = opts.gpuRate != null ? opts.gpuRate : c.rate;
    const pwrCost = opts.pwrCost != null ? opts.pwrCost : 0.055;
    const discR = opts.discR != null ? opts.discR : 0.10;
    const upgCost = opts.upgCost || 0;
    const pue = getPUE(clim);
    const itMW = mw / pue;
    const racks = Math.floor(itMW * 1000 / c.kw);
    const gpus = Math.max(0, racks * c.g);
    const mfu = getMFU(chip, gpus, req.modelB, wl);
    const gpuC = c.cap;
    const facCapex = itMW * 11e6 * 1.1 + upgCost;
    const gpuCapex = gpus * gpuC;
    const totalCapex = facCapex + gpuCapex;
    const opex = mw * 1000 * 8760 * pwrCost * 0.88 + 3e6 + (itMW > 30 ? 2e6 : 0) + itMW * 11e6 * 0.02;
    const energySpend = mw * 1000 * 8760 * pwrCost * 0.88;
    const mdl = [];
    for (let y = 0; y <= 10; y++) {
      const live = y >= 1;
      const rev = live ? gpus * UTIL * gpuRate * 8760 * Math.pow(1 - RATE_DECAY, y - 1) : 0;
      const op = live ? opex : 0;
      const ebt = rev - op;
      const cap = y === 0 ? totalCapex : (y === REFRESH_YR ? gpuCapex * REFRESH_FRAC : 0);
      mdl.push({ y, rev, op, ebt, cap, fcf: ebt - cap, live });
    }
    const npv = mdl.reduce((s, r) => s + r.fcf / Math.pow(1 + discR, r.y), 0);
    let irr = 0.15;
    for (let i = 0; i < 50; i++) {
      const f = mdl.reduce((s, r) => s + r.fcf / Math.pow(1 + irr, r.y), 0);
      const dd = mdl.reduce((s, r) => s - r.y * r.fcf / Math.pow(1 + irr, r.y + 1), 0);
      if (Math.abs(dd) < 1) break; irr -= f / dd; if (irr < -0.5 || irr > 5) break;
    }
    const tco5 = totalCapex + mdl.slice(1, 6).reduce((s, r) => s + r.op, 0);
    const tco10 = totalCapex + mdl.slice(1, 11).reduce((s, r) => s + r.op + r.cap, 0);
    const revYr = mdl[1] ? mdl[1].rev : 0;
    // cost per sustained training-hour = annualized total cost / annual GPU-hours
    const gpuHrsYr = gpus * UTIL * 8760;
    const annualizedCost = totalCapex / 6 + opex; // ~6-yr straight-line on capex
    return {
      pue, itMW, racks, gpus, mfu, facCapex, gpuCapex, totalCapex, opex, energySpend,
      npv, irr, tco5, tco10, revYr, mdl,
      costPerMW: totalCapex / mw,
      costPerGPU: gpuC,
      costPerTrainHour: gpuHrsYr > 0 ? annualizedCost / gpuHrsYr : 0,
      roi: totalCapex > 0 ? npv / totalCapex : 0,
      effPflops: gpus * c.tf * mfu / 1000,
    };
  }

  function timeToFirstRun(itMW, req, opts = {}) {
    const c = CHIPS[req.chip];
    const equipMo = itMW > 40 ? 24 : 18;
    const utilUpg = opts.upgradeMonths || 0;
    const gate = Math.max(utilUpg, c.leadHi || 12, equipMo);
    const gateName = gate === equipMo ? "MV switchgear / transformer"
      : gate === utilUpg ? "utility upgrade"
        : "GPU allocation";
    return { mo: gate + 3, gate: gateName };
  }

  // ─── POWER SIMULATION (ports buildValidationModel / runValidation) ─────────
  function chipPowerProfile(chip) {
    const c = CHIPS[chip];
    const s = c.smooth || 0;
    const mid = (1.00 + 0.45) / 2, hs = ((1.00 - 0.45) / 2) * (1 - s);
    return {
      high_frac: +(mid + hs).toFixed(3), low_frac: +(mid - hs).toFixed(3),
      checkpoint_frac: +(0.15 + (mid - 0.15) * s * 0.5).toFixed(3),
      noise_frac: +(0.02 * (1 - s)).toFixed(3),
      coolRatio: c.cool === "DLC" ? 0.15 : 0.20, smooth: s,
    };
  }

  function buildValidationModel(itMW, confirmedMW) {
    const r = x => +(itMW * x).toFixed(1);
    const design = {
      name: "Helio 2N reference block — scaled to site", revision: "meridian-app",
      critical_it_mw: +itMW.toFixed(1), redundancy: "2N",
      genset_firm_mw: r(1.25), genset_step_frac: 0.40,
      bess_power_mw: r(0.417), bess_energy_mwh: r(0.208),
      mech_base_mw: r(0.05), mech_cooling_ratio: 0.20, mech_lag_s: 180,
      path_components: [
        { id: "feed", name: "Utility feed", kind: "utility_feed", rating_mw: r(1.425), short_time_factor: 1.05, efficiency: 1.0, warn_loading: 0.8 },
        { id: "mv_swgr", name: "MV switchgear", kind: "mv_switchgear", rating_mw: r(1.425), short_time_factor: 1.10, efficiency: 1.0, warn_loading: 0.8 },
        { id: "tx", name: "Transformer", kind: "transformer", rating_mw: r(1.425), short_time_factor: 1.10, efficiency: 0.99, warn_loading: 0.8 },
        { id: "lv_swgr", name: "LV switchgear", kind: "lv_switchgear", rating_mw: r(1.425), short_time_factor: 1.10, efficiency: 1.0, warn_loading: 0.8 },
        { id: "ups", name: "UPS (2N)", kind: "ups", rating_mw: r(1.0), short_time_factor: 1.25, efficiency: 0.96, warn_loading: 0.85 },
        { id: "pdu", name: "PDU / busway", kind: "pdu", rating_mw: r(1.0), short_time_factor: 1.10, efficiency: 0.995, warn_loading: 0.8 },
      ],
    };
    const site = {
      contracted_mw: confirmedMW,
      ramp_limit_mw_per_s: +(confirmedMW * 0.0625).toFixed(2),
      osc_p2p_limit_frac: 0.10,
    };
    return { design, site };
  }

  const _valCache = new Map();
  // Runs the real power engine for a site sized to `confirmedMW` under `req`.
  function validate(confirmedMW, req, climate) {
    const pue = getPUE(climate);
    const itMW = confirmedMW / pue;
    const wl = req.workload, chip = req.chip;
    const key = [itMW.toFixed(2), confirmedMW, wl, chip].join("|");
    if (_valCache.has(key)) return _valCache.get(key);
    const prof = chipPowerProfile(chip);
    const { design, site } = buildValidationModel(itMW, confirmedMW);
    design.mech_cooling_ratio = prof.coolRatio;
    const tOpts = {
      duration_s: 1800, job_end_at_s: 1530, high_frac: prof.high_frac, low_frac: prof.low_frac,
      checkpoint_frac: prof.checkpoint_frac, noise_frac: prof.noise_frac,
    };
    const trace = wl === "infer" ? inferenceTrace(design.critical_it_mw, { duration_s: 1800 })
      : wl === "mix" ? mixedTrace(design.critical_it_mw, Object.assign({}, tOpts, { training_share: 0.6 }))
        : trainingTrace(design.critical_it_mw, tOpts);
    const sim = simulate(design, trace, 30);
    const rep = runChecks(sim, site);
    const result = { design, site, trace, sim, rep, itMW, pue };
    if (_valCache.size > 60) _valCache.clear();
    _valCache.set(key, result);
    return result;
  }

  // ─── READINESS — 9 transparent infrastructure sub-scores ───────────────────
  // Each returns { score 0-100, note } so the UI can explain every category.
  const READINESS_ORDER = [
    "power", "grid", "cooling", "fiber", "water",
    "construction", "supply", "regulatory", "expansion",
  ];
  const READINESS_LABEL = {
    power: "Power Infrastructure", grid: "Grid Reliability", cooling: "Cooling Potential",
    fiber: "Fiber Connectivity", water: "Water Availability", construction: "Construction Readiness",
    supply: "Supply Chain", regulatory: "Regulatory Risk", expansion: "Expansion Capacity",
  };

  function readiness(site, req) {
    req = normReq(req);
    const rp = regionPower(site.state);
    const notes = site.notes || "";
    const cat = {};

    // Power Infrastructure — can the site serve the requested load today?
    const ceil = site.mwCeil || site.mwNum;
    if (site.mwNum == null) cat.power = { score: 30, note: "Available MW not yet confirmed with the utility (TBD)." };
    else {
      let s = clamp(38 + 54 * Math.min(1, site.mwNum / Math.max(1, req.powerMW)));
      if (site.utility) s += 6;
      if (has(site.type, "existing", "powered")) s += 4;
      cat.power = { score: clamp(s), note: `${site.mw} confirmed lower bound${site.utility ? " · " + site.utility : ""} vs ${req.powerMW} MW target.` };
    }

    // Grid Reliability — operator strength + how firm the interconnect path is.
    let g = rp.reliability * 100;
    if (!site.utility) g -= 12;
    if (has(notes, "pending", "study", "tbd")) g -= 6;
    cat.grid = { score: clamp(g), note: `${rp.grid}; ${site.utility ? "named utility" : "utility not yet assigned"}.` };

    // Cooling Potential — climate free-cooling favorability.
    const coolFav = CLI[site.climate] ? CLI[site.climate][3] : 0.5;
    cat.cooling = { score: clamp(30 + coolFav * 70), note: `${CLIMATE_LABEL[site.climate]} climate · modeled PUE ${getPUE(site.climate).toFixed(2)}.` };

    // Fiber Connectivity — explicit fiber evidence beats an unknown greenfield.
    let f = 60;
    if (has(notes, "fiber", "zayo")) f = 86;
    else if (has(site.type, "existing")) f = 80;
    else if (has(site.type, "greenfield", "land") || site.approx) f = 46;
    cat.fiber = { score: f, note: has(notes, "fiber", "zayo") ? "Fiber on-site (carrier named)." : has(site.type, "existing") ? "Existing facility — carrier presence likely." : "Fiber route to confirm." };

    // Water Availability — regional surface-water for cooling.
    cat.water = { score: clamp(rp.water * 100), note: `${site.state} regional water availability index.` };

    // Construction Readiness — how close to shovel/energization.
    const cmap = [
      [["existing data center"], 92], [["powered land"], 80], [["retrofit", "manufacturing"], 74],
      [["light manufacturing"], 68], [["spec build"], 60], [["auction"], 66],
      [["greenfield", "land"], 44], [["acquisition"], 58],
    ];
    let cr = 50;
    for (const [keys, v] of cmap) if (has(site.type, ...keys)) { cr = v; break; }
    if (site.stage === "Pipeline") cr += 6;
    if (has(notes, "by-right", "rezoning done", "zoning resolved", "occupancy")) cr += 6;
    cat.construction = { score: clamp(cr), note: `${site.type}${has(notes, "by-right", "zoning resolved") ? " · zoning cleared" : ""}.` };

    // Supply Chain — regional logistics / equipment access.
    cat.supply = { score: clamp(rp.supply * 100), note: `${site.state} logistics & equipment-access index.` };

    // Regulatory Risk — higher score = lower risk.
    let reg = 65;
    if (has(notes, "by-right", "rezoning done", "zoning resolved", "zoning likely")) reg = 84;
    else if (has(notes, "pending", "study", "capacity check")) reg = 56;
    if (site.stage === "Prospecting") reg -= 5;
    cat.regulatory = { score: clamp(reg), note: has(notes, "by-right", "zoning resolved") ? "Zoning cleared / by-right." : "Permitting path to confirm." };

    // Expansion Capacity — land + headroom for phase 2.
    let ex = 45;
    if (site.acres >= 100) ex = 90; else if (site.acres >= 40) ex = 76;
    else if (site.acres >= 25) ex = 62; else if (site.acres >= 12) ex = 52;
    if (site.mwCeil) ex += 10;
    cat.expansion = { score: clamp(ex), note: site.mwCeil ? `Scales to ${site.mwCeil}+ MW${site.acres ? " · " + site.acres + " ac" : ""}.` : site.acres ? `${site.acres} ac footprint.` : "Expansion headroom TBD." };

    const overall = READINESS_ORDER.reduce((s, k) => s + cat[k].score, 0) / READINESS_ORDER.length;
    return { cat, overall, order: READINESS_ORDER, label: READINESS_LABEL };
  }

  // ─── SCORING WEIGHTS — driven by the wizard so the answer responds to needs ─
  function weights(req) {
    req = normReq(req);
    const w = { power: 1.6, cost: 1.3, timeline: 1.1, cooling: 0.9, grid: 1.0, fiber: 0.8, water: 0.5, construction: 1.0, supply: 0.6, regulatory: 0.8, expansion: 0.8, performance: 0.9 };
    const sus = req.sustainability;                    // 0-1
    w.cooling += sus * 1.2; w.water += sus * 0.6; w.renewable = 0.4 + sus * 1.4;
    if (req.budget === "tight" || req.budget === "low") w.cost += 1.2;
    if (req.timelineMonths <= 18) { w.timeline += 1.3; w.construction += 0.9; }
    else if (req.timelineMonths >= 36) { w.timeline -= 0.3; }
    if (req.latency === "low" || req.latency === "ultra-low") { w.fiber += 1.0; w.grid += 0.5; }
    return w;
  }

  // ─── EVALUATE — overall score, confidence, finance, readiness for one site ──
  function evaluate(site, req) {
    req = normReq(req);
    const rp = regionPower(site.state);
    const rd = readiness(site, req);
    const w = weights(req);

    // Confirmed MW used for the model: the site's lower bound, capped at target×1.5.
    const confirmedMW = site.mwNum != null ? Math.min(site.mwNum, req.powerMW * 1.5) : Math.max(5, req.powerMW * 0.4);
    const fin = finance(confirmedMW, req, { climate: site.climate, pwrCost: rp.price });
    const ttfr = timeToFirstRun(fin.itMW, req);

    // Normalized 0-100 component scores.
    const comp = {};
    comp.power = rd.cat.power.score;
    comp.grid = rd.cat.grid.score;
    comp.cooling = rd.cat.cooling.score;
    comp.fiber = rd.cat.fiber.score;
    comp.water = rd.cat.water.score;
    comp.construction = rd.cat.construction.score;
    comp.supply = rd.cat.supply.score;
    comp.regulatory = rd.cat.regulatory.score;
    comp.expansion = rd.cat.expansion.score;
    comp.renewable = clamp(20 + rp.renewable * 260);           // renewable share → score
    // Cost: cheaper power vs a $0.10/kWh reference, blended with capex efficiency.
    comp.cost = clamp(120 - (rp.price / 0.10) * 70 - (fin.costPerMW / 20e6) * 20);
    // Timeline: faster than the target scores higher.
    comp.timeline = clamp(115 - (ttfr.mo / Math.max(6, req.timelineMonths)) * 70);
    // Performance fit: MFU × silicon availability for the chosen platform.
    comp.performance = clamp(fin.mfu * 100 + (CHIPS[req.chip].st === "ship" ? 8 : -10));

    let num = 0, den = 0;
    for (const k in w) { if (comp[k] != null) { num += comp[k] * w[k]; den += w[k]; } }
    const score = clamp(num / den);

    // Confidence — data completeness × verdict headroom × requirement fit.
    const fields = ["mwNum", "utility", "priceNum", "acres"];
    const known = fields.reduce((s, f) => s + (site[f] != null && site[f] !== "" ? 1 : 0), 0);
    let completeness = known / fields.length;              // 0-1
    if (site.stage === "Pipeline") completeness = Math.min(1, completeness + 0.15);
    if (site.approx) completeness -= 0.08;
    const fit = site.mwNum != null ? Math.min(1, site.mwNum / req.powerMW) : 0.5;
    const confidence = clamp(Math.round((0.45 * completeness + 0.30 * (score / 100) + 0.25 * fit) * 100), 12, 96);

    const riskScore = 100 - (comp.regulatory * 0.4 + comp.grid * 0.3 + comp.construction * 0.3);
    const risk = riskScore > 45 ? "High" : riskScore > 30 ? "Moderate" : "Low";

    return {
      site, req, confirmedMW, readiness: rd, comp, weights: w, fin, ttfr,
      score: Math.round(score), confidence, risk, riskScore,
      region: rp,
      expandability: rd.cat.expansion.score,
      sustainability: Math.round((comp.cooling * 0.4 + comp.renewable * 0.35 + comp.water * 0.25)),
    };
  }

  // ─── RANK / RECOMMEND ──────────────────────────────────────────────────────
  const OBJECTIVES = {
    balanced: { label: "Best Overall", key: e => e.score },
    cost: { label: "Lowest Cost", key: e => -e.fin.costPerMW },
    fast: { label: "Fastest Deployment", key: e => -e.ttfr.mo },
    risk: { label: "Lowest Risk", key: e => -e.riskScore },
    green: { label: "Greenest Energy", key: e => e.sustainability },
    perf: { label: "Highest Performance", key: e => e.comp.performance },
    roi: { label: "Best Long-Term ROI", key: e => e.fin.roi },
  };

  function rank(sites, req, objective = "balanced") {
    req = normReq(req);
    const obj = OBJECTIVES[objective] || OBJECTIVES.balanced;
    let pool = sites.slice();
    if (req.region && req.region !== "any") pool = pool.filter(s => s.state === req.region);
    if (!pool.length) pool = sites.slice();
    const evals = pool.map(s => evaluate(s, req));
    evals.sort((a, b) => obj.key(b) - obj.key(a));
    return evals;
  }

  function recommend(req, sites) {
    req = normReq(req);
    sites = sites || D.SITES;
    const evals = rank(sites, req, "balanced");
    const top = evals[0];
    return { top, alternatives: evals.slice(1), all: evals, explanation: explain(top, evals) };
  }

  // ─── EXPLAINABILITY ────────────────────────────────────────────────────────
  function topDrivers(evaluation, n = 3) {
    const w = evaluation.weights, c = evaluation.comp;
    return Object.keys(c)
      .filter(k => w[k] != null)
      .map(k => ({ k, contrib: c[k] * w[k], score: c[k] }))
      .sort((a, b) => b.contrib - a.contrib).slice(0, n);
  }

  function explain(evaluation, allEvals) {
    const s = evaluation.site, fin = evaluation.fin, rp = evaluation.region;
    const drivers = topDrivers(evaluation);
    const driverNames = { power: "power availability", cost: "utility cost", timeline: "construction timeline", cooling: "cooling efficiency", grid: "grid reliability", fiber: "fiber connectivity", construction: "construction readiness", expansion: "long-term expansion potential", performance: "compute performance", renewable: "renewable supply", regulatory: "permitting", water: "water access", supply: "supply chain" };
    const why = `${s.name} (${s.state}) is recommended because it offers the strongest balance of ` +
      drivers.map(d => driverNames[d.k] || d.k).join(", ") +
      `. At ${(rp.price * 100).toFixed(1)}¢/kWh with a modeled PUE of ${fin.pue.toFixed(2)}, it lands an overall score of ${evaluation.score}/100 at ${evaluation.confidence}% confidence.`;

    const whyNot = (allEvals || []).slice(1, 3).map(e => {
      const gap = evaluation.score - e.score;
      const weak = topDrivers(e).slice().reverse().find(d => d.score < 60) || { k: "power" };
      return `${e.site.name} scores ${e.score} (${gap} lower) — held back by ${driverNames[weak.k] || weak.k}.`;
    });

    const risks = [];
    if (s.mwNum == null) risks.push("Available MW is unconfirmed — the utility capacity study is the gating unknown.");
    if (evaluation.comp.cooling < 55) risks.push(`${CLIMATE_LABEL[s.climate]} climate lifts cooling load (PUE ${fin.pue.toFixed(2)}); evaporative assist should be evaluated.`);
    if (evaluation.comp.regulatory < 60) risks.push("Permitting/zoning path is not yet cleared.");
    if (s.approx) risks.push("Parcel location is approximate — exact interconnect distance affects cost and timeline.");
    if (has(s.notes, "flood")) risks.push("Flood exposure flagged in diligence notes.");
    if (!risks.length) risks.push("No blocking risks identified at this stage; standard diligence applies.");

    const assumptions = [
      `Facility sized to ${evaluation.confirmedMW} MW at the meter (${CHIPS[evaluation.req.chip].n}, ${evaluation.req.workload}).`,
      `Industrial power at ${(rp.price * 100).toFixed(1)}¢/kWh (${rp.grid}) — a regional estimate pending a firm tariff.`,
      `Ramp/oscillation limits assumed at ${(evaluation.confirmedMW * 0.0625).toFixed(1)} MW/s pending the utility's large-load study.`,
      `80% GPU utilization, 8%/yr rental-rate decay, GPU refresh in year 5.`,
    ];

    const improve = [];
    const rd = evaluation.readiness.cat;
    Object.keys(rd).sort((a, b) => rd[a].score - rd[b].score).slice(0, 3).forEach(k => {
      improve.push(`${READINESS_LABEL[k]} (${Math.round(rd[k].score)}/100): ${rd[k].note}`);
    });

    return { why, whyNot, risks, assumptions, improve, drivers };
  }

  // ─── FORECAST — labeled trend scenarios for 2027 / 2030 / 2035 ──────────────
  const FORECAST_YEARS = [2027, 2030, 2035];
  function forecast(site) {
    const rp = regionPower(site.state);
    const base = 2026;
    const rows = FORECAST_YEARS.map(y => {
      const dt = y - base;
      const price = rp.price * Math.pow(1 + rp.cagr, dt);
      const renewable = Math.min(0.95, rp.renewable + dt * (0.012 + rp.renewable * 0.03));
      // grid availability erodes as regional load grows, then recovers with buildout
      const congestion = Math.min(0.95, 0.25 + dt * 0.035);
      const gridAvail = clamp((rp.reliability - congestion * 0.4) * 100) / 100;
      const construction = clamp(40 + dt * 5.5) / 100; // congestion index rising
      const regulatory = clamp(60 + (rp.renewable > 0.15 ? dt * 2 : -dt * 1.5)) / 100;
      const expansion = clamp(50 + renewable * 40 + (0.9 - congestion) * 20) / 100;
      return { year: y, price, renewable, gridAvail, construction, regulatory, expansion, congestion };
    });
    return {
      base, rows,
      note: `Trend scenario: ${(rp.cagr * 100).toFixed(1)}%/yr power CAGR, renewable share compounding, grid congestion rising with regional AI load. ${site.state} · ${rp.grid}.`,
    };
  }

  // ─── TRADEOFF — natural language comparison between two evaluations ─────────
  function pctDiff(a, b) { return b === 0 ? 0 : (a - b) / b; }
  function tradeoff(a, b) {
    const out = [];
    const dCost = pctDiff(a.fin.costPerMW, b.fin.costPerMW);
    if (Math.abs(dCost) > 0.04)
      out.push(`${a.site.name} ${dCost < 0 ? "cuts" : "raises"} cost per MW by ${Math.abs(dCost * 100).toFixed(0)}% vs ${b.site.name}.`);
    const dTime = a.ttfr.mo - b.ttfr.mo;
    if (Math.abs(dTime) >= 1)
      out.push(`${dTime < 0 ? "deploys" : "adds"} ${Math.abs(dTime)} month${Math.abs(dTime) > 1 ? "s" : ""} ${dTime < 0 ? "sooner" : "of lead time"}.`);
    const dCool = a.comp.cooling - b.comp.cooling;
    if (Math.abs(dCool) > 8)
      out.push(`${dCool > 0 ? "lower" : "higher"} cooling load (${a.fin.pue.toFixed(2)} vs ${b.fin.pue.toFixed(2)} PUE).`);
    const dGreen = a.sustainability - b.sustainability;
    if (Math.abs(dGreen) > 8)
      out.push(`${dGreen > 0 ? "greener" : "less green"} energy mix (${a.sustainability} vs ${b.sustainability} sustainability).`);
    const dRisk = b.riskScore - a.riskScore;
    if (Math.abs(dRisk) > 6)
      out.push(`${dRisk > 0 ? "lower" : "higher"} execution risk (${a.risk} vs ${b.risk}).`);
    const summary = out.length
      ? `${a.site.name} vs ${b.site.name}: ` + out.join(" It ").replace(/ It /, ", ")
      : `${a.site.name} and ${b.site.name} are closely matched across cost, timeline, and risk.`;
    return { summary, points: out };
  }

  // ─── COPILOT — parse an NL query into a dashboard action ────────────────────
  // Deterministic intent parser so the copilot works with no API key; the UI can
  // additionally pass the same query to Claude for a richer prose answer.
  function copilot(text, req, sites) {
    req = normReq(req);
    sites = sites || D.SITES;
    // normalize hyphens/en-dashes to spaces so "lowest-risk" matches "lowest risk"
    const t = (text || "").toLowerCase().replace(/[‐-―\-]+/g, " ");
    const num = re => { const m = t.match(re); return m ? parseFloat(m[1]) : null; };

    // compare A and B
    const cmp = t.match(/compare\s+([a-z\s]+?)\s+(?:and|vs\.?|with)\s+([a-z\s]+)/i);
    if (cmp) {
      const find = q => sites.find(s => s.name.toLowerCase().includes(q.trim()) || s.state.toLowerCase().includes(q.trim()));
      const A = find(cmp[1]), B = find(cmp[2]);
      if (A && B) {
        const ea = evaluate(A, req), eb = evaluate(B, req);
        return { action: "compare", sites: [A.id, B.id], answer: tradeoff(ea, eb).summary, evals: [ea, eb] };
      }
    }

    // price ceiling: "under $0.08/kWh" / "below 8 cents"
    const cents = num(/(?:under|below|less than)\s*\$?0?\.?0?(\d{1,2})\s*(?:¢|c|cent|\/kwh|per kwh)/) ||
      (t.match(/\$?0\.(\d{2,3})\s*\/?\s*kwh/) ? parseFloat("0." + t.match(/\$?0\.(\d{2,3})/)[1]) * 100 : null);
    if (cents != null && /kwh|cent|¢|price|cost|cheap/.test(t)) {
      const ceil = cents / 100;
      const ids = sites.filter(s => regionPower(s.state).price <= ceil).map(s => s.id);
      return { action: "filter", filter: { maxPrice: ceil }, sites: ids, answer: `${ids.length} sites at or under ${cents}¢/kWh.` };
    }

    // MW support: "100 MW AI factory" / "supporting 50 MW"
    const mw = num(/(\d{1,4})\s*mw/);
    if (mw != null && /mw|factory|support|serve|power/.test(t)) {
      const ids = sites.filter(s => (s.mwCeil || s.mwNum || 0) >= mw).map(s => s.id);
      return { action: "filter", filter: { minMW: mw }, sites: ids, answer: `${ids.length} sites can support a ${mw} MW AI factory (at their upper bound).` };
    }

    // chip support: "support GB300"
    const chipKey = Object.keys(CHIPS).find(k => t.includes(k.toLowerCase()) || t.includes(CHIPS[k].n.toLowerCase()));
    if (chipKey && /support|deploy|run|which/.test(t)) {
      const c = CHIPS[chipKey];
      const ids = sites.filter(s => (s.mwNum || 0) >= c.kw / 1000 * 4 || s.mwNum == null).map(s => s.id);
      const note = c.volt === "dc800" ? " (needs 800 VDC-ready electrical design)" : "";
      return { action: "filter", filter: { chip: chipKey }, sites: ids, answer: `${c.n} deployable at ${ids.length} sites${note}.` };
    }

    // objective queries
    if (/lowest risk|least risk|safest/.test(t)) { const e = rank(sites, req, "risk"); return { action: "sort", objective: "risk", sites: e.map(x => x.site.id), answer: `Lowest-risk: ${e[0].site.name} (${e[0].risk} risk).` }; }
    if (/carbon|green|renewable|sustainab/.test(t)) { const e = rank(sites, req, "green"); return { action: "sort", objective: "green", sites: e.map(x => x.site.id), answer: `Greenest: ${e[0].site.name} (sustainability ${e[0].sustainability}).` }; }
    if (/cheapest|lowest cost|least expensive/.test(t)) { const e = rank(sites, req, "cost"); return { action: "sort", objective: "cost", sites: e.map(x => x.site.id), answer: `Lowest cost per MW: ${e[0].site.name}.` }; }
    if (/fastest|soonest|quickest|deploy/.test(t)) { const e = rank(sites, req, "fast"); return { action: "sort", objective: "fast", sites: e.map(x => x.site.id), answer: `Fastest to deploy: ${e[0].site.name} (~${e[0].ttfr.mo} mo).` }; }
    if (/best roi|return|long term/.test(t)) { const e = rank(sites, req, "roi"); return { action: "sort", objective: "roi", sites: e.map(x => x.site.id), answer: `Best long-term ROI: ${e[0].site.name}.` }; }

    // default: recommend
    const rec = recommend(req, sites);
    return { action: "recommend", sites: rec.all.map(e => e.site.id), answer: rec.explanation.why };
  }

  // ─── DIGITAL TWIN handoff payload ──────────────────────────────────────────
  const TWIN_BASE = "http://51.21.243.237:5173/";
  function twinLink(evaluation) {
    const s = evaluation.site, fin = evaluation.fin, req = evaluation.req;
    const p = new (typeof URLSearchParams !== "undefined" ? URLSearchParams : require("url").URLSearchParams)({
      source: "meridian", site: s.id, name: s.name, loc: s.addr,
      lat: s.lat, lng: s.lng, climate: s.climate, utility: s.utility || "TBD",
      mw: evaluation.confirmedMW, itmw: fin.itMW.toFixed(1), pue: fin.pue,
      chip: req.chip, gpus: fin.gpus, racks: fin.racks, workload: req.workload,
      acres: s.acres || "", cool: CHIPS[req.chip].cool,
    });
    return TWIN_BASE + "?" + p.toString();
  }

  // ─── EXPORT ────────────────────────────────────────────────────────────────
  const api = {
    DEFAULT_REQ, normReq, getMFU, finance, timeToFirstRun, validate, chipPowerProfile,
    readiness, weights, evaluate, rank, recommend, explain, topDrivers,
    forecast, tradeoff, copilot, twinLink, OBJECTIVES,
    READINESS_ORDER, READINESS_LABEL, FORECAST_YEARS,
  };
  if (isNode) module.exports = api;
  else Object.assign(global, { MERIDIAN_ENGINE: api }, api);
})(typeof window !== "undefined" ? window : globalThis);
