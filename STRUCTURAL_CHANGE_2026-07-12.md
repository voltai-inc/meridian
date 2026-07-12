# Structural Change — Intake-Driven Package + the Serving Plan Module
**July 12, 2026 · proposal + what shipped this pass. Companion to `PRODUCT_PICTURE.md`.**

**TL;DR:** Two independent signals this week point the same way — (1) the DC Sync call asked to
*deepen the workload simulation* (prefill/decode chip counts, throughput/latency, per named model,
CPU nodes, heterogeneous inference, agentic workloads); (2) the external review of `voltai.world`
said the platform *reads as several separate tools* and should let a user give **high-level inputs
and have Voltai drive the workflow.** The deeper workload sim is exactly the engine that makes a
high-level intake meaningful. This pass ships the depth (a new **Serving Plan** module) and proposes
the structural frame that turns the module grid into one intake-driven journey.

---

## 1 · The two signals

**DC Sync (Jul 12).** On the workload sim: *"the goal should be — for prefill/decode how many
chips, throughput/latency, for different models as well (a Qwen something), how many CPU nodes …
heterogeneous inference … if you want more of the agentic stuff, agentic workloads."* Our own read
on the call: the existing inference surface is "a bit thin — pulled for preliminary."

**voltai.world review (external, Digital-Twin contributor).** Two structural notes worth acting on:
- *"Meridian and Helio require explanation for external users — keep internally, use clearer
  customer-facing names."*
- *"It looks like multiple separate tools. Simplify: let users provide high-level inputs (budget,
  power limit, preferred GPU, use case) and let Voltai drive the workflow across modules."*

They converge: the customer wants to say *"serve Qwen3-235B at this throughput under this SLA, on
this budget/power"* and get a driven answer — not to operate five tools. The serving sizing engine
is what a high-level intake needs underneath it.

---

## 2 · The structural change — one intake-driven journey

Today the surfaces are peers in a grid. The change is to add a **front-door intake** that seeds the
whole pipeline, and to demote the modules to stages the intake drives:

```
        HIGH-LEVEL INTAKE  (the new front door)
        use case (train / infer / agentic) · model · target throughput + SLA
        · power or budget cap · preferred GPU (optional) · site (from tracker)
                              │  seeds every stage below
   ┌──────────────┬──────────┴───────────┬───────────────┬──────────────┐
   ▼              ▼                      ▼               ▼              ▼
 01 Find     02 Evaluate            02·b SERVING     Review          03 Procure
 Site        compute design,        PLAN  ← NEW      workload-power   BOM → RFQ → PO
 Selection   chip verdicts          prefill/decode   envelope check
             (Meridian)             sizing           (19 checks)
                    └── reference: Helio 2N block / inference-optimized pod ──┘
```

- The intake is **not a new engine** — it's a thin form that sets the state the modules already
  read (workload, model, chip, MW). It makes the journey feel driven instead of assembled.
- Nothing is removed. Each module still stands alone for a power user; the intake just gives the
  common path a spine, which is the review's actual ask.
- **Scope of this pass:** the Serving Plan engine + surface shipped (§3). The intake front-door is
  specced here and is the recommended next build — it's ~a day given the modules already read state.

---

## 3 · What shipped — the Serving Plan module (the deepened workload sim)

A new **Serving plan** tab inside Meridian (pipeline step 02·b), between Compute and Workload power.
It answers the off-taker's real question: *this model, this traffic, this SLA → how many of what
chips, how many CPU nodes, at what throughput and latency, in how much power.*

Every DC-Sync ask maps to a shipped feature:

| DC-Sync ask | Shipped |
|---|---|
| "prefill / decode how many chips" | Disaggregated sizing — prefill (compute-bound) and decode (bandwidth-bound) sized separately, each reporting GPUs, replicas, GPUs/replica |
| "throughput / latency" | Headline **TTFT**, **TPOT**, tokens/sec/user, delivered aggregate output tok/s — each with a pass/miss against the traffic SLA |
| "different models … a Qwen something" | Named-model catalog: Qwen3-235B-A22B, Llama-3.1-405B / 70B, DeepSeek-V3, gpt-oss-120B (MoE total-vs-active handled) |
| "how many CPU nodes" | Host-node sizing: head + API/router + control plane |
| "heterogeneous inference" | Independent prefill-chip / decode-chip selectors; a HETEROGENEOUS badge and split bar when they differ |
| "agentic workloads" | Traffic archetypes (Chatbot / Agentic / Batch); agentic's long shared context inflates the KV cache and caps decode batch — shown explicitly |

