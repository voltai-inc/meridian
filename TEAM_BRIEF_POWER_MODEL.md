# Team Brief: Meridian Power Model Review
**Audience: EE, power systems, formal verification, and product leadership | July 2026**

---

## Purpose

Meridian is a pre-engineering tool for AI data center compute readiness. It starts from a site
power claim or utility study and evaluates whether a proposed compute design can support a target
AI workload before capital is committed.

This brief focuses on the power model behind Meridian. The review has three decisions to make:

1. **Buildability:** Can this model be made technically credible with the team and data access we
   have, or does it require a partner?
2. **Defensibility:** Is there a real barrier to entry, or is this a simulator that any strong
   engineering group could reproduce?
3. **Problem reality:** Are workload-driven power transients a real customer and grid issue, or a
   niche edge case?

The current prototype is useful, but it should be treated as a modeled pre-engineering screen, not
as a signed engineering study or utility capacity prediction.

---

## Product Boundary

**Meridian does not predict utility capacity.** Utility MW, interconnection limits, voltage,
service type, ramp limits, and queue position are inputs from the site, broker, utility study, or
interconnection process.

Meridian models the data-center side of the problem:

- how much usable IT load the site can support after PUE and cooling assumptions;
- which chip/rack/cooling architectures fit the site;
- how a workload changes the power draw over time;
- whether a reference electrical design survives the resulting transients;
- what open items must be resolved before LOI, off-taker review, or engineering diligence.

Recommended positioning line:

> Utility study in. Workload-ready compute spec out.

---

## Current Model

Meridian splits the power problem into demand and supply.

### Demand: workload power trace

The demand trace represents what the compute fleet pulls over time. For training workloads, the
model includes:

- synchronized high/low power phases during training steps;
- all-reduce periods where compute units idle while memory and networking remain active;
- checkpoint dips and recovery;
- startup ramp;
- job-end cliff;
- optional synchronized fraction below 100%;
- chip-specific smoothing, where available.

For inference workloads, the model currently uses a smoother demand curve with daily demand shape
and random batch noise. Inference transients are less developed than training transients today.

### Supply: reference electrical design

The supply side is the Helio 2N reference block scaled to the site's IT load. The current checker
models:

- utility feed;
- MV switchgear;
- transformer;
- LV switchgear;
- UPS;
- PDU / busway;
- BESS power and smoothing behavior;
- genset firm capacity and step tolerance;
- mechanical/cooling load with a first-order lag.

The current implementation runs 19 pass/warn/fail checks, including:

- 2N component loading;
- N-1 component loading;
- contracted utility peak;
- raw grid ramp rate;
- BESS-smoothed grid ramp rate;
- forced-oscillation screen from 0.05-1 Hz;
- islanded genset firm capacity;
- islanded genset step-load tolerance.

The supply template is a screening assumption. A real engineering study should replace it with a
site-specific one-line, utility limits, equipment ratings, and vendor data.

---

## Current Chip Power Profile

The current training demand model uses a compact chip power profile. For GB300-class systems the
prototype uses the following values:

| Input | Meaning | Current value | Current confidence |
|---|---|---:|---|
| High phase | Compute burst power as fraction of max | ~86% | Estimate |
| Low phase | All-reduce / wait phase power as fraction of max | ~59% | Estimate |
| Raw low phase | Low phase before smoothing | ~45% | Estimate |
| Checkpoint dip | Power during checkpoint pause | ~29% | Estimate |
| Smoothing credit | Fraction of training-step swing absorbed before the building sees it | 50% | Needs source / bound |

The prototype derives the smoothed GB300-like profile from a raw high/low profile and a smoothing
credit. That derivation matters because smoothing can change the result from FAIL to WARN/PASS at
large site scale.

The 50% smoothing credit is the most sensitive current assumption. It needs one of three outcomes:

- cited source that clearly applies to rack-level GB300/NVL72 power behavior;
- EE-derived physical bound, such as a conservative min/max range;
- downgrade to an explicit assumption, with the product showing best/worst-case verdict bands.

---

## Required EE Review

The EE review should answer whether the physical abstraction is credible and what data is required
to move from "modeled" to "vendor-verified" or "telemetry-calibrated."

### Outputs needed from EE

1. **Model adequacy assessment**
   - Is the high/low/checkpoint/smoothing abstraction sufficient for first-order facility
     transient screening?
   - What first-order effects are missing, if any?
   - Which omissions can change pass/fail?

2. **Chip power characterization path**
   - Can per-phase power amplitudes be derived from public/vendor specs, board/rack architecture,
     or component-level reasoning?
   - Which values require measurement?
   - Is single-node, tray-level, or rack-level measurement the minimum credible path?
   - Does scaling from one node or tray to a rack preserve the relevant behavior?

