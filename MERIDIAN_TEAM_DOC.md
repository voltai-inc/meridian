# Meridian — Internal Product Brief
**VoltAI DC Intelligence · July 2026 · Confidential**

---

## What It Is

**One-line positioning (deck register):** *Simulation that stress-tests a facility against its AI
workload — utilization at scale, power transients, cooling — before it's built.* Parallel to the
other Voltai lines: formal engines prove the chip before tape-out; agents navigate the system;
Meridian stress-tests the facility. Same discipline, one level up.

Meridian is a pre-engineering AI data center compute-readiness tool. You put in a utility study or site power claim — MW, voltage, service type, power factor, climate, land, and target workload — and it translates that input into a compute-ready specification: rack count, chip platform, cooling fit, workload performance expectations, build risks, and an off-taker-facing spec sheet.

The emphasis on "actually" is the whole point. The market currently relies on nameplate specs: a chip does X TFLOPS, a rack draws Y kW, a broker says Z MW is available. None of these numbers reflect operational reality. xAI Colossus launched at ~20% MFU before months of optimization. Grok/Microsoft built a billion-dollar campus for the wrong GPU generation. These are not edge cases — they are the norm.

Meridian's job is to close the gap between power availability claims and compute-ready design before capital is committed.

---

## The Problem It Solves

When a developer gets a site from a broker, they receive two numbers: megawatts available and square footage. Everything else — chip selection, cooling design, power quality, cluster efficiency, financial return — has to be figured out through months of engineering engagement (typically 4–6 months with a firm like ARUP for a reference design).

Meridian compresses that into minutes for the initial evaluation. Not to replace the engineering — that still has to happen — but to answer the first-order questions fast enough to decide whether a site is worth pursuing at all, and to walk into the engineering engagement with a clear specification rather than a blank slate.

The deliverable is a **Spec Sheet**: a structured pre-build summary that an off-taker can review for an LOI and an engineering firm can use as a starting scope document. Commercial sensitivity stays in the internal advisory report; it is not the primary proof point.

---

## What "Power Simulation" Means Here

"Power simulation" gets used loosely, so Meridian splits it into three layers and is explicit about which ones Voltai owns:

| Layer | What it is | Who owns it |
|-------|-----------|-------------|
| **1 · Utility / grid capacity** | Can the grid deliver X MW — load flow, contingencies, queue position | The utility study. Always an **input** to Meridian, never a prediction. |
| **2 · Workload power behavior** | The power draw curve the compute actually produces: training-step oscillation, checkpoint dips to ~15%, synchronized fleet ramps, job-end cliffs | **Voltai amplitudes × customer timing.** Amplitudes come from the chip power profile (GB300/Rubin on-board smoothing damps the swing — documented NVIDIA feature; cooling type sets the mechanical ratio) — the power/hardware EE side's measured versions are the upgrade (formal's role is methodological — the checks are assertion-checking against a model). Timing (iteration period, checkpoint cadence, synchronized fraction) is the **off-taker's data**, entered as the workload profile in Meridian (conservative synchronized archetype by default; measured CSV telemetry in the full bench). |
| **3 · Transient survivability** | Slam the layer-2 curve against the electrical design: UPS/genset/BESS per path, N-1, contracted-capacity, ramp and oscillation limits | **Voltai — modeled today.** 19 pass/warn/fail checks, run inline in Meridian and in the full Workload Power Validation bench. |

Layers 2+3 together are "the power simulation." The chip picker is not the product — it is one input to the design whose power behavior gets simulated and validated.

**The supply template is not load-bearing** (sensitivity-tested July 9): ±20% on transformers/switchgear/PDU leaves the verdict unchanged; it is decided by the contract (peak vs contracted MW), BESS, gensets, and the chip's demand shape. With unsmoothed H100-class demand, upgrading BESS+gensets+UPS simultaneously *still* fails on the contract — the fix is demand-side. Full table and the hardware-team feasibility questions: `MERIDIAN_PRIMER.md` §7–8.

