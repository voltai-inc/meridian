# Power Model — One-Page Brief: EE First, Formal After
**July 2026 · everything deeper: `MERIDIAN_PRIMER.md`**

## What we built (3 sentences)

We simulate the power draw curve an AI training fleet produces — the whole fleet swings together
every ~3 seconds between a high compute phase and a lower communication phase, and drops to ~15%
during checkpoints — and test it against a reference electrical design (transformers, UPS, BESS,
gensets). The output is pass / warn / fail across 19 checks. It runs in the browser; the demo site
is 200 MW.

## The one finding that frames everything

We varied every input one at a time and watched the verdict. Result: **the outcome is decided by
two rack-level numbers** — how much of the power swing the rack's own energy storage absorbs
("smoothing," NVIDIA claims ~50% on GB300; our number is an estimate), and how synchronized the
fleet runs. Everything else is second-order: bigger transformers or batteries **cannot** fix a
fully-synchronized unsmoothed fleet — though *undersized* equipment makes everything worse.
Timing details (checkpoint cadence, iteration period) barely matter.

So the whole model's credibility hangs on rack-level power behavior — which is chip/board
territory, one level up. That's why we're talking to you.

## Four questions (that's the whole meeting)

1. **Can you derive it?** From board power delivery, component power states, and the NVL72 rack
   architecture — could you derive or *bound* the per-phase power draw and the smoothing fraction
   without owning the hardware? Days, weeks, or measurement-only?
2. **Does node scale to rack?** If we measured one node or tray, does that predict rack behavior,
   or do the shared power shelf / coolant loop / firmware change the picture?
3. **Is our headline physically right?** A synchronized fleet's problem is how fast the load
   *moves*, not how big it is — transformers and switchgear carry a bigger peak but do nothing to
   slow the swing, and even doubling the battery absorbs only part of it. So our model says only
   the demand shape (smoothing, de-syncing, derating) fixes it. True in your experience with fast
   load steps?
4. **What did we ignore that matters?** We model no power factor swing, no inrush after
   checkpoints, no slew limits, no harmonics. Is any of those first-order at MW scale, or are they
   decimals a screening tool can ignore?

If the answers are roughly "derivable, scales, right, nothing fatal" — the model is worth
calibrating and we plan the measurement/partner path. If not, we've learned that cheaply.

**Realistic expectations (so "we don't own the hardware" doesn't end the meeting):** the high
phase is effectively public (vendors publish rack max power); low phase and checkpoint depth
should be *boundable* from component power budgets; smoothing — the verdict-flipper — probably
needs a measurement of the firmware's actual behavior. Two outs: published 0.1-second H100 fleet
measurements already exist in the literature (see primer refs) for calibrating the older
generation, and a GB300 measurement is one rack + one day + a clamp meter via Vertiv's lab, the
NVIDIA relationship, or an operator. Bounds alone are enough to ship verdict *bands*.

## The formal team — different job, later meeting

Keep the roles straight: **EE derives the curve's numbers** (the meeting above). **The simulator
diagnoses one scenario at a time** — pass/warn/fail, where *which* check fails tells you the fix
(contract breach → derate or renegotiate; ramp → BESS; genset step → bigger gensets or bridge).
**Formal makes the claim universal**: instead of "the scenarios we tried passed," it's *"no
workload within these bounds can break this design — proven — or here is the exact one that
does."* Same shape as pre-tape-out verification: prove a property over all inputs, don't test some.

Sequencing: formal comes **after** EE says the model is sound — proving theorems about an
unblessed model is wasted effort. When that lands, it's a 30-minute conversation with one
question:

> The checker is piecewise-linear with bounded inputs; today we brute-force 96 scenarios and
> report the worst case with its counterexample. Turning that into a real proof — is it a
> weeks-scale prototype or a research program, and which checks would you prove first?

One thing the formal/digital side can answer **now**, no meeting needed: during all-reduce the
tensor cores are clock-gated while NVLink and HBM run hot — what fraction of peak power remains?
(That's our "low phase"; we assume 45%, and it sets the swing everything depends on.)

---
*Field questions (has a load ever been curtailed for transients? what do real large-load studies
specify?) are for utility/operator contacts, not either team. Business questions (who pays, NVIDIA
DSX threat) are ours. Background and references: `MERIDIAN_PRIMER.md` §6–8.*
