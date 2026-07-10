# Team Brief — Meridian Power Model: What Matters, and What We're Deciding
**For the EE / formal / product conversations · July 2026 · discussion guide, not a task list**

Meridian evaluates whether an AI data center design survives its workload's power behavior, before
it's built. Before asking anyone to build or validate anything, the first question is ours:
**which inputs actually change the answer, by how much, and is the effect significant?** We measured
it. Everything below starts from that.

---

## Part 1 · What actually moves the answer (measured)

### First: the complete input inventory (nothing comes out of nowhere)

The demand curve is generated from exactly nine numbers; the check adds the supply sizing and the
utility terms. This is the whole list — every row in the sensitivity table below varies one of these.

| # | Input | Source | Current basis |
|---|---|---|---|
| 1 | High-phase power (compute burst) | Chip profile | Literature estimate |
| 2 | Low-phase power (all-reduce wait) | Chip profile | Literature estimate |
| 3 | Checkpoint depth | Chip profile | Literature estimate |
| 4 | **Smoothing credit** (rack energy storage) | Chip profile | Public NVIDIA material — needs source or bound |
| 5 | Iteration period | Customer workload profile | Default 3 s, customer-editable |
| 6 | Checkpoint cadence | Customer workload profile | Default 20 min, customer-editable |
| 7 | Checkpoint length | Customer workload profile | Default 20 s, customer-editable |
| 8 | **Synchronized fraction** of fleet | Customer workload profile | Default 100% (conservative), customer-editable |
| 9 | IT MW (curve scale) | Site (MW ÷ PUE) | Site fact |
| — | BESS / genset / UPS / chain sizing ratios | Facility design | Scaled from the 12 MW Helio block |
| — | Contracted MW | Utility contract | Site fact |
| — | Ramp + oscillation limits | Utility policy | **Assumed** — pending a real large-load study |

("Swing amplitude" in the table below is not a tenth input — it is high-minus-low, #1–#2, swept
together to test how wrong the chip estimates can be before it matters.) Effects **absent** from
this list entirely — power factor under swing, inrush at checkpoint recovery, slew rates,
harmonics — cannot be swept; whether any of them is first-order is discussion question B below.

