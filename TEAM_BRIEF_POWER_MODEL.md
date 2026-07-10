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

*Companion docs: `MERIDIAN_PRIMER.md` (full first-principles education), `MERIDIAN_TEAM_DOC.md`
(product brief). The envelope check is live in the tool's Workload Power section.*