**Two models, one set of inputs.** The same left-rail workload inputs (training/mixed/inference, model size, batch) drive two separate models: the **performance model** (MFU at scale, tokens/sec, inference Pareto — "how much compute do you get," shown in Compute Design) and the **power model** (layers 2+3 — "does the electrical design survive," shown in Workload Power). Demand vs supply in the power model: the **demand** is the workload trace at the site's IT MW shaped by the chip's power profile; the **supply** is the Helio 2N reference block scaled to the site — a template, because no site-specific one-line exists at pre-engineering. A FAIL verdict therefore reads: *our reference design, sized this way, would not survive this workload* — not a claim about the site.

**Chip choice now changes the verdict** (added July 9): on the 200 MW demo with a fully synchronized training fleet, GB300 and Vera Rubin come out **WARN** (on-board smoothing keeps the peak inside the contract and the BESS bridges the islanded step), while H100/H200/B200-class platforms **FAIL** (raw synchronized swing breaks contracted peak, UPS N-1, and genset checks). Every chip card shows its own power verdict.

---

## Current State

The tool is a working prototype deployed at `meridian-web-swart.vercel.app`. It is a static web app — no backend, no database, runs entirely in the browser.

**What's modeled:**
- Site inputs auto-detect climate zone and grid operator from address
- PUE calculated from cooling approach, heat rejection type, and climate
- Chip selection across 9 platforms (GB300, GB200, B200, H200, H100, Vera Rubin, MI355X, MI300X, Gaudi 3), filtered by power architecture (480V AC vs 800V DC)
- MFU modeled from published benchmarks with communication overhead penalties for cluster scale, model size, parallelism strategy (TP/PP/DP/hybrid), and network topology
- **Workload power validation, inline (added July 9):** the selected design's workload power trace is simulated against the Helio 2N reference block scaled to the site's IT load — 19 checks covering component loading (2N and N-1), contracted-capacity peak, grid ramp rate raw vs BESS-smoothed, forced-oscillation screen (0.05–1 Hz), and islanded genset capacity/step tolerance. The verdict appears in the KPI strip, the Workload Power section, the off-taker spec sheet, and the advisory report. "Open full validation" deep-links into the standalone bench with the whole design prefilled.
- Commercial sensitivity model: full operator perspective (facility + GPU capex), GPU rental revenue, rate erosion, refresh capex
- Equipment BOM with lead times (transformers, CDUs, switchgear, UPS, generators)
- Multi-chip inference Pareto chart: tokens/sec/user vs tokens/sec/MW across all chips at equal power budget

**The demo story:** on the 200 MW IID demo with a fully synchronized training fleet, chip choice decides the verdict — GB300/Rubin (on-board power smoothing) come out WARN, H100-class platforms FAIL on contracted peak, UPS N-1, and genset checks. Sizing IT from annualized PUE leaves no transient headroom unless the silicon damps the swing. That is the failure mode operators discover after energization, caught here at design time — and it makes "which chip" a power question, not just a performance question.

**What is assumed (not measured):**
- MFU values come from published papers and analytical communication overhead models. They have not been validated against real cluster telemetry.
- Cooling performance (CDU capacity, trim cooler efficiency) uses Vertiv spec sheet steady-state values, not transient training load data.
- GPU rental rates are market estimates, not signed contracts.
- Utility capacity, queue position, and interconnection availability are not modeled by Voltai. They are inputs from a utility study or broker claim.
- Power quality (THD, voltage sag, fault ride-through) is not modeled in Meridian today and remains an open item.

Every assumption is surfaced explicitly — "modeled, not measured" tags inline, and an Open Items checklist in the spec sheet output.

---

## Product Structure (rebuilt July 8, 2026)

Two stages, framed as a pipeline — the same site at two confidence levels:

| Stage | What it does |
|-------|-------------|
| **01 Screen** | Pre-study site brief from broker claims: power situation advisory, what you could build if power is confirmed, internal commercial sensitivity, flags, and questions for the utility before spending $50K on the study. Everything labeled UNVERIFIED. Ends with "Continue to Design," carrying inputs forward. |
| **02 Design** | Study-input workspace. Left rail: study facts + **confidence ladder** (broker-claimed → study-verified → vendor-verified → telemetry-calibrated; last two are roadmap rungs) + workload controls. Sticky KPI strip: GPUs · nameplate→at-scale MFU · usable IT load · capex per sustained PFLOPS · time-to-first-training-run · **live workload-power verdict** (click-through). Five sections: **Power** (study facts, confidence boundary, interruptible/expansion warnings), **Compute design** (design alternatives with per-chip scenario rates, MFU-vs-scale, inference Pareto, NVIDIA DSX 6-point check), **Workload power** (simulated meter-power trace with BESS smoothing, transient stats, all 19 checks, verdict, deep link to the full bench), **Sensitivity** (internal commercial scenario, NPV/IRR/EBITDA/CapEx), **Build** (BOM with critical path, open items before LOI). |
| **Deliverables** | Full-screen takeover, two separate documents: the **2-page Off-Taker Spec Sheet** (technical readiness deliverable — no NPV/IRR hero metrics) and the **Advisory Report** (internal: full narrative, DSX table, commercial sensitivity, risk matrix). Both printable; shareable URL reproduces exact state. |

Modeled-vs-measured honesty is surfaced inline ("modeled, not measured" tags on MFU and performance figures) and in the spec sheet's Open Items section, rather than a separate Data Gaps tab.

Modules: **Workload Power Validation** is no longer a sibling tool — its engine (`power-validation.js`, shared between both pages) runs inline in Meridian's Workload Power section, and the standalone page remains the full bench with every design knob exposed (Meridian deep-links in with the design prefilled). **Helio Reference Architecture** supplies the 2N block whose scaled ratios Meridian validates against. Visual language: Voltai design system light theme (`_ds/` tokens + Space Grotesk / IBM Plex fonts).

---

## What We Still Need

### From Chip Team (internal)
- Real MFU calibration from actual cluster telemetry — training and inference separately
- Power draw time series by training phase: all-reduce, backward pass, checkpoint spike, idle
- These turn "estimated 52% MFU" into a provable number

### From Vertiv (relationship open — Giordano Albertazzi, CEO)
- CDU transient performance under AI training load profiles (specifically checkpoint spikes)
- Trim cooler efficiency curves at 25°C / 30°C / 35°C / 40°C ambient wet-bulb
- Without this, the cooling model is based on steady-state spec sheet values only

### From Site / Data Room
- Power quality report: THD, voltage sag, fault ride-through
- Interconnect study: queue position, energization date, upgrade scope
- These determine whether the headline MW is deliverable and on what timeline

---

## What This Is Not

Meridian is not a construction specification. It is not investment advice. It is not a substitute for engineering engagement. The spec sheet explicitly states this.

It is a pre-qualification and specification tool — a way to quickly determine whether a site is worth the 4-6 month engineering commitment, and to walk into that engagement with a clear compute-readiness brief rather than a cold RFP.

---

## Business Context

Voltai's role in the DC space is being tested and defined through this prototype. The relevant business models:
- **Tech Pack**: flat fee per analysis deliverable
- **Owner Rep**: % of gross lease value upfront (Chase's framing: developer who drives the build, captures % of the off-taker lease)
- **Developer of Record**: equity stake in the project

Meridian supports these models by producing the technical artifact that makes the conversation concrete. The commercial sensitivity model is internal; the spec sheet is the artifact you hand to an off-taker or engineering firm.

---

## Immediate Next Steps

1. Get chip team to review MFU assumptions — even a ballpark validation ("our GB300 clusters run 50–55% MFU") would let us label the number as verified and light up the "vendor-verified" rung of the confidence ladder
2. Send Vertiv technical ask (see separate document)
3. ~~Connect a selected Meridian design into Workload Power Validation~~ **Done July 9** — validation runs inline; the standalone bench is the deep-linked full version
4. Replace synthesized workload traces with chip-measured power traces (chip team power draw time series by training phase) — this is the highest-value upgrade to the validation verdict
5. Use on a real live site — run Meridian against the Louisiana site or the Alberta site from Brian's list, generate the spec sheet, and see if it's useful for the off-taker conversation
6. Decide if the commercial sensitivity model should offer a "developer perspective" toggle (facility only, lease revenue) vs the current "operator perspective" (full capex, GPU rental revenue)
7. Confidence bands on MFU and PUE instead of single-point estimates (per the product direction review)
