# Meridian Primer — Every Concept, From First Principles
**Internal education doc · July 2026 · written for Eric, useful for anyone touching Meridian**

The goal of this doc: after reading it, every number and control in Meridian should feel obvious,
and any logic gap in the product should be visible to you. No prior ML-infrastructure background assumed.

---

## 1 · The two jobs a GPU cluster does

### Training — building the model
Training teaches a neural network by showing it data and correcting its errors, billions of times.
Mechanically, every ~3 seconds the whole cluster does one **step**:

1. **Forward pass** — run a batch of data through the model (heavy math, GPUs near max power)
2. **Backward pass** — compute how wrong it was and what to adjust (heavier math)
3. **All-reduce** — every GPU *must exchange its results with every other GPU* and agree on the
   update before anyone can continue (math pauses, network works, power dips)
4. **Optimizer step** — apply the update, go to 1

The critical property: **training is one synchronized machine.** 100,000 GPUs march in lockstep.
Nobody starts step N+1 until everyone finishes step N. This has two enormous consequences:

- **Performance:** the slowest link (usually communication) stalls everyone → efficiency falls as clusters grow (§3).
- **Power:** the entire fleet's power rises and falls *together*, every ~3 seconds (§6).

Two more training behaviors that matter for power:
- **Checkpoints.** Every ~20 minutes the job pauses to save the model to storage (so a crash doesn't
  lose weeks of work). During the ~20 seconds of saving, GPUs sit near-idle → the whole facility's
  draw drops to ~15% and then snaps back. At 168 MW IT, that's a ~140 MW dip and recovery.
- **Job boundaries.** When a run ends (or crashes), draw falls off a cliff in seconds.

### Inference — using the model
Inference is serving the finished model: someone sends a prompt, the model generates a reply.
Millions of small, **independent** requests. Nothing is synchronized — request A doesn't wait for
request B. Demand follows users: a daily wave plus random noise. Power-wise it's a gentle,
slightly wobbly line — boring, in the best way.

Inference has two internal phases with *different bottlenecks*:
- **Prefill** — reading the prompt. Compute-bound (like a mini forward pass).
- **Decode** — generating tokens one at a time. Each token requires reading the *entire model* from
  memory → **memory-bandwidth-bound**, not compute-bound. This is why the chip table carries
  `hbm` (memory bandwidth in TB/s) — for decode-heavy inference, bandwidth is the spec that matters,
  not TFLOPS.

### Why the toggle changes everything downstream
| | Training | Inference |
|---|---|---|
| Synchronization | Total — one machine | None — independent requests |
| Power curve | Square wave + checkpoint dips + cliffs | Smooth daily wave + noise |
| Bottleneck | Communication between GPUs | Memory bandwidth per GPU |
| Efficiency metric | MFU (§2) | tokens/sec/user vs tokens/sec/MW (§5) |
| Grid risk | High (oscillation, ramps, dips) | Low |

That one toggle is legitimately a global input: it changes the performance model, the power model,
and the economics simultaneously. It lives at the top of Compute Design, next to the design it shapes.

---

## 2 · MFU — the honesty metric

**MFU = Model FLOPs Utilization = useful math actually completed ÷ the theoretical maximum the
chips could do if nothing ever waited.**

A GB300 quotes ~1,400 TFLOPS per GPU. That number assumes the GPU computes every nanosecond.
In a real training job the GPU spends much of its time **waiting**:

- waiting for gradients from other GPUs (all-reduce — the big one at scale)
- waiting for data to arrive from memory
- waiting for the slowest GPU in the step (stragglers)
- waiting during checkpoints
- gaps between kernel launches

MFU is the fraction that survives. 50% MFU = a "1,400 TFLOPS" GPU delivering 700.
**MFU is a multiplier on the entire facility**: 20% vs 50% MFU is the difference between your
200 MW site being effectively an 80 MW site or a 200 MW site, from the customer's point of view.
xAI's Colossus launched around ~20% and took months of software co-optimization to climb. That's
the single most expensive surprise in this industry, and it's why Meridian refuses to quote nameplate.

### Why MFU falls as clusters grow
All-reduce cost grows with GPU count — more participants must agree each step. Communication time
becomes a larger share of each step, so the compute fraction (MFU) shrinks. That's the downward
curve in "Training MFU vs. cluster scale": it's not pessimism, it's arithmetic. Model size pushes
the same direction (bigger gradients to exchange), which is why the model-size selector moves MFU too.