**How to read the outcomes:** each result is a verdict plus the count of hard-failing checks out
of 19 — `FAIL · 4✗` means four checks hard-fail; `WARN · 0✗` means nothing hard-fails but some
checks sit in the warning band (e.g. a component at 85% of rating, or "the BESS is load-bearing
for the ramp limit").

### The sweep

Baseline: the 200 MW demo site, unsmoothed (H100-class) fully-synchronized training fleet →
**FAIL, 4 failing checks**. Each row varies one input and reports the new outcome. (Script:
`scripts_sensitivity_sweep.js`, reproducible; ranges chosen as plausible, not extreme.)

| Input (one at a time) | Outcome | Read |
|---|---|---|
| **Demand shape** | | |
| Chip smoothing 50% (GB300 claim) | **WARN · 0✗** | **Flips the verdict.** The single most decisive input. |
| Chip smoothing 30% | FAIL · 1✗ | Even partial smoothing removes most fails. |
| Fleet synchronization 100% → 25% | **WARN · 0✗** | The other verdict-flipper — and it's a *workload/contract* lever, not equipment. |
| Swing amplitude ±20% | FAIL · 3–4✗ | Matters, second to smoothing/sync. |
| Timing (iteration 3s→30s, checkpoints 20→5 min) | FAIL · 4✗ (unchanged) | Timing barely moves the outcome; amplitudes and sync dominate. Matches the envelope sweep. |
| **Utility / contract side** | | |
| Contract +15% (230 MW) | FAIL · 3✗ | Helps the margin; cannot fix an unsmoothed fleet. |
| Ramp limit 4× looser or 2× stricter | FAIL · 4✗ (unchanged) | Our most-invented number turns out not to bind — **because an adequately sized BESS neutralizes ramp**. It *would* bind if BESS were undersized. |
| **Facility supply side** | | |
| BESS −50% | **FAIL · 8✗** | Catastrophic. |
| BESS +100% | FAIL · 3✗ | Barely helps. **Supply sizing is asymmetric**: undersizing ruins everything; oversizing can't rescue a bad demand shape. |
| Passive chain (transformers/switchgear/feed) −20% | **FAIL · 8✗** | Same asymmetry. Our earlier internal claim that the passive chain "doesn't matter" was one-sided — it doesn't *help* to oversize it, but undersizing it is as bad as halving the BESS. Standard ratios sit near the edge. |
| Gensets ±20% | 2–4✗ | Meaningful margin lever. |
| Cooling ratio 0.12–0.28 | 3–4✗ | Second-order. |
| **The sizing decision itself** | | |
| Derate IT to 85% of PUE-average | FAIL · 3✗ | Alone, not enough. |
| Derate 85% **+** smoothing 50% | **WARN · 0✗** | Combinations of modest demand-side moves flip the verdict. |

**The honest three-sentence summary:** The *demand shape* (chip smoothing × fleet synchronization)
sets the verdict class, and it is the only thing that flips FAIL to survivable on its own. The
*supply side* sets the margins and is asymmetric — correctly-sized is invisible, undersized is
catastrophic — so it must be modeled, but its value is in catching undersizing, not in rescuing
demand. The *utility profile* enters mainly through the contracted peak; the ramp limit we
currently invent doesn't bind while the BESS is healthy, and that is itself a finding worth
checking with someone who has seen a real large-load study.

**What this means for the review:** the inputs worth the most scrutiny are, in order:
(1) the smoothing credit, (2) achievable fleet synchronization, (3) BESS and passive-chain sizing
ratios, (4) swing amplitudes, (5) the contracted-peak relationship. Timing parameters, cooling
ratio, and the oscillation threshold can stay rough for now.

---

## Part 2 · The discussion

Five steps, in the order the logic actually runs: *is the problem real → does our model capture
it → can we get the numbers that matter → is there a business in it → what do we do next.* Each
step is a short claim from Part 1 plus the questions that test it. Conversation, not task list.

### 1 · The problem — do these failure modes exist outside our simulator?

*Our claim:* synchronized AI training makes the whole fleet's power swing together, and at hundreds
of MW that's a grid event — published work (Microsoft/NVIDIA, arXiv 2508.14318) says the same.

- Have you seen or heard of an AI/HPC load actually curtailed, derated, delayed, or redesigned
  because of transient behavior rather than headline MW? At what scale does this start to bite —
  10, 50, 200 MW?
- Does anything in our framing feel over-indexed — a paper problem rather than a field problem?

### 2 · The model — does it capture what decides the outcome?

*Our claim (measured, Part 1):* the verdict is decided by the demand shape — chip smoothing and
fleet synchronization flip FAIL to survivable; nothing on the supply side can. Supply sizing is
asymmetric: undersized BESS or switchgear is catastrophic, oversizing rescues nothing. Bigger
equipment cannot fix an unsmoothed, fully-synchronized fleet.

- Does that hierarchy feel physically right to you? Anything in it that contradicts your
  experience?
- The model omits power factor under swing, inrush at checkpoint recovery, slew rates, harmonics,
  cooling transients. Could any of those *change a verdict* at this scale — or are they decimals
  a screening tool can ignore?

### 3 · The numbers — can we get the few that matter?

*From Part 1, only a handful of inputs deserve real scrutiny:* the smoothing credit (verdict-
flipping, currently an estimate from public NVIDIA material), the synchronization a real fleet
actually runs at, and the per-phase amplitudes.

- Can these be derived or bounded from specs and rack architecture by people in this room, without
  owning a GB300? Even a conservative min/max on smoothing would let us report verdict bands.
- If it's measurement-only: what's the cheapest credible measurement — one node, one tray? — and
  does node-level behavior even scale to a rack with a shared power shelf and coolant loop?
- What does a real fleet's synchronized fraction look like in practice — is 100% sync a real
  operating point or a theoretical worst case?

### 4 · The business — what's worth paying for, and what defends?

*Our claim:* the simulator is textbook EE and reproducible by anyone competent; the durable pieces
are calibrated power data nobody publishes, and a proof layer ("no workload in this class breaks
the design, or here's the one that does") that consultancies don't offer. Meanwhile NVIDIA DSX now
spans facility design, power, and grid responsiveness.

- Who pays for this verdict — developer, off-taker, utility, financier — and at which moment: LOI,
  lease, interconnection?
- If NVIDIA ships transient validation for its own racks, what's left for a neutral party —
  cross-vendor comparison, utility-side trust, formal guarantees, speed?
- On the proof layer specifically: the system is piecewise-linear with bounded inputs, and today we
  sweep 96 scenarios. Is a real proof a weeks-scale prototype or a research program?

### 5 · The decision — what next?

- Knowing all of the above: what single proof point would most change your confidence — a bounded
  smoothing number, one measured rack trace, a utility engineer validating the check list, or a
  working proof prototype?
- And the blunt version: is this worth more of our time, or is it a feature another company ships?

---

## Part 3 · Reference (read if useful, skip in the meeting)

**The model in brief.** Demand = synthesized workload trace (training-step square wave, checkpoint
dips, job-end cliff) shaped by a per-chip profile (amplitudes + smoothing credit); timing comes
from the customer. Supply = the Helio 2N reference block scaled to the site (feed → MV → transformer
→ LV → UPS → PDU, plus BESS smoothing and N+1 gensets, cooling as lagged demand). 19 pass/warn/fail
checks: component loading (2N and N-1), contracted peak, ramp raw/smoothed, forced-oscillation
screen (0.05–1 Hz), islanded genset capacity and step. An envelope mode sweeps 96 timing scenarios
and reports the worst case with its counterexample.

**Current input confidence.** Amplitudes: literature estimates. Smoothing 50%: public NVIDIA
material, needs a source or bound. Sizing ratios: scaled from a 12 MW reference block. Contract:
site fact. Ramp/oscillation limits: assumptions pending a real large-load study. Timing: customer
input with conservative defaults.

**What we don't claim yet:** utility capacity, construction-ready design, certified grid
compliance, measured rack behavior, proof over all workloads, underwriting. Safe line today:
*"Meridian models workload-driven facility power transients using explicit assumptions and reports
pass/warn/fail readiness against a reference electrical design."*

**External background** (all verified live):
- NVIDIA GB300 NVL72 rack-scale platform — https://www.nvidia.com/en-us/data-center/gb300-nvl72/
- NVIDIA DSX (category validation and competitive threat) — https://www.nvidia.com/en-us/data-center/products/dsx/
- Microsoft/NVIDIA, "Power Stabilization for AI Training Datacenters" — https://arxiv.org/abs/2508.14318
- "EasyRider" rack-level transient mitigation — https://arxiv.org/abs/2604.15522
- 2026 NREL-style 0.1 s H100 measurement paper (data is proprietary → our opportunity) — https://arxiv.org/abs/2604.07345

**Companions:** `MERIDIAN_PRIMER.md` (first-principles education), `MERIDIAN_TEAM_DOC.md` (product
brief), `MERIDIAN_PRODUCT_DIRECTION_REVIEW.md` (positioning), `VERTIV_ASK.md` (cooling data ask).
