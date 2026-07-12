# Product Structure — Training / Inference, Single-Mode Verification
**Draft · July 12, 2026 · supersedes the block-by-block layout. Companion to `PRODUCT_PICTURE.md`.**

The organizing decision: **the first thing the tool asks is "training or inference?"** — because that
one answer changes the sizing method, the chips, the power behavior, and which metrics even mean
anything. Everything else hangs off it. We stop showing every metric on every screen and instead
show only what's real for the chosen mode.

---

## The shape

- **Main product = single-mode verification.** The user lands in the mode they already know
  (they have an off-taker / a defined use case) and sees only that world.
- **Two real modes:** **Training** and **Inference**.
- **One quiet, optional tab — "What fits this site?" (Compare).** A shallow both-modes view for the
  *only* user who doesn't yet know the mode: a merchant developer — or **Voltai itself** — screening
  a powered site with no tenant. Opt-in, never a gate. Not part of paid diligence.

```
        SITE  (MW, voltage, climate, service type — always an input)
                         │
        ┌────────────────┼─────────────────┐
        ▼                ▼                  ▼
   ┌─────────┐     ┌───────────┐     ┌──────────────────┐
   │TRAINING │     │ INFERENCE │     │ Compare (opt-in)  │
   │  tab    │     │   tab     │     │ "what fits here?" │
   └────┬────┘     └─────┬─────┘     └────────┬──────────┘
        │                │            (shallow; drops you
        └────────────────┴───────────────► into a real mode)
                         │
              DELIVERABLES (spec sheet + BOM) — shared
```

"Mixed" is retired as a mode: a campus doing both is *training pods + inference pods*, each designed
in its own tab. Two clean modes beat a blurry third.

---

## Mode = TRAINING

The job: **building** a model — one big cluster of identical GPUs running in lockstep.

| Shows | Why |
|---|---|
| **One chip** selected for the whole cluster | Lockstep all-reduce forces a single uniform platform — you can't mix brands |
| Cluster size (GPUs / racks), **MFU at scale** | MFU is the training honesty metric: efficiency lost to communication as the cluster grows |
| Time-to-first-run, critical path | Utility/equipment lead times gate the training start |
| **Full power-survival check** (19 checks + envelope) | Training is where the violent synchronized swings, checkpoint dips and job-end cliffs happen — this is the real electrical risk |
| Helio **tiered-protection** option | A training-only capex saving (compute rides on battery; checkpoint-restart tolerates interruption) |

**Hidden here:** prefill/decode, throughput, TTFT/TPOT, inference Pareto, heterogeneous chips.

---

## Mode = INFERENCE

The job: **using** a finished model — millions of independent requests, forever.

| Shows | Why |
|---|---|
| **Serving Plan** — model + traffic (chat/agentic/batch) + **prefill/decode chips** (heterogeneous allowed) | The two inference stages have different bottlenecks and can run on different silicon; this sizes each |
| Throughput (tokens/sec/MW) + latency (tokens/sec/user, **TTFT**, **TPOT**), CPU/host nodes | These are inference's real rulers |
| Inference **Pareto** (per-user speed vs per-MW efficiency) | Chip ranking depends on which end of the SLA you sit at |
| **Light "does this steady load fit?" power check** | Inference power is gentle — no lockstep swings — so the heavy transient machinery doesn't apply |
| Helio **inference-optimized pod** (fully protected, rebalanced frontend/storage) | Inference is latency/revenue-critical; wants full 2N, not tiered protection |

**Hidden here:** **MFU** (a training metric — decode is memory-bandwidth-bound, so MFU reads
misleadingly low even for a well-run fleet), MFU-at-scale curve, checkpoint/oscillation/cliff power
drama, tiered protection.

---

## Shared by both modes
Site inputs · PUE/climate · the confidence ladder (broker-claimed → study-verified → vendor-verified
→ telemetry-calibrated) · the deliverables (2-page off-taker spec sheet + BOM).

---

## Why this shape (the business-model reasoning)

By the time anyone runs a *real deal* through the tool, **the mode is already known** — they have an
off-taker or a designated use case. So cross-mode economic comparison adds nothing to diligence:

| Who / when | Mode known? | Cross-mode comparison useful? |
|---|---|---|
| Off-taker / tenant with a defined workload | Yes | No |
| Financier / underwriter inheriting a deal | Yes | No |
| EPC / engineering firm reviewing a design | Yes | No |
| **Merchant developer** selling a powered site, no off-taker | **No** | **Yes** — flexibility is the pitch |
| **Voltai internal BD** (pseudo off-taker, find-and-sell) | Screening only | Yes, at screening |

This maps onto the two business tiers already in `PRODUCT_PICTURE.md`:
- **Screening** (cheap, high-volume, top-of-funnel) → the *only* place the both-modes "what fits?"
  comparison earns its keep. → the opt-in Compare tab.
- **Per-deal verification** (the paid diligence artifact) → always single-mode. → the two tabs.

So: single-mode is the product; comparison is a quiet screening convenience for the one user who is
their own off-taker — us.

---

## What collapses (from today's layout)

Today Compute, Serving Plan, and Workload Power are **parallel tabs that each show everything**
regardless of what you're doing — which is why it reads as separate tools (the external review's
point) and why chip-selection felt like it collided with heterogeneous serving.

The reorganization files them **under the mode**:

| Today (block-by-block) | Becomes |
|---|---|
| Compute Design (one-chip + MFU curve + inference Pareto, all at once) | Split: the one-chip + MFU half → **Training**; the Pareto → **Inference** |
| Serving Plan (prefill/decode, heterogeneous) — shown always | The **Inference** sizing surface (mode-gated) |
| Workload Power (full transient checks) — shown always | Full version → **Training**; a light steady-fit version → **Inference** |

Nothing built is wasted: the Serving Plan (`serving-model.js` + the tab) becomes the **inference
half**; the existing power engine (`power-validation.js`) stays the **training** survival check and
gets a slimmed inference variant. Chip selection stops colliding because it *means different things
per mode*: Training = pick one cluster chip; Inference = pick a chip per stage.

---

## Open items / next
1. Confirm this structure, then rebuild Meridian around the mode fork (route the existing pieces;
   don't add more).
2. Decide the Compare tab's depth (recommend: MW + rough $/unit for a training vs inference build
   on this site — nothing more).
3. Fold the naming work (`STRUCTURAL_CHANGE_2026-07-12.md`) in at the same time (customer-facing
   labels; the Meridian/AMD collision).