### What would make our MFU numbers *verified* instead of modeled
Real telemetry from real clusters per chip generation ("our GB300 pods run 50–55% at 16k GPUs").
Until then, every MFU in Meridian carries "modeled, not measured" — that's the vendor-verified /
telemetry-calibrated rungs of the confidence ladder.

---

## 3 · Parallelism — why Meridian auto-picks it

A 70B-parameter model needs ~140 GB just to store weights — more than any single GPU's memory.
The model must be split. There are exactly three ways to split, and they compose:

- **Tensor parallel (TP):** split every matrix across a few GPUs. They must talk *constantly*
  (multiple times per layer), so TP only works inside the ultra-fast NVLink domain — the copper
  backplane within a rack (72 GPUs in an NVL72, 8 in an HGX node). TP never crosses racks.
- **Pipeline parallel (PP):** split the model's *layers* into stages (GPUs 1–8 hold layers 1–10,
  etc.). Communication is modest (hand activations to the next stage), so PP can cross racks.
- **Data parallel (DP):** clone the whole (TP×PP-split) model many times, feed each clone different
  data, and average their gradient results every step. That averaging *is* the all-reduce from §1.

**Why it's auto-selectable:** the choice is nearly forced by three known quantities —
model size, GPU memory, and interconnect domain size. The standard recipe: TP fills the NVLink
domain, PP covers whatever of the model still doesn't fit, DP replicates across the rest of the
cluster. Given chip + model size + cluster size, an engineer would land within one notch of the
same answer every time. Exposing TP/PP/DP as user inputs would add three confusing knobs to
produce the same result — so Meridian computes the recipe and shows its consequences (MFU) instead.

---

## 4 · Topology — the network's job

Two different networks live in an AI data center:

- **Scale-up** (inside the rack): NVLink copper, terabytes/sec, nanosecond-class latency.
  This is where TP lives. It comes with the rack — you don't design it, you buy it.
- **Scale-out** (between racks): InfiniBand or Ethernet in a leaf-spine tree. This is where DP's
  all-reduce lives, and it's the part that erodes MFU at scale.

**"Rail-optimized"** (mentioned in Helio) means: GPU #1 of *every* node connects to the same "rail"
of switches, GPU #2 to the next rail, and so on. All-reduce traffic then flows within rails and
mostly avoids the spine — measurably better MFU at scale. It's the standard NVIDIA SuperPOD pattern.

Topology matters to Meridian for one number: it sets communication time per step, which sets the
MFU-at-scale curve. Today the topology is assumed (rail-optimized leaf-spine, per Helio); simulating
*alternative* topologies is on the roadmap, not in the product.

---

## 5 · Inference batch size and the Pareto chart

When serving a model, you can process many users' requests together in a **batch**. Bigger batch =
the cost of reading the model from memory is shared across more users = far better throughput per
MW. But everyone in the batch waits on the batch → each individual user gets tokens more slowly.

That's a genuine tradeoff with no single right answer, so it's a curve:
**tokens/sec/user (speed one customer feels) vs tokens/sec/MW (efficiency the operator monetizes).**
Batch size is the dial that moves you along the curve. Different chips trace different curves —
a bandwidth-rich chip (GB300, 8 TB/s HBM) holds user-speed at high batch far better than H100
(3.35 TB/s). The chip that's fastest for one user is usually not the most efficient per MW — that's
why the chart exists: the "best inference chip" depends on which end of the curve your SLA sits at.

