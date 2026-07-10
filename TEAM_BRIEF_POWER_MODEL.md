# Team Brief — The Power Model Behind Meridian
**For the EE and formal team conversations · July 2026 · self-contained, no prior context needed**

---

## Part A · The story in ten sentences

1. AI data centers are being built from **static spec sheets** — a chip does X TFLOPS, a rack draws
   Y kW, a site has Z MW — and those numbers routinely turn out wrong in operation.
2. We built **Meridian**: it simulates what the AI workload *actually does* to a facility —
   performance at scale, and above all **power behavior** — before anything is built.
3. The key physical fact: a training cluster is **one synchronized machine**. 100,000 GPUs rise and
   fall in power *together*, every ~3 seconds, dip to ~15% during checkpoints, and fall off a cliff
   when a job ends.
4. At 200 MW scale, that synchronized swing is a **grid event** — it can exceed the utility
   contract, violate ramp-rate limits, and rhythmically shake the grid (utilities screen for
   exactly this).
5. So the simulation has two sides: **demand** = the power draw curve the compute produces;
   **supply** = the electrical chain that must survive it (transformers, UPS, batteries, generators).
6. We tested the supply side's sensitivity: the "boring" components (transformers, switchgear)
   barely change the outcome — **the verdict is decided by the demand curve, the utility contract,
   the battery system, and the generators.**
7. The demand curve is built from two ingredient types: **timing** (when power rises/falls — set by
   the customer's software, so we take it as customer input) and **amplitudes** (how much power in
   each phase — a *hardware characterization* problem).
8. Today our amplitudes are estimates from public documents. **Whether we can produce them
   ourselves — by analysis or measurement — is the question for the EE side.**
9. Today our verdict checks **one** workload scenario at a time; we just shipped a first version
   that checks **all 96 timing combinations** in a bounded family and reports the worst case with
   the exact scenario that causes it. **Whether that can become a real proof is the question for
   the formal side.**
10. If both answers are yes, the product's claim becomes: *"we can guarantee — not simulate,
    guarantee — that this facility design survives any workload in this class, and we can show you
    the exact workload that breaks it if one exists."* Nobody else sells that sentence.

---

## Part B · The four numbers (so everyone knows exactly what we mean)

We describe a rack's power behavior with four numbers. For GB300 today we use:

| # | Name | Meaning | Our current value | Where it came from |
|---|------|---------|-------------------|--------------------|
| 1 | **High phase** | Power during the compute burst, as fraction of max | ~86% | estimate |
| 2 | **Low phase** | Power while GPUs wait during the all-reduce (compute units idle behind clock-gating, but network + memory still hot) | ~59% (45% for chips with no smoothing) | estimate |
| 3 | **Checkpoint dip** | Power while the job pauses to save its state (~20 s) | ~29% | estimate |
| 4 | **Smoothing credit** | How much of the swing the rack's own on-board energy storage absorbs before it reaches the building (GB300-class racks have this; H100-class don't) | 50% | public NVIDIA material |

Everything downstream — every pass/fail — is computed from these four numbers plus the customer's
timing. **#4 alone flips verdicts:** with it, GB300 passes sites that H100 fails.

---

## Part C · EE conversation — each question, with the logic

**Opening frame (say this first):** *"We have a working simulator. We're not asking you to build
anything yet — we're asking whether the model is sound and whether the inputs are obtainable by us.
Your answers decide whether this stays modeled, becomes vendor-verified, or requires a partner."*

### Q1 — "Is the four-number model sound?"
- **Why we ask:** if the abstraction is missing something first-order (power factor swinging under
  load, inrush current when the fleet snaps back after a checkpoint, cooling pumps surging), our
  verdicts could be wrong in kind, not just degree.
- **If they say "sound":** the model stands; everything else is input quality.
- **If they say "missing X":** that's not a failure — that's them specifying v2. Ask them to rank
  what's first-order vs. ignorable. *(Their instinct to add detail is good; what we need is which
  omissions change pass/fail.)*

### Q2 — "Can the four numbers be derived without owning the hardware?"
- **Why we ask:** we don't have a GB300 rack to put probes on. If the numbers can be *derived* —
  from vendor power specs, board design reasoning, component datasheets — then this is desk work
  we can own. If they can only be *measured*, we need hardware access we don't have.
