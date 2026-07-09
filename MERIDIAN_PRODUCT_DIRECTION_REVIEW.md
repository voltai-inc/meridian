# Meridian Product Direction Review
**Draft for internal review · July 2026**

---

## One-Sentence Product Definition

Meridian is a pre-engineering data center intelligence tool that takes a utility study or site power claim as input and translates it into a compute-ready AI data center specification: chip/rack configuration, cooling and electrical readiness, workload performance expectations, build risks, and an off-taker-facing spec sheet.

The important boundary: Meridian does **not** replace the utility study. It starts where the utility study or broker claim ends.

---

## The Recommended Product Boundary

### Inputs Meridian Should Accept

- Confirmed or claimed site power: MW, voltage, service type, power factor, upgrade scope, timeline
- Site context: climate, land, grid operator or utility, brownfield constraints
- Target workload: training, inference, mixed, model size, batch/concurrency target
- Candidate compute platform: GB300, GB200, B200, H200, MI355X, MI300X, Gaudi, roadmap platforms
- Optional engineering data: power quality report, CDU curves, load profiles, rack power architecture

### What Meridian Should Model

- Usable IT load after PUE and climate assumptions
- Rack and GPU count by chip architecture
- Cooling architecture fit and density implications
- Rack power architecture fit: 480V AC, 415V AC, 800V DC
- DSX-style readiness checks and open items
- Modeled MFU / sustained performance at site scale
- Inference tradeoffs: per-user speed vs. per-MW efficiency
- Equipment BOM, lead times, and critical path
- Workload-driven electrical transients, once connected to Workload Power Validation
- Off-taker spec sheet and internal advisory report

### What Meridian Should Not Claim To Model

- Proprietary utility capacity or interconnection availability
- Transmission queue position
- Final substation or interconnection design
- Construction-ready MEP drawings
- Investment-grade underwriting
- Signed GPU rental demand or off-taker credit quality

The utility side of "power modeling" should remain an input. Meridian can model the data center side of power: how AI workloads behave once the MW is available.

---

## What Exists In The Prototype Today

### 1. Meridian / Compute Readiness

Current role: the main product wedge.

What it does today:

- Screen mode: turns broker/site claims into an unverified site brief.
- Design mode: takes confirmed study-style inputs and calculates IT load, GPU/rack count, MFU, PUE, economics, DSX checks, BOM, critical path, and deliverables.
- Generates two outputs: an off-taker spec sheet and an internal advisory report.

Current limitation:

- The interaction is mostly a chip/rack comparison surface.
- MFU is modeled with simple heuristics, not calibrated telemetry.
- Economics are useful for internal sensitivity, but they can distract from the stronger product story.

Recommended positioning:

Meridian should be presented as the product. The chip selector is not the product; it is the control surface for the broader question:

> Given this site and this target workload, what AI data center design is credible enough to take into LOI, engineering diligence, or off-taker review?

### 2. Workload Power Validation

Current role: separate prototype, not fully integrated into Meridian.

What it does today:

- Simulates AI workload power traces.
- Tests facility electrical design against transients: checkpoint spikes, idle-to-peak ramps, oscillation, BESS smoothing, UPS capacity, genset step tolerance, and N+1 component loading.
- Outputs pass / warn / fail checks.

Recommended positioning:

Workload Power Validation is not utility modeling. It is **workload power transient validation**.

Long-term role:

Workload Power Validation should become a validation module inside Meridian. Meridian chooses or evaluates a compute design; Workload Power Validation checks whether that design's workload power behavior is electrically survivable.

### 3. Helio Reference Design

Current role: visual reference architecture.

What it does today:

- Shows a standardized 10 MW to 100 MW AI data center block.
- Compares Blackwell AC and Rubin 800V DC platform assumptions.
- Visualizes electrical, cooling, network, facility, and performance layers.

Recommended positioning:

Helio should be the reference architecture behind Meridian's recommendations, not a separate product wedge. When Meridian says "this site supports X racks of Y chip," Helio explains what the standard block looks like.

### 4. Digital Twin

Current role: external demo link.

Recommended positioning:

Keep it as a later-stage visualization. It should not carry the core product claim until it is integrated with the same data model as Meridian.

---

## Recommended Product Story

Voltai's existing capability is not "data center real estate." It is translating complex hardware artifacts into verified, decision-ready intelligence.

Existing Voltai story:

- Component intelligence
- Schematic review
- BOM and lifecycle reasoning
- System power modeling at the hardware design level
- Design-rule generation and validation
- Pre-silicon / formal verification lineage
- Verified, cited technical answers from source documents

Meridian extension:

> Voltai started at silicon and board-level truth. Meridian moves one layer up: rack, workload, and data center compute readiness.

This is a credible expansion because AI data centers are increasingly constrained by the same things Voltai already understands:

- chip generation and platform architecture
- rack power density
- cooling method
- workload behavior
- performance vs. nameplate gaps
- BOM and critical path
- technical due diligence artifacts

The narrative should not be:

> "Voltai is becoming a data center developer."

The better narrative is:

> "Voltai is building the intelligence layer for AI infrastructure decisions, from chip-level verification up to data center-scale compute design."

---

## Recommended Demo Flow

### Stage 1: Site Claim Or Utility Study

User starts with either:

- a broker claim, labeled unverified, or
- a utility study, labeled study-verified.

The product should make the confidence level unavoidable.

### Stage 2: Compute-Ready Design

The user selects workload goals and candidate silicon. Meridian outputs:

- usable IT MW
- rack count
- GPU count
- platform architecture
- cooling fit
- workload-adjusted performance
- DSX / readiness checks
- open items