3. **Smoothing validation**
   - What is the physical mechanism being credited: rack energy storage, power shelves, firmware
     power shaping, BESS interaction, or something else?
   - What is a conservative lower bound for smoothing?
   - What is a plausible upper bound?
   - Is smoothing stable across workload type, firmware, rack configuration, and utilization?

4. **Electrical effects outside the current model**
   - Power factor and reactive power under fast load swings.
   - Inrush or recovery current after checkpoints.
   - Voltage sag and fault ride-through.
   - Harmonics / THD.
   - Protection coordination.
   - BESS response limits and control law.
   - Genset transient response beyond simple step-load tolerance.

5. **Cooling and mechanical transients**
   - CDU and pump response to fast IT load changes.
   - Thermal lag and control-loop stability.
   - Whether checkpoint and restart behavior can create cooling-side power spikes.
   - Which data should come from Vertiv or another cooling vendor.

6. **Calibration plan**
   - Minimum measurement set for a credible v1.
   - Data that can be produced internally.
   - Data that requires NVIDIA, Vertiv, an operator, or an ODM.
   - Cost, time, equipment, and access requirements.

### EE decision gate

The model is ready to advance if EE can provide:

- a bounded chip power profile for at least one shipping platform;
- a documented confidence level for each amplitude and smoothing value;
- a list of first-order missing effects, ranked by pass/fail impact;
- a measurement or partner plan for unresolved inputs.

If the answer is "measurement-only and we lack access," the next step is a partnership plan, not a
deeper internal simulator.

---

## Required Formal Review

The formal review should answer whether Meridian can move from "we simulated these scenarios" to
"no workload in this class violates the limits," with counterexamples when the claim is false.

### Current state

The current product has a bounded envelope check. It sweeps 96 timing combinations:

- synchronization: 25%, 50%, 75%, 100%;
- iteration period: 1 s, 3 s, 10 s, 30 s;
- checkpoint cadence: 5 min, 20 min;
- checkpoint length: 10 s, 20 s, 60 s.

It reports the worst case and the exact counterexample timing. This is useful, but it is not yet a
proof.

### Outputs needed from formal

1. **Formalizable model**
   - Identify state variables, inputs, bounds, and sampling assumptions.
   - Specify whether amplitudes are constants or intervals.
   - Specify the BESS control law and saturation behavior.
   - Specify mechanical/cooling lag dynamics.

2. **Property map**
   - Contracted peak <= limit.
   - Component loading <= continuous and short-time ratings.
   - Ramp rate <= utility threshold.
   - BESS power and energy stay within bounds.
   - Genset step <= islanded tolerance.
   - Oscillation band-power <= threshold.

3. **Proof strategy**
   - Which properties are monotone or analytically worst-caseable?
   - Which properties require SMT, reachability, interval analysis, or search?
   - Which properties should remain sampled in v1?
   - Is the oscillation screen tractable, or should it be handled as a bounded numerical check?

4. **Counterexample format**
   - The output must be understandable by product, EE, and customers.
   - A useful counterexample looks like: "75% synchronized, 1 s iteration, checkpoint every 20 min
     for 20 s exceeds contracted peak by 8 MW."
   - The counterexample should map to an action: derate IT, desynchronize jobs, increase BESS,
     change silicon, increase gensets, or renegotiate contract limits.

5. **Prototype scope**
   - One site.
   - One chip profile.
   - One or two properties first.
   - Bounded workload class.
   - Clear answer on whether a weeks-scale proof prototype is realistic.

### Formal decision gate

The formal layer is worth pursuing if the team can produce a prototype that proves at least a
subset of the checks over a bounded workload class and returns usable counterexamples.

A hybrid system is acceptable: prove the tractable checks and keep the oscillation screen as a
bounded sweep until the method is stronger. That is still materially stronger than a single
simulation trace.

---

## Defensibility Assessment

The UI and base transient simulator are not enough to be a moat. A competent power engineer,
equipment vendor, or MEP firm could reproduce a version of the model.

The defensibility, if real, comes from the combination of:

- calibrated chip and workload power traces;
- vendor-verified cooling and power equipment data;
- a formal envelope sign-off layer with counterexamples;
- the translation of those results into a repeatable off-taker spec sheet and engineering diligence
  package;
- Voltai's credibility in hardware verification and technical due diligence.

