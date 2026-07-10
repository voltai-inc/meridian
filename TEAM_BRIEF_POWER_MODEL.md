# Power Model — One-Page Brief for the EE Conversation
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
3. **Is our headline physically right?** "You can't buy your way out of a synchronized fleet with
   bigger equipment — only the demand shape fixes it." True in your experience with fast load steps?
4. **What did we ignore that matters?** We model no power factor swing, no inrush after
   checkpoints, no slew limits, no harmonics. Is any of those first-order at MW scale, or are they
   decimals a screening tool can ignore?

If the answers are roughly "derivable, scales, right, nothing fatal" — the model is worth
calibrating and we plan the measurement/partner path. If not, we've learned that cheaply.

---
*Field questions (has a load ever been curtailed for transients? what do real large-load studies
specify?) are for utility/operator contacts, not this room. Business questions (who pays, NVIDIA
DSX threat) are ours. Background and references: `MERIDIAN_PRIMER.md` §6–8.*