- **If "derivable":** we assign it internally; verdicts get labeled "vendor-verified"; no code
  changes needed — the numbers slot into the same four fields.
- **If "measurement-only":** the roadmap item converts into a **partnership requirement**
  (NVIDIA, Vertiv, or an operator who'll let us instrument a rack). Ask Q4.

### Q3 — "Is 50% smoothing plausible? Can you bound it?"
- **Why we ask:** it's the single most consequential number (it's what makes chip choice matter).
  We took it from public NVIDIA claims. Even a *bound* — "it's physically between 30% and 70%" —
  lets us report best/worst-case verdicts honestly.
- **If "plausible / here's a bound":** we run the verdict at both ends of the bound. Stronger, not
  weaker.
- **If "no idea / depends on firmware":** we downgrade the smoothing credit to a labeled assumption
  and it becomes the top item for the NVIDIA conversation.

### Q4 — "If measurement is unavoidable, what does it cost?"
- **Why we ask:** to size the ask before we make it to a partner. Also: is measuring **one node**
  and scaling up credible, or does rack-level behavior (shared power shelf, coolant loop) not
  scale linearly?
- **Their answer is the budget line** for the calibration roadmap. No wrong answers.

### Q5 — "Are our loss assumptions sane?" (UPS 96%, transformer 99%, PDU 99.5%)
- **Why we ask:** cheap sanity check; wrong losses shift every curve a few percent.

### Q6 — "Does this feel adjacent to what we do, or like a different discipline?"
- **Why we ask:** honest capability check. The pitch says "from die to data center is one
  discipline" — we want the people who'd do the work to agree, or tell us the credible minimum.
- **Listen for:** whether they light up or flinch. Either is information.

---

## Part D · Formal conversation — one core question, explained

**The setup (plain language):** our simulator answers *"does this ONE workload pass?"* But an
off-taker's workload changes over the life of the lease, and nobody can promise their training jobs
will always look like our test trace. So the question a real sign-off needs is:

> **"Is there ANY workload — within agreed physical limits — that breaks this design?"**

This is exactly the shape of the problem formal verification solves for chips: don't test some
inputs, **prove it for all inputs, and when the proof fails, produce the exact input that breaks
it** (the counterexample). A counterexample here is extremely useful commercially: *"your design is
fine unless the customer runs >75% synchronized fleets with 1-second iterations — cap that in the
lease or add battery."*

**What exists today (v1):** a brute-force sweep — 96 combinations of timing parameters, worst case
reported with its counterexample. Honest, but a sample, not a proof.

**The question for them:**
> The system being checked is mathematically tame: linear component chains, first-order lags
> (cooling, battery smoothing), one saturation (battery power limit), bounded inputs (the four
> amplitudes, synchronization 0–1, timing ranges). The properties are threshold checks (peak ≤
> contract, ramp ≤ limit, oscillation band-power ≤ limit). **Can "no admissible workload violates
> the limits" be proven outright — reachability / SMT / analytic worst-case — rather than sampled?
> And is that a weeks-scale prototype or a research program?**

- **If "tractable, weeks":** this becomes the formal team's product surface and the durable moat —
  engineering firms sell simulation studies; we'd sell guarantees with counterexamples.
