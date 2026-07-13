/* ────────────────────────────────────────────────────────────────────────
   serving-model.js — disaggregated inference sizing engine (DOM-free)

   Answers the question an off-taker actually asks:
   "I want to serve <model> at <traffic> under <SLA> — how many chips
    (prefill vs decode), how many CPU nodes, at what throughput/latency,
    in how much power?"

   First-principles roofline, transparent and auditable — MODELED, NOT MEASURED.
   Two serving phases with different bottlenecks (see MERIDIAN_PRIMER §1, §5):
     • Prefill  — reads the prompt. COMPUTE-bound  → sized on effective TFLOPS.
     • Decode   — generates tokens.  MEMORY-BANDWIDTH-bound → sized on HBM B/W.
   Disaggregation lets prefill and decode run on DIFFERENT silicon
   (heterogeneous inference) — the split falls out of the physics.

   Runs in the browser and under node (unit-testable):
     node -e "const s=require('./serving-model'); console.log(s.selfTest())"
   ──────────────────────────────────────────────────────────────────────── */
(function (root) {
'use strict';

const BYTES = 2;              // BF16/FP16 weights + KV
const WEIGHT_HBM_FRAC = 0.70; // share of HBM budgeted for resident weights
const USABLE_HBM_FRAC = 0.85; // rest of HBM is runtime / activations / fragmentation
const GPUS_PER_NODE   = 8;    // a serving "node" (HGX-class) for CPU-node ratios

// Named-model catalog. MoE models carry total (memory footprint — ALL experts
// must be resident) and active (compute + bandwidth per token — only the
// experts that fire) separately; that split is the whole MoE serving story.
// kv = KV-cache bytes per token, summed over all layers (2·layers·kv_heads·head_dim·2B).
// Numbers are public-spec-derived estimates for a screening tool, not vendor-verified.
const MODELS = {
  QWEN3_235B: { n:'Qwen3-235B-A22B',   totalB:235, activeB:22,  kv:385024,  ctxMax:131072, moe:true,  tag:'MoE · open-weights' },
  LLAMA3_405B:{ n:'Llama-3.1-405B',    totalB:405, activeB:405, kv:1032192, ctxMax:131072, moe:false, tag:'dense · frontier' },
  LLAMA3_70B: { n:'Llama-3.1-70B',     totalB:70,  activeB:70,  kv:655360,  ctxMax:131072, moe:false, tag:'dense · workhorse' },
  DEEPSEEK_V3:{ n:'DeepSeek-V3',       totalB:671, activeB:37,  kv:70000,   ctxMax:131072, moe:true,  tag:'MoE · MLA KV' },
  GPT_OSS_120:{ n:'gpt-oss-120B',      totalB:120, activeB:5.1, kv:150000,  ctxMax:131072, moe:true,  tag:'MoE · efficient' },
};

// Traffic archetypes. Agentic is the one everyone asks about and sizes very
// differently from chat: long shared context (tool outputs, history) inflates
// the KV cache → decode goes memory-capacity-and-bandwidth bound, while
// generations stay short. Batch trades latency for throughput.
const TRAFFIC = {
  chat:    { n:'Chatbot',        inLen:1024, outLen:512,  ctx:2048,  reqs:1000, tpotMs:40,  ttftMs:600,
             note:'interactive Q&A — moderate context, latency-sensitive' },
  agentic: { n:'Agentic',        inLen:8000, outLen:300,  ctx:24000, reqs:300,  tpotMs:35,  ttftMs:2000,
             note:'multi-turn tool-calling — long shared context, short bursts, KV-heavy' },
  batch:   { n:'Batch / offline', inLen:2000, outLen:2000, ctx:4096,  reqs:800, tpotMs:200, ttftMs:8000,
             note:'throughput-first — latency relaxed, pack the batch' },
};

const clampReplicaGpus = g => { for (const s of [1,2,4,8,16,32,64]) if (g<=s) return s; return 64; };
const nodeCPU = c => c && c.kw && c.g ? c.kw/c.g : 0.9; // per-GPU kW (rack kW ÷ GPUs/rack)

// GPUs needed for one model replica: enough HBM to hold ALL weights (MoE: total)
// in the weight budget, leaving the rest for KV + activations.
function gpusPerReplica(model, chip) {
  const memGB = chip.mem || 80;
  const need = (model.totalB*1e9*BYTES) / (memGB*1e9*WEIGHT_HBM_FRAC);
  return clampReplicaGpus(Math.max(1, Math.ceil(need)));
}

// One decode step emits one token for each of `batch` sequences. Weights are
// read once per step (shared across the batch — the batching win); KV grows
// with batch×context. step = max(memory time, compute time).
function decodeStep(model, chip, gpus, batch, ctx) {
  const memBW = chip.hbm*1e12*gpus;                 // bytes/s
  const weightRead = model.activeB*1e9*BYTES;        // active experts, per token
  const kvRead = batch*ctx*model.kv;                 // KV for the whole batch
  const memTime = (weightRead + kvRead)/memBW;
  const flops = 2*model.activeB*1e9*batch;           // 2 FLOP/param/token
  const compTime = flops/(chip.tf*1e12*gpus*(chip.mi||0.65));
  const step = Math.max(memTime, compTime);
  return { step, memBound: memTime>=compTime };
}

// Largest batch that still meets the per-token latency SLA and fits KV in HBM.
function pickBatch(model, chip, gpus, ctx, tpotS) {
  const memGB = chip.mem||80;
  const kvBudget = (memGB*1e9*gpus*USABLE_HBM_FRAC) - (model.totalB*1e9*BYTES);
  const kvMaxBatch = Math.max(1, Math.floor(kvBudget/(ctx*model.kv)));
  let best = 1;
  for (const b of [1,2,4,8,16,24,32,48,64,96,128,192,256]) {
    if (b>kvMaxBatch) break;
    if (decodeStep(model,chip,gpus,b,ctx).step <= tpotS) best = b; else break;
  }
  return { batch:best, kvMaxBatch };
}

function prefill(model, chip, gpus, promptTokens) {
  const eff = chip.tf*1e12*gpus*(chip.mi||0.65);
  const flops = 2*model.activeB*1e9*promptTokens;
  return { ttft: flops/eff, tokps: eff/(2*model.activeB*1e9) };
}

/* Main entry. opts = { model, prefillChip, decodeChip, traffic, reqs?, chips }
   `chips` is the CHIPS table (tf, hbm, mem, kw, g, mi, n). */
function sizeServing(opts) {
  const model  = typeof opts.model==='string' ? MODELS[opts.model] : opts.model;
  const tr     = typeof opts.traffic==='string' ? TRAFFIC[opts.traffic] : opts.traffic;
  const chips  = opts.chips || (root.CHIPS||{});
  const pfChip = chips[opts.prefillChip], dcChip = chips[opts.decodeChip];
  if (!model || !tr || !pfChip || !dcChip) return null;
  const reqs = opts.reqs>0 ? opts.reqs : tr.reqs;
  const ctx = Math.min(tr.ctx, model.ctxMax);
  const tpotS = tr.tpotMs/1000, ttftBudgetS = tr.ttftMs/1000;

  // ── DECODE (memory-bandwidth bound) ──
  const dcGpr = gpusPerReplica(model, dcChip);
  const { batch, kvMaxBatch } = pickBatch(model, dcChip, dcGpr, ctx, tpotS);
  const dStep = decodeStep(model, dcChip, dcGpr, batch, ctx);
  const decodeTokpsPerReplica = batch/dStep.step;      // aggregate out-tok/s per replica
  const reqDecodeTokps = reqs*tr.outLen;
  const decodeReplicas = Math.max(1, Math.ceil(reqDecodeTokps/decodeTokpsPerReplica));
  const decodeGpus = decodeReplicas*dcGpr;

  // ── PREFILL (compute bound) ──
  const pfGpr = gpusPerReplica(model, pfChip);
  const pf = prefill(model, pfChip, pfGpr, tr.inLen);
  const reqPrefillTokps = reqs*tr.inLen;
  const prefillReplicas = Math.max(1, Math.ceil(reqPrefillTokps/pf.tokps));
  const prefillGpus = prefillReplicas*pfGpr;

  // ── CPU / host nodes: head + API/router + control plane ──
  const gpuNodes = Math.ceil((prefillGpus+decodeGpus)/GPUS_PER_NODE);
  const cpuNodes = Math.ceil(gpuNodes*0.25) + Math.ceil(reqs/800) + 2;

  // ── Power (demand side) ──
  const itKW = prefillGpus*nodeCPU(pfChip) + decodeGpus*nodeCPU(dcChip) + cpuNodes*1.6;
  const itMW = itKW/1000;

  return {
    model, traffic:tr, reqs, ctx, heterogeneous: opts.prefillChip!==opts.decodeChip,
    prefill: { chip:pfChip, chipKey:opts.prefillChip, gpusPerReplica:pfGpr, replicas:prefillReplicas,
               gpus:prefillGpus, tokps:pf.tokps, ttftS:pf.ttft, ttftOk:pf.ttft<=ttftBudgetS },
    decode:  { chip:dcChip, chipKey:opts.decodeChip, gpusPerReplica:dcGpr, replicas:decodeReplicas,
               gpus:decodeGpus, batch, kvMaxBatch, tokpsPerReplica:decodeTokpsPerReplica,
               stepS:dStep.step, memBound:dStep.memBound, tpotOk:dStep.step<=tpotS },
    totals: {
      gpus: prefillGpus+decodeGpus, cpuNodes, itMW,
      outTokps: decodeReplicas*decodeTokpsPerReplica,     // delivered aggregate output tok/s
      tokPerSecPerUser: 1/dStep.step,                     // per-user decode speed
      ttftMs: pf.ttft*1000, tpotMs: dStep.step*1000,
      ttftBudgetMs: tr.ttftMs, tpotBudgetMs: tr.tpotMs,
      slaMet: pf.ttft<=ttftBudgetS && dStep.step<=tpotS,
    },
  };
}

function selfTest() {
  const CHIPS = {
    GB300:{n:'GB300 NVL72', g:72, kw:130, tf:1400, hbm:8.0, mi:.72, mem:288},
    H100: {n:'H100 SXM5',   g:48, kw:70,  tf:990,  hbm:3.35,mi:.65, mem:80},
  };
  const out = [];
  for (const t of ['chat','agentic','batch']) {
    const r = sizeServing({model:'QWEN3_235B', prefillChip:'GB300', decodeChip:'GB300', traffic:t, chips:CHIPS});
    out.push(`${t}: pf ${r.prefill.gpus}gpu / dc ${r.decode.gpus}gpu (b=${r.decode.batch}) · `+
             `${Math.round(r.totals.outTokps)} out-tok/s · TTFT ${r.totals.ttftMs.toFixed(0)}ms · `+
             `TPOT ${r.totals.tpotMs.toFixed(1)}ms · ${r.totals.itMW.toFixed(2)} MW · SLA ${r.totals.slaMet?'ok':'MISS'}`);
  }
  // heterogeneous: prefill on GB300 (compute), decode on H100 (cheaper bandwidth)
  const h = sizeServing({model:'LLAMA3_70B', prefillChip:'GB300', decodeChip:'H100', traffic:'chat', chips:CHIPS});
  out.push(`hetero L70 pf=GB300/dc=H100: ${h.prefill.gpus}+${h.decode.gpus} gpu · het=${h.heterogeneous}`);
  return out.join('\n');
}

const api = { MODELS, TRAFFIC, sizeServing, gpusPerReplica, decodeStep, prefill, selfTest };
if (typeof module!=='undefined' && module.exports) module.exports = api;
root.ServingModel = api; root.MODELS = MODELS; root.TRAFFIC = TRAFFIC;
})(typeof globalThis!=='undefined' ? globalThis : this);