**The model (transparent roofline, MODELED not measured).** Decode is memory-bandwidth-bound:
step time = (active-weight bytes + batch·context·KV) ÷ (HBM B/W × GPUs), batch chosen to meet the
TPOT SLA and fit KV in HBM. Prefill is compute-bound: TTFT = 2·active-params·prompt ÷ effective
TFLOPS. Replicas are sized to meet the required tokens/sec at each stage. MoE models fit on
**total** params (all experts resident) but read/compute on **active** params — the whole MoE
serving story in two fields.

**Files.** `serving-model.js` (DOM-free engine, node-testable: `node -e "require('./serving-model').selfTest()"`),
`site-intelligence.html` (`renderServing`, the new tab, `setServing`, and per-GPU HBM capacity
added to `CHIPS`). No backend, no build step — consistent with the rest of the repo.

**Honest limits.** Model architecture numbers (layers, KV bytes/token, active params) are
public-spec-derived estimates for a screening tool, not vendor-verified; the roofline ignores
scheduling/queueing, speculative decode, quantization, and prefill/decode network transfer. Good
enough to size and compare; label stays "modeled, not measured," same confidence ladder as the rest
of Meridian.

**Why it belongs next to the power story.** The serving plan's rack count / density / cooling class
is the input the Helio pod and the Workload-power envelope consume; its power draw is a demand
curve. Sizing and survivability are two views of one fleet.

---

## 4 · Naming (customer-facing vs internal)

Act on the review's point. Recommendation: keep **Meridian / Helio** as internal codenames; expose
plain-English surfaces to customers:

| Internal | Customer-facing |
|---|---|
| Meridian | Compute Readiness / Site Evaluation |
| Serving Plan | Inference Sizing |
| Helio | Reference Design (AI Data Center) |
| Workload Power | Power Sign-off |

(Also flagged on the call: the **"Meridian" name collides with AMD** — resolve before any external
use. This is a rename in copy only, not a code change.)

---

## 5 · Module boundaries — what this pass does *not* touch

- **Digital Twin is owned by a teammate — untouched here.** It is the supply/physics/thermal side
  (benchmark validation, layout optimizer, OpenFOAM/EnergyPlus jobs) and is complementary to
  Meridian's demand side. The only structural note: the Serving Plan's rack/density/cooling output
  is a clean *input* to the Digital Twin, so the two compose without overlap — but the seam and any
  Digital-Twin integration (e.g. embedding it as a tab) are the teammate's call, deliberately out of
  scope of this document.
- **Procurement** production build (library-backed) remains the teammate's; the BOM seam is unchanged.
- **The power/verification engine** (`power-validation.js`, 19 checks, envelope) is unchanged — the
  Serving Plan feeds it, doesn't replace it.

---

## 6 · Helio

- `helio.html` updated to the current **Rev 0.6** export (the deployed Vercel copy was the old one,
  flagged on the call). Assets (`support.js`, `figures/`, `_ds/`) were already current; only the
  document body changed.
- Rev 0.6 adds an **inference-optimized pod** as a planned variant (rebalanced frontend/storage +
  oversubscription, fully protected, for latency/revenue-critical workloads). When the Serving Plan
  outputs a decode-heavy or agentic fleet, Meridian should validate against *that* pod's ratios, not
  the training-tuned 2N block — a roadmap link, noted so it isn't lost.

---

## 7 · Next steps

1. **Build the intake front-door** (§2) — thin form seeding workload/model/chip/MW; ~a day.
2. **Rename copy** for external surfaces (§4); resolve the AMD/Meridian collision.
3. **Refresh Vercel** with this Helio + the Serving Plan.
4. **Calibrate the serving numbers** when a partner/telemetry gives real model+chip data — the
   engine's interface already accepts it (same confidence-ladder path as the power model).