*(The batch slider lives inside this chart's panel — it only moves the operating point here.)*

---

## 6 · The power story — how compute behavior becomes a grid problem

Everything from §1 becomes electrical:

| Compute behavior | Electrical consequence |
|---|---|
| Synchronized steps every ~3 s | The whole fleet's MW swings together — a square wave at ~0.33 Hz. Grids screen for exactly this ("forced oscillation") because rhythmic MW at these frequencies can couple to the grid's own natural swing modes. |
| Checkpoint pause | Fleet drops to ~15% for ~20 s, then snaps back — a huge dip and re-ramp the utility sees at the meter. |
| Job end / crash | ~150 MW disappears in seconds — the worst single "step" the gensets would ever face islanded. |
| Peak compute burst | The facility's true peak exceeds the *average* the PUE math sized — contracts are written on peak. |

**The defense stack, in order:**
1. **On-board smoothing** (GB300/Rubin-class): NVIDIA's published system is three mechanisms —
   power-cap ramping at workload start, 65 J/GPU of capacitor storage in the power shelves (enough
   for sub-second spikes only — do the math: ~0.1 s of a half-swing), and a "burn" mode that keeps
   GPUs consuming through lulls and tapers gently at job end. Net effect: the low phase rises (at a
   real energy cost) and the edges soften; the steady high phase is largely untouched. This is why
   chip choice changes the power verdict — and why our symmetric-compression model needs the EE
   review (see gap list).
2. **BESS** (facility battery): absorbs the fast component of whatever still reaches the meter.
   When the checks say "BESS is load-bearing," it means the design only passes because of it.
3. **Gensets**: carry the load if the utility drops. Diesel engines can only *step* ~40% of their
   rating at once — a synchronized fleet violates that without BESS bridging the step.
4. **Derating / de-synchronizing**: run less IT than the PUE math allows, or schedule jobs so
   fleets don't swing in phase. The cheapest fix, and nobody wants to hear it.

**Cooling is demand, not supply.** CDUs (liquid-to-liquid cooling distribution units) and dry
coolers *consume* power that tracks the IT load with a thermal lag. Chip choice sets the cooling
type (CDU vs full DLC), which sets that ratio. PUE is the annualized average of this overhead —
useful for energy economics, dangerously misleading for peak sizing, which is exactly the trap
the demo site falls into.

---

## 7 · Supply and demand — the full picture

```
DEMAND (what the compute pulls)              SUPPLY (what delivers the power)
─────────────────────────────                ─────────────────────────────────
chip power behavior                          utility feed at contracted MW
  × racks × synchronization                    → transformers → switchgear
  + cooling load (follows IT with lag)         → UPS → PDU → racks
  = the power draw curve                     + gensets (carry load when islanded)
                                             + BESS (absorbs the fast swings)
        └──────────── 19 checks: does supply survive demand? ────────────┘
```

Note carefully which side cooling is on: CDUs and dry coolers **consume** power that follows the
IT load — cooling is demand. The supply side is only the delivery chain: things with ratings that
can be exceeded.

### Does the supply template actually matter? (measured, not asserted)

The natural objection: *"your supply side is a made-up reference block — why would anyone trust a
verdict built on it? Wouldn't different transformers/switchgear/UPS/PDU change the answer?"*
We ran the sensitivity directly (200 MW demo site, training fleet):

| Change to the supply side | H100-class demand (raw swing) | GB300-class demand (smoothed) |
|---|---|---|
| Baseline template | **FAIL** · 4✗ | **WARN** · 0✗ |
| Transformers / switchgear / feed **+20%** | FAIL · 4✗ (unchanged) | — |
| Transformers / switchgear / feed **−20%** | FAIL · 8✗ (worse) | WARN · 0✗ (unchanged!) |
| UPS +20% | FAIL · 3✗ | — |
| PDU +20% | FAIL · 4✗ (unchanged) | — |
| BESS **+50%** | FAIL · 3✗ | — |
| BESS **−50%** | FAIL · 8✗ | **FAIL** · 5✗ (flips!) |
| Gensets +20% | FAIL · 2✗ | — |
| BESS+50% **and** gensets+20% **and** UPS+20% | **still FAIL** · 1✗ (the contract itself) | — |

Three conclusions, and they are the answer to the objection:

1. **The passive chain is asymmetric, not insignificant.** Oversizing transformers, switchgear,
   feed, or PDU by 20% barely changes anything — but *undersizing* them by 20% doubles the failure
   count (see the −20% row). Standard ratios sit near the edge: the supply model's job is catching
   undersizing, not rescuing demand.
2. **The verdict lives in four places:** the **contract** (peak vs contracted MW — a site fact),
   the **BESS**, the **gensets**, and the **demand shape** (chip smoothing × synchronization).
   Those are exactly the knobs Meridian exposes (chip cards, service type) and the bench lets you
   turn (BESS/genset sizing).
3. **With unsmoothed demand, you cannot buy your way out with equipment.** Upgrading BESS, gensets
   and UPS *simultaneously* still fails — the remaining violation is the contracted peak. The fixes
   are demand-side: smoothing silicon, derating IT, de-synchronizing, or renegotiating the contract.
   That is a *finding*, and it's why the demand side (where our data advantage is) is the product's
   center of gravity, not the supply template.

So the honest pitch line: *"the supply side is standard practice — we show the verdict is
insensitive to the parts we templated and expose the few that matter; the demand side is where
nobody else has the data."*

---

## 8 · Feasibility review with the hardware team

**Who owns what — this matters.** Formal verification people prove *logic* correct (RTL, properties,
model checking); power draw curves are **power/system EE** territory (power delivery, power
integrity, board and rack transients). The formal connection to Meridian is methodological — the 19
checks are assertion-checking against a model, which is the narrative bridge — but the amplitude
characterization questions below are for whoever does power/hardware EE. One exception marked (Q1b)
is genuinely a digital-design question.

The chip power profile Meridian consumes has two ingredient types — **amplitudes** (how much power
in each state) and **timing** (when states change). Timing is the customer's data (see below).
Amplitudes are hardware characterization — which raises the real internal question: **is producing
them realistic and buildable for us?** Frame it as a feasibility review, not a data request:

  1. **Is the model sound?** Our rack power model is four numbers (high-phase, low-phase,
     checkpoint fraction, smoothing credit) driving a facility-level transient simulation. From an
     EE standpoint, is that abstraction defensible, or is something first-order missing
     (power-factor behavior under swing, recovery inrush, pump/fan transients)?
  1b. **(For a digital designer.)** The low-phase amplitude is set by what the silicon does between
     compute bursts — clock/power gating on the tensor units while NVLink and HBM stay active during
     all-reduce. From your knowledge of these architectures, what fraction of peak dynamic power
     remains in that phase? (We assume 45%.)
  2. **Can the amplitudes be derived without owning the hardware?** We don't have a GB300 NVL72 to
     instrument. Can per-phase draw and slew be derived analytically — from vendor power specs,
     board/PDN design data, component power states — the way power EEs reason at the
     silicon/board level? Or is this measurement-only?
  3. **The smoothing number specifically:** we credit GB300-class on-board energy storage with
     damping ~50% of the 3-second training-step swing (from public NVIDIA material). From what you
     know of that power architecture, is 50% plausible? Could you bound it (worst/best case)
     analytically? This single number moves our pass/fail verdict more than any other input.
  4. **If measurement is unavoidable,** what would it actually take — equipment, access to a
     partner's rack, time, cost? Is there a lighter path (single node or single tray instead of a
     full rack, scaled up)?
  5. **Is this a natural extension of our stack or a different discipline?** The pitch is "prove
     the chip → navigate the system → stress-test the facility." Does modeling rack-to-facility
     power transients feel adjacent to our existing engines to you, or would we be faking expertise
     we don't have? What would you consider the minimum *credible* version?
  6. Chain-loss sanity: UPS 96% / transformer 99% / PDU 99.5% — reasonable defaults?
