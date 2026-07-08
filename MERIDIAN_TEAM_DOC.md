# Meridian — Internal Product Brief
**VoltAI DC Intelligence · July 2026 · Confidential**

---

## What It Is

Meridian is a pre-build AI data center evaluation tool. You put in a site — address, confirmed grid MW, land, power architecture — and it tells you what you can actually build there, what it will actually perform like, and whether the economics work.

The emphasis on "actually" is the whole point. The market currently relies on nameplate specs: a chip does X TFLOPS, a rack draws Y kW, a site returns Z% IRR. None of these numbers reflect operational reality. xAI Colossus launched at ~20% MFU before months of optimization. Grok/Microsoft built a billion-dollar campus for the wrong GPU generation. These are not edge cases — they are the norm.

Meridian's job is to close that gap before you commit capital.

---

## The Problem It Solves

When a developer gets a site from a broker, they receive two numbers: megawatts available and square footage. Everything else — chip selection, cooling design, power quality, cluster efficiency, financial return — has to be figured out through months of engineering engagement (typically 4–6 months with a firm like ARUP for a reference design).

Meridian compresses that into minutes for the initial evaluation. Not to replace the engineering — that still has to happen — but to answer the first-order questions fast enough to decide whether a site is worth pursuing at all, and to walk into the engineering engagement with a clear specification rather than a blank slate.

The deliverable is a **Spec Sheet**: a structured pre-build summary that an off-taker can review for an LOI, that an engineering firm can use as a starting scope document, and that a financier can use to understand the project structure.

---

## Current State

The tool is a working prototype deployed at `meridian-web-swart.vercel.app`. It is a static web app — no backend, no database, runs entirely in the browser.

**What's modeled:**
- Site inputs auto-detect climate zone and grid operator from address
- PUE calculated from cooling approach, heat rejection type, and climate
- Chip selection across 9 platforms (GB300, GB200, B200, H200, H100, Vera Rubin, MI355X, MI300X, Gaudi 3), filtered by power architecture (480V AC vs 800V DC)
- MFU modeled from published benchmarks with communication overhead penalties for cluster scale, model size, parallelism strategy (TP/PP/DP/hybrid), and network topology
- 10-year financial model: full operator perspective (facility + GPU capex), GPU rental revenue, MFU-adjusted utilization
- Equipment BOM with lead times (transformers, CDUs, switchgear, UPS, generators)
- Multi-chip inference Pareto chart: tokens/sec/user vs tokens/sec/MW across all chips at equal power budget

**What is assumed (not measured):**
- MFU values come from published papers and analytical communication overhead models. They have not been validated against real cluster telemetry.
- Cooling performance (CDU capacity, trim cooler efficiency) uses Vertiv spec sheet steady-state values, not transient training load data.
- GPU rental rates are market estimates, not signed contracts.
- Power quality (THD, voltage sag, fault ride-through) is not modeled — entered as a headline MW only.

Every assumption is surfaced explicitly in the Data Gaps tab and flagged in the spec sheet output.

---

## Tabs

| Tab | What it does |
|-----|-------------|
| **Overview** | Site verdict (worth pursuing / conditional / more data needed), KPIs, revenue comparison across chips |
| **Compute** | Chip selection filtered by voltage architecture, cooling approach, CDU product, heat rejection, chip comparison table |
| **Workload** | Training/inference/mixed, model size, parallelism strategy, network topology, MFU vs cluster scale chart, multi-chip inference Pareto chart |
| **Financials** | 10-year P&L, NPV (full operator), IRR, Yr5 EBITDA |
| **Spec Sheet** | Printable pre-build summary: site, compute, power infrastructure, financial summary, BOM summary, open items checklist |
| **Data Gaps** | Explicit table of what's modeled vs. what requires real data; organized by Chip Team, Site, and Vertiv |

External links: **Power Sign-off** (transient simulation / pre-build electrical validation) and **Helio Reference Design** (visual model of the standard pod architecture).

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

It is a pre-qualification tool — a way to quickly determine whether a site is worth the 4-6 month engineering commitment, and to walk into that engagement with a clear brief rather than a cold RFP.

---

## Business Context

Voltai's role in the DC space is being tested and defined through this prototype. The relevant business models:
- **Tech Pack**: flat fee per analysis deliverable
- **Owner Rep**: % of gross lease value upfront (Chase's framing: developer who drives the build, captures % of the off-taker lease)
- **Developer of Record**: equity stake in the project

The Meridian tool currently models all three in the financial outputs. The spec sheet is the artifact that makes the owner rep and tech pack models work commercially — it's the deliverable you hand to an off-taker or engineering firm.

---

## Immediate Next Steps

1. Get chip team to review MFU assumptions — even a ballpark validation ("our GB300 clusters run 50–55% MFU") would let us label the number as verified
2. Send Vertiv technical ask (see separate document)
3. Use on a real live site — run Meridian against the Louisiana site or the Alberta site from Brian's list, generate the spec sheet, and see if it's useful for the off-taker conversation
4. Decide if the financial model should offer a "developer perspective" toggle (facility only, lease revenue) vs the current "operator perspective" (full capex, GPU rental revenue)