The main interaction should not feel like "chip shopping." It should feel like evaluating whether the site can support a specific AI infrastructure promise.

### Stage 3: Workload + Power Readiness

For a selected design, Meridian should show:

- expected MFU range
- training vs inference behavior
- checkpoint / ramp transient profile
- BESS / UPS / genset implications
- cooling transient open items

This is where Workload Power Validation belongs.

### Stage 4: Deliverable

The commercial output should be a 2-page off-taker spec sheet:

- confirmed power and confidence label
- compute platform
- IT load and PUE
- rack/GPU count
- workload performance range
- cooling and rack power architecture
- first training run timeline
- critical path
- open items before LOI

Financials should be in an internal advisory report or appendix, not the off-taker-facing hero deliverable.

---

## Power Modeling: Recommended Language

Avoid broad language like:

> Meridian does power modeling.

Use more precise language:

> Meridian uses utility study outputs as inputs, then models facility-side power implications for AI workloads: IT load, rack power density, PUE, interruptible-service backup requirements, and transient electrical readiness.

If asked directly:

- Utility power availability: input, not modeled by Voltai.
- Facility power sizing: partially modeled today.
- AI workload power transients: prototype exists in Workload Power Validation.
- Full calibrated power simulation: roadmap item, depends on chip telemetry and vendor data.

---

## Workload Simulation: Current State And Roadmap

### Current State

Meridian currently has a thin workload model:

- workload mode: training, inference, mixed
- model size selector
- batch size selector
- MFU heuristic by chip and cluster scale
- inference Pareto chart
- time-to-first-training-run estimate

This is useful for a prototype, but it should not yet be sold as a full workload simulator.

### What Would Make It Real

Near-term improvements:

- Convert off-taker requirements into workload profiles: model size, SLA, tokens/sec, batch, concurrency, training cadence
- Model network overhead explicitly: topology, all-reduce, scale-up vs scale-out domains
- Generate workload power traces from training and inference phases
- Connect those traces to Workload Power Validation
- Calibrate MFU assumptions with real cluster telemetry
- Add confidence bands instead of single-point MFU estimates

Longer-term improvements:

- Ingest Chakra / execution-trace style workload descriptions
- Compare topology alternatives, not just chip alternatives
- Simulate failure modes: node loss, switch loss, job restart, degraded operation
- Add post-deployment telemetry loop to improve pre-build predictions

Recommended claim today:

> Meridian includes workload-aware compute modeling.

Recommended claim after calibration:

> Meridian simulates AI workload performance and power behavior before build.

---

## Financial Model: Recommended Treatment

Current economics are useful, but they should be demoted.

Keep:

- GPU rate sensitivity
- capex estimate
- revenue sensitivity
- operator vs developer perspective
- internal advisory report

Remove or deemphasize from the off-taker-facing deliverable:

- NPV as a hero metric
- IRR as a hero metric
- EBITDA multiple
- asset value

Reason:

The strongest product claim is technical credibility. Financial assumptions can make the tool feel speculative if they sit at the same level as rack count, cooling fit, and workload readiness.

Recommended framing:

> Financial outputs are scenario sensitivities, not underwriting.

---

## Suggested Product Architecture

### Meridian Core

The core engine:

- site facts
- power-study inputs
- chip database
- workload model
- rack/cooling/power architecture assumptions
- readiness checks
- spec-sheet generator

### Validation Modules

- Workload Power Validation: workload power transient validation
- Helio: reference architecture / basis of design
- Future network simulation: workload communication readiness
- Future telemetry calibration: measured MFU and power trace feedback

### Deliverables

- Off-taker spec sheet
- Internal advisory report
- Engineering RFP/RFQ brief
- Open-items checklist

---

## Suggested Product Roadmap

### Now

Goal: make the current prototype easier to understand and harder to overclaim.

- Explain Workload Power Validation as facility-side transient validation, not utility modeling.
- Reframe chip cards as "design alternatives," not chip shopping.
- Demote NPV/IRR from the main story.
- Make utility-study input boundary explicit.
- Show confidence levels: broker-claimed, study-verified, vendor-verified, telemetry-calibrated.

### Next

Goal: make Meridian feel like more than a calculator.

- Add off-taker workload profile input.
- Make the deliverable drive the workflow.
- Add confidence bands for MFU and PUE.
- Connect selected design to Workload Power Validation.
- Add "why this matters" deltas: wrong chip, wrong cooling, wrong service type, wrong SLA.

### Later

Goal: turn modeled assumptions into verified intelligence.

- Calibrate MFU with chip-team or partner telemetry.
- Get Vertiv / cooling vendor transient curves.
- Add measured power traces.
- Add network/topology simulation.
- Create repeatable brownfield site evaluation package.

---

## Open Questions For The Team

1. Is the primary buyer a developer, off-taker, financier, engineering firm, or Voltai internal BD?
2. Is the first paid deliverable a tech pack, owner-rep package, or internal site-screening report?
3. Should the off-taker spec sheet include financials at all?
4. Which proof point is easiest to validate first: MFU, cooling transient behavior, or power transient behavior?
5. Should Workload Power Validation be integrated into Meridian now, or kept as a separate technical appendix until it is stronger?
6. Does Voltai want to explicitly support non-NVIDIA platforms, or lead with NVIDIA/DSX credibility first?

---

## Recommended Positioning Summary

Meridian should be positioned as:

> A pre-engineering intelligence layer for AI data center compute readiness.

It should not be positioned as:

> A utility power model, construction design tool, or investment underwriting platform.

The best product wedge is:

> Utility study in. Workload-ready compute spec out.

The strongest expansion story for Voltai is:

> From silicon-level verification to system-level hardware intelligence to data center-scale compute readiness.