- **Timing — the CUSTOMER'S data, not derivable from silicon (and now an input in the product):**
  Iteration period (~3 s), checkpoint cadence (~20 min) and duration (~20 s), synchronized fraction
  are set by the off-taker's training framework, model size, checkpoint policy, and storage
  bandwidth. The product treats them accordingly — three tiers of input fidelity:
  1. **No off-taker yet:** conservative fully-synchronized archetype (the defaults).
  2. **Off-taker in hand:** their declared profile — the "Workload profile · from your off-taker"
     inputs in Meridian's Workload Power section (iteration period, checkpoint cadence/length,
     synchronized fraction), which flow into the verdict and the deep link to the bench.
  3. **Live customer:** measured telemetry — CSV import in the full validation bench.
  The remaining ask for the chip team is a cross-check: one measured fleet-level power trace from a
  real training run, to validate that a declared profile + our amplitudes reproduces reality.

If the review lands on "sound, and derivable analytically" (Q1–3), the confidence ladder's
"vendor-verified" rung lights up with no code changes — the numbers slot into the same interface.
If it lands on "measurement-only and we lack access," that's equally valuable: it converts the
roadmap item into a partnership requirement (NVIDIA/Vertiv/operator) instead of an internal task.

---

## 9 · So what is Meridian, precisely?

The one-sentence version (deck register): **simulation that stress-tests a facility against its AI
workload — utilization at scale, power transients, cooling — before it's built.** It closes the
ladder with Voltai's other lines: prove the chip before tape-out → navigate the system → stress-test
the facility before ground breaks.

**Meridian is design verification, and selection emerges from verifying all the alternatives.**

For a given (site, workload), each chip card runs the full question:
*"this chip × this workload × this site, on our reference electrical design — does it perform, and
does it survive?"* — and shows GPUs, MFU, and a power verdict. Reading across the nine cards turns
verification into selection: *only these platforms survive here; among them, this one wins on
perf-per-dollar.*