The key competitive question is whether NVIDIA, a hyperscaler, a cooling/electrical vendor, or a
large MEP firm could add this quickly once the need is obvious. If yes, Meridian's advantage must be
speed, workflow, neutrality, data access, and formal-methods depth rather than the simulator alone.

---

## Is The Problem Real?

The problem is credible if utility-facing reviewers, operators, or off-takers recognize these
failure modes:

- synchronized AI training creates large compute-to-communication power swings;
- checkpoints, startup, shutdown, and failed jobs create fast load steps;
- grid operators care about ramp, voltage/frequency disturbance, reactive behavior, harmonics, and
  oscillation;
- high-resolution AI workload power data is limited and often proprietary;
- off-takers may need workload constraints, derating rules, BESS requirements, or chip/platform
  choices written into commercial agreements.

Open market-validation questions:

- At what site scale does this become first-order: 10 MW, 50 MW, 200 MW, or 1 GW?
- Have AI/HPC loads actually been rejected, curtailed, derated, delayed, or redesigned because of
  transient behavior rather than headline MW?
- Do off-takers care enough to accept workload constraints in an LOI or lease?
- Is inference truly benign, or can prefill-heavy bursts, viral demand, and agentic workloads create
  similar problems?
- Which exact utility/interconnection studies would flag these issues, and what thresholds would
  they use?

---

## What Meridian Should Not Claim Yet

Until calibration and review are complete, Meridian should not claim:

- final utility capacity or interconnection availability;
- construction-ready electrical design;
- certified grid compliance;
- measured GB300 rack behavior;
- guaranteed smoothing without a source or bound;
- full proof over all possible workloads;
- investment-grade underwriting.

Current safe language:

> Meridian models workload-driven facility power transients using explicit assumptions and reports
> pass/warn/fail readiness against a reference electrical design.

Stronger language after calibration and formal work:

> Meridian verifies that a facility design survives a bounded class of AI workloads, or returns the
> workload pattern that breaks it.

---

## Suggested Review Agenda

### Session 1: EE / power systems, 60 minutes

1. Product boundary and current model: 10 min.
2. Chip power profile and smoothing assumption: 15 min.
3. Missing first-order electrical effects: 15 min.
4. Measurement and partner data plan: 15 min.
5. Decision summary: 5 min.

Expected output: a ranked list of model gaps, required measurements, and confidence bounds.

### Session 2: Formal methods, 60 minutes

1. Current checker and 96-scenario envelope sweep: 10 min.
2. State variables, bounds, and properties: 15 min.
3. Proof strategy by property: 20 min.
4. Prototype scope and counterexample format: 10 min.
5. Decision summary: 5 min.

Expected output: a proof feasibility assessment and a scoped prototype plan.

### Session 3: Product / go-to-market, 45 minutes

1. What can be claimed today: 10 min.
2. What becomes claimable after EE calibration: 10 min.
3. What becomes claimable after formal proof work: 10 min.
4. Buyer, deliverable, and wedge: 10 min.
5. Decision summary: 5 min.

Expected output: customer-safe positioning and the next proof point to build.

---

## External Background

- NVIDIA GB300 NVL72 is an official rack-scale, fully liquid-cooled 72-GPU / 36-Grace-CPU platform
  with 130 TB/s NVLink bandwidth and 37 TB fast memory. This supports the premise that AI hardware
  is now sold at rack scale, not just chip scale:
  https://www.nvidia.com/en-us/data-center/gb300-nvl72/
- NVIDIA DSX spans AI factory design, simulation, operations, power, cooling, and grid
  responsiveness. This validates the category and also creates a competitive threat:
  https://www.nvidia.com/en-us/data-center/products/dsx/
- Microsoft/NVIDIA, "Power Stabilization for AI Training Datacenters," describes synchronized AI
  training power swings and frequency content that can interact with utility critical frequencies:
  https://arxiv.org/abs/2508.14318
- "EasyRider" frames rack-level mitigation of AI training power transients as an active systems
  problem and highlights synchronization, startup/shutdown, and checkpointing:
  https://arxiv.org/abs/2604.15522
- The 2026 NLR measurement paper notes that high-resolution AI power data is largely proprietary
  and demonstrates 0.1-second H100 workload measurements for whole-facility planning:
  https://arxiv.org/abs/2604.07345

---

## Companion Docs

- `MERIDIAN_PRIMER.md` - first-principles explanation of training, inference, MFU, topology,
  supply/demand, and known gaps.
- `MERIDIAN_TEAM_DOC.md` - product brief and current prototype state.
- `MERIDIAN_PRODUCT_DIRECTION_REVIEW.md` - positioning, product boundary, and roadmap.
- `VERTIV_ASK.md` - draft cooling transient data request.