- **If "the oscillation property is hard":** expected (it's frequency-domain); ask whether the
  other checks can be proven and oscillation kept as a sweep — a hybrid proof is still a
  categorically stronger claim than pure simulation.
- **If "research program":** the v1 sweep stays, honestly labeled "bounded exhaustive scan," and
  we revisit after calibration lands.

**Bonus question (genuinely digital-design):** during all-reduce, compute units idle behind
clock/power gating while the network and memory run hot — from your knowledge of these
architectures, what fraction of peak power remains? *(This is our "low phase" number — we assume
45% — and it sets the swing amplitude everything depends on.)*

---

## Part E · One-glance answer map

| They say… | It means… | We do… |
|---|---|---|
| Model sound, numbers derivable | Best case | EE derives amplitudes → "vendor-verified" verdicts |
| Model sound, measurement-only | Access problem, not competence problem | Size the measurement (Q4), take it to NVIDIA/Vertiv/operator |
| Model missing first-order effects | They're designing v2 for us | Ask them to rank omissions by "changes pass/fail?" |
| Smoothing bound available | Verdicts get best/worst-case bands | Run both ends of the bound |
| Formal: provable in weeks | The moat is real | Prototype the proof; sweep becomes fallback |
| Formal: research program | Moat deferred, not dead | Keep the sweep labeled honestly; revisit post-calibration |

---

## Part F · The diligence questions we actually need answered

Use this section to keep the conversation from becoming a generic technical review. The goal is to
decide three things:

1. **Can it be built, and does it make sense to build?**
2. **Is the barrier to entry high enough to support a real company story?**
3. **Is the underlying problem actually a real issue, or are we inventing one?**

### 1 · Can it be built?

Ask EE:

- **What is the minimum credible measurement or derivation package for a v1 sign-off?** For example:
  one H100/H200 rack trace plus one GB300-class vendor trace, or one instrumented tray scaled to a
  rack, or vendor-provided phase-amplitude tables.
- **Which current inputs must become measured before anyone should trust a customer-facing
  verdict?** Force a ranked answer: high/low/checkpoint amplitudes, smoothing credit, slew rate,
  power factor/reactive behavior, cooling lag, BESS response, genset step response.
- **What is the pass/fail sensitivity to each uncertain input?** If smoothing moves a 200 MW site
  from FAIL to WARN, what bound is required before we can show that result honestly?
- **What is the exact source for the 50% smoothing credit?** Bring the citation into the room and
  confirm whether it applies to GB300 NVL72 rack power, software power management, or a different
  layer of the stack. If the source is ambiguous, treat 50% as an assumption and report bands.
- **Can the product report confidence bands instead of one verdict?** Example: "PASS if smoothing
  is >=42%, FAIL below 31%." This may be more credible than pretending a single public estimate is
  a fact.
- **What data can we get without hardware access, and what data requires a partner?** This splits
  internal work from NVIDIA/Vertiv/operator partnership work.
- **What would make you personally unwilling to put your name on the model?** This is the fastest
  way to expose first-order omissions.

Ask formal:

- **Can the current checker be reduced to a clean mathematical model?** List every state variable:
  IT trace, first-order mechanical lag, BESS lag, BESS power saturation, component ratings, ramp
  window, oscillation screen, genset step window.
- **Which checks are monotone or analytically worst-caseable?** Contracted peak, component loading,
  ramp, BESS saturation, and genset step may be easier than the forced-oscillation screen.
- **Which checks need SMT/reachability, and which should remain sampled?** A hybrid answer is still
  valuable if it proves 15 checks and sweeps the hard spectral one.
- **Can a failed proof produce a usable counterexample?** The commercial output is not "SAT"; it is
  "75% synchronized, 1 s iteration, 20 s checkpoint breaks contracted peak by 8 MW."
- **What is the prototype scope in weeks?** One property, one chip profile, one site, one bounded
  timing envelope is enough to test feasibility.
- **What assumptions must become explicit for a proof?** Timing bounds, allowed workload classes,
  sampling interval, BESS control law, and whether trace amplitudes are constants or intervals.

### 2 · Is the barrier high enough?

The honest answer from the current docs is: **the UI and base simulation are not the moat.**
Competent MEP, power, or vendor teams can build a transient simulator. The possible moat is the
combination of:

- chip/workload telemetry that others cannot easily get;
- vendor-calibrated cooling and power data;
- a formal envelope proof that engineering consultancies do not normally sell;
- a repeatable off-taker/spec-sheet workflow that turns the proof into a buying artifact.

Ask EE:

- **Who else could produce the same four-number chip profile?** NVIDIA, hyperscalers, ODMs, Vertiv,
  Schneider, Jacobs, ARUP, or any strong power consultant?
- **What would be hard for those groups to reproduce?** Hardware access, fleet telemetry,
  cross-vendor neutrality, workload knowledge, or the translation into finance/off-taker language.
- **Can we get a defensible data advantage within 60-90 days?** If not, the story should lead with
  product workflow plus formal sign-off, not "we own unique power data."
- **Does this sit close enough to Voltai's existing credibility?** If the team says this is a
  different discipline, the company story needs a partner or advisor attached.

Ask formal:

- **Is "facility envelope sign-off with counterexamples" technically distinctive, or just a
  repackaged parameter sweep?** The moat depends on moving past a 96-scenario sweep.
- **Can the proof artifact be shown to customers without exposing proprietary methods?** We need a
  reportable certificate/counterexample, not just an internal solver result.
- **Could NVIDIA DSX, a hyperscaler, or an MEP firm add this quickly once the story is visible?** If
  yes, our defensibility is speed, distribution, and data partnerships rather than pure IP.

### 3 · Is the problem real?

External background says yes, but the brief should not overclaim. The problem is real if buyers
recognize these statements:

- Synchronous training causes large compute-to-communication power swings.
- Checkpoints, startup, shutdown, and job failure create fast load steps.
- Grid operators care about ramp, voltage/frequency disturbance, reactive behavior, and oscillation
  bands.
- Facility planning lacks public, high-resolution workload power data.
- NVIDIA itself is moving into AI factory design/simulation/operations, which validates the category
  and also creates a competitive threat.

Ask EE / utility-facing reviewers:

- **Which exact grid or interconnection studies would flag this?** Name the study, metric, and
  threshold: ramp rate, flicker, voltage sag, frequency response, harmonic/THD, transient stability,
  forced oscillation, protection coordination.
- **Have you personally seen an AI/HPC load rejected, curtailed, derated, or delayed because of
  transient behavior rather than headline MW?** We need real anecdotes or disconfirming evidence.
- **At what scale does this become first-order?** 10 MW, 50 MW, 200 MW, 1 GW? The product wedge
  depends on where the pain starts.
- **Is inference actually benign, or can prefill bursts / viral demand / agentic workloads create a
  similar issue?** If inference is also risky, the market is larger; if not, training-heavy sites
  are the first wedge.
- **Do off-takers care enough to put workload constraints in a lease?** The counterexample only
  matters commercially if it can become an operating covenant, derating rule, BESS requirement, or
  chip/platform selection decision.

Ask formal:

- **Can the counterexample be translated into a contract constraint?** Example: "synchronized
  fraction <=60% for iteration periods below 2 s unless BESS power is increased by X MW."
- **Can the proof identify the cheapest fix class?** Derate, desynchronize, add BESS, add gensets,
  renegotiate contract, or change silicon. This is how the proof becomes a buying decision.

### External background worth citing in the room

- NVIDIA GB300 NVL72 is an official, rack-scale, fully liquid-cooled 72-GPU / 36-Grace-CPU platform
  with 130 TB/s NVLink bandwidth and 37 TB fast memory. This supports the premise that AI hardware
  is now sold at rack scale, not just chip scale: https://www.nvidia.com/en-us/data-center/gb300-nvl72/
- NVIDIA DSX explicitly spans AI factory design, simulation, operations, power, cooling, and grid
  responsiveness. This validates the category but means Meridian needs a clear wedge against
  NVIDIA's own platform story: https://www.nvidia.com/en-us/data-center/products/dsx/
- The Microsoft/NVIDIA "Power Stabilization for AI Training Datacenters" paper states that
  synchronized training creates large power swings and that frequency content can interact with
  utility critical frequencies: https://arxiv.org/abs/2508.14318
- The 2026 EasyRider paper frames rack-level mitigation of training power transients as an active
  systems problem and calls out synchronization, startup/shutdown, and checkpointing as sources of
  fast swings: https://arxiv.org/abs/2604.15522
- The 2026 NLR measurement paper says high-resolution AI power data is largely proprietary and
  demonstrates 0.1-second H100 workload measurements for whole-facility planning. That supports the
  "data gap is real" claim: https://arxiv.org/abs/2604.07345

*Companion docs: `MERIDIAN_PRIMER.md` (full first-principles education), `MERIDIAN_TEAM_DOC.md`
(product brief). The envelope check is live in the tool's Workload Power section.*