What Meridian deliberately does **not** do today:
- **It does not search the supply side.** It won't answer "what's the minimum BESS that makes H100
  pass?" You turn those knobs by hand in the full validation bench. Inverting the checker into a
  solver ("design synthesis") is the natural next product step — and building the checker first is
  the correct order (it's the formal-verification playbook: you can't optimize against a check you
  don't have).
- **It does not predict the utility.** Contracted MW, ramp limits — inputs, always.

The supply side is the **Helio 2N reference block scaled to the site** because at pre-engineering
there is no real one-line diagram yet. A FAIL verdict therefore reads precisely:
*"the design we would build, sized the obvious way, does not survive this workload."*
That sentence is the product.

### Relationship to the hardware and formal teams
The chip power profile Meridian consumes — per-phase draw levels, checkpoint depth, smoothing
credit — is structurally the same artifact a power/hardware EE produces when characterizing hardware:
a per-state transient power model, one abstraction level up (rack instead of board). Today the
numbers are literature estimates; their measured versions slot into the same interface and move the
confidence ladder from "modeled" to "vendor-verified." And the verdict machinery itself —
*check a design against a property before building it* — is formal verification's shape applied to
a facility. From die to data center is one discipline, which is the expansion story.

### Where the barrier to entry is (and isn't) — honest three-rung version
- **Rung 0 — not defensible:** the UI, the workflow, the electrical simulation math (textbook EE),
  and the per-chip amplitude table itself — a competent power EE derives those four numbers from
  public specs in weeks. Necessary, never a moat.
- **Rung 1 — medium, relationship-based:** *calibration.* Measured traces, validated MFU, vendor
  transient data. Real value, but contested — equipment vendors have more hardware access than us.
- **Rung 2 — the durable differentiator: the formal layer.** A single simulated trace answers
  "does *this* workload pass?" The sign-off question is categorically stronger: **"can ANY
  admissible workload break this design?"** — quantify over all timings and synchronization levels,
  prove the design survives the whole envelope or produce the exact counterexample that kills it.
  That is EDA sign-off transplanted to facilities. Engineering firms run simulation studies;
  nobody offers envelope proofs with counterexamples for facility power — and building them is a
  formal-methods skill that neither MEP firms nor equipment vendors have in-house. **This is where
  the formal team plays** — not producing power curves (power-EE work), but turning simulations
  into guarantees. The first version ships in Meridian today: the **envelope check** in Workload
  Power sweeps 96 timing scenarios and reports the worst case plus its counterexample; the roadmap
  version replaces the sweep with SMT/reachability over the bounded hybrid system (BESS saturation,
  lag dynamics, bounded inputs) — an actual proof rather than a dense sample.

A useful consequence: the envelope check does not need the customer's timing at all — it quantifies
over it. Declared timing gives the *tight* answer; the envelope gives the *safe* one. Sign-off wants both.

---

## 10 · Known gaps — poke here

An honest list of where the current model is weakest, so logic-checking starts in the right places:

1. **Smoothing is modeled as symmetric swing compression; NVIDIA's published mechanisms say
   otherwise.** Burn raises the low phase (consuming real energy our model treats as free) without
   lowering the steady high phase, and the 65 J/GPU capacitors only cover sub-second spikes. A
   corrected asymmetric profile would likely make GB300 verdicts *harsher* on contracted peak while
   improving the job-end/startup ramp checks. Flagged for the EE review before we change code.
2. **Trace timing is declared, not measured.** Timing is now a customer input (workload profile,
   §8) with conservative defaults — the right structure — but a declared profile is only as good as
   the off-taker's answers. The validating cross-check (one measured fleet trace) is still open.
   The hardware/EE side's contribution is the amplitudes: per-phase power levels, slew rates, and
   the on-board smoothing characterization.
3. **MFU is a heuristic curve** (published benchmarks + overhead model), not calibrated telemetry.
4. **The supply side is a template.** Scaled Helio ratios, not a site one-line. Fine for screening;
   the bench exists for hand-tuning; a real study should replace it.
5. **PUE is annualized** in the IT-sizing math while the power model works in peaks — deliberate
   (it's the trap the tool demonstrates) but worth keeping conscious.
6. **Economics assume infinite demand** (80% billed utilization for 10 years, rate erosion aside).
   Demand risk is not modeled anywhere and is arguably the largest real-world risk.
7. **Inference power is modeled benignly** — no thundering-herd events (viral load spikes),
   no prefill-heavy bursts. Probably fine, unverified.

---

*Written July 2026. Companion docs: `MERIDIAN_TEAM_DOC.md` (product brief),
`PRODUCT_PICTURE.md` (pipeline, roles, positioning).*
