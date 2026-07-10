# Team Brief — Meridian Power Model: What Matters, and What We're Deciding
**For the EE / formal / product conversations · July 2026 · discussion guide, not a task list**

Meridian evaluates whether an AI data center design survives its workload's power behavior, before
it's built. Before asking anyone to build or validate anything, the first question is ours:
**which inputs actually change the answer, by how much, and is the effect significant?** We measured
it. Everything below starts from that.

---

## Part 1 · What actually moves the answer (measured)

Baseline: the 200 MW demo site, unsmoothed (H100-class) fully-synchronized training fleet →
**FAIL, 4 failing checks**. Each row varies one input and reports the new outcome. (Script:
engine sweep, reproducible; ranges chosen as plausible, not extreme.)

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

## Part 2 · The discussion — four questions per axis

These are conversation starters, not work assignments. The goal of each session is a shared
judgment on four things: **significance, necessity, implementability, barrier.**

### A · Significance — is this a real, first-order problem?

1. Have you seen (or heard of) an AI/HPC load that was curtailed, derated, delayed, or redesigned
   because of *transient* behavior — not headline MW? At what scale does this become first-order:
   10, 50, 200 MW?
2. The published work (Microsoft/NVIDIA power-stabilization paper, arXiv 2508.14318) says
   synchronized training swings are a grid problem at scale. Does that match your intuition, or is
   this being over-indexed?
3. Our model says an unsmoothed, fully-synchronized 168 MW fleet cannot be fixed by buying bigger
   equipment — only by changing the demand shape (smoothing silicon, de-syncing, derating). Does
   that conclusion feel physically right to you?

### B · Necessity — how much fidelity do we actually need?

1. Given the sensitivity table: is a four-number chip profile (high, low, checkpoint, smoothing)
   plus sizing ratios *enough* for a credible pre-engineering screen, or is something first-order
   missing that would change pass/fail (not just precision)?
2. The smoothing credit is the one number that flips verdicts, and ours is an estimate from public
   NVIDIA material. What would you consider a *sufficient* basis for it — a citation, a physical
   bound you could derive, or measurement only?
3. What on this list can stay rough forever for a screening tool: power factor under swing,
   inrush at checkpoint recovery, harmonics, protection coordination, cooling transients? Which
   one, if any, could change a verdict rather than a decimal?

### C · Implementability — can we build the credible version with what we have?

1. Can the amplitudes and the smoothing bound be *derived* — from specs, board/rack architecture,
   component reasoning — by people in this room, without owning a GB300 rack? Roughly how long?
2. If any of it is measurement-only: what's the cheapest credible measurement (one node? one
   tray?), and does it scale to rack-level behavior, or does the rack (shared shelf, coolant loop)
   behave differently?
3. For the formal side: we currently sweep 96 timing scenarios and report the worst case with its
   counterexample. The system is piecewise-linear with bounded inputs. Is turning the sweep into a
   proof ("no admissible workload violates the limits") a weeks-scale prototype or a research
   program — and which checks would you prove first?

### D · Barrier — does any of this defend?

1. The simulator itself is textbook EE — any strong power engineer reproduces it. Do you agree the
   only durable pieces are (a) calibrated chip/workload power data nobody publishes, and (b) a
   proof layer with counterexamples that consultancies don't offer?
2. NVIDIA DSX now spans facility design, power, and grid responsiveness. If NVIDIA ships transient
   validation for its own racks, what's left for a neutral third party — cross-vendor comparison,
   utility-side trust, formal guarantees, speed?
3. Blunt version: knowing what's in this doc, would you invest further here, and what single proof
   point would most change your answer?

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
