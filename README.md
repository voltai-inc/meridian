# Voltai Meridian — AI Data Center Compute Readiness

**Simulation that stress-tests a facility against its AI workload — utilization at scale, power
transients, cooling — before it's built.** The industry designs facilities from static specs;
Meridian simulates what the workload does to the building. It sits one level up from Voltai's
existing verification stack: *prove the chip → navigate the system → stress-test the facility.*

**Utility study in → compute-ready spec out.** Meridian takes a utility study or broker power claim
and verifies what a site can actually carry: compute design per chip platform, workload-adjusted
performance, whether the electrical design survives the workload's power behavior, and a 2-page
off-taker spec sheet. Utility capacity is always an input — never a prediction.

Live: `meridian-web-swart.vercel.app` · Static HTML/JS, no backend, no build step.

## Pages

The dashboard presents the tools as a pipeline — **01 Find (Site Selection) → 02 Evaluate (Meridian) → 03 Procure (Procurement, in build)** — with Workload Power, Helio, Digital Twin, and Compliance as modules/reference behind the evaluation.

| Page | What it is |
|------|-----------|
| `index.html` | Dashboard — sidebar landing (main-platform style) with a Claude-powered chat, the pipeline row, and the modules grid |
| `site-selection.html` | **Site Selection** (pipeline step 01): map + tracker of candidate sites, synced from the team's site sheet (pipeline vs prospecting, approx-location flags); each site deep-links into Meridian with MW/location/utility/climate prefilled |
| `example-feasibility-study.html` | Printable illustrative utility feasibility study — the input document Meridian expects |
| `site-intelligence.html` | **Meridian** (pipeline step 02, the product): single Design workspace — per-chip power verdicts, inline workload power validation, envelope check, deliverables |
| `procurement.html` | **Procurement** (pipeline step 03, demo): receives Meridian's Build-tab BOM via URL hash, matches lines against a demo vendor library, drafts printable RFQs, tracks BOM → RFQ → quoted → PO. The production, library-data-backed version is a teammate's build; this page demos the seam |
| `power-signoff.html` | **Workload Power Validation** — the full bench behind Meridian's inline verdict, every design knob exposed; Meridian deep-links in prefilled |
| `helio.html` | **Helio** — the 2N reference architecture (10→100 MW pod block) whose scaled ratios Meridian validates against |
| `power-validation.js` | Shared DOM-free simulation engine (traces, chain loads, BESS, 19 checks) — used by both pages, unit-testable under node |

External: Digital Twin at `http://51.21.243.237:5173/` · Compliance Agent at `http://13.61.152.27/quick-check`. Procurement (BOM → RFQ → PO) is a placeholder in build.

## The model in one paragraph

Power simulation splits into three layers: **(1) utility capacity** — always an input;
**(2) the workload's power draw curve** — synthesized per workload type, shaped by a per-chip power
profile (GB300/Rubin on-board smoothing, cooling type); **(3) transient survivability** — that curve
simulated against the Helio 2N block scaled to the site: 19 pass/warn/fail checks (component 2N/N-1
loading, contracted peak, ramp, forced oscillation, islanded genset). The same workload inputs also
drive a separate **performance model** (MFU at scale, inference Pareto). The supply template is
sensitivity-tested and not load-bearing — the verdict is decided by the contract, BESS, gensets,
and the chip's demand shape.

## Docs

| Doc | Read it for |
|-----|------------|
| `MERIDIAN_PRIMER.md` | First-principles education: training vs inference, MFU, parallelism, topology, supply/demand, sensitivity results, hardware-team feasibility questions, known gaps |
| `MERIDIAN_TEAM_DOC.md` | Internal product brief: what it is, current state, what we still need, business context |
| `MERIDIAN_PRODUCT_DIRECTION_REVIEW.md` | Positioning: product boundary, recommended story, roadmap |
| `TEAM_BRIEF_POWER_MODEL.md` | One-page brief for the EE conversation (context, the measured finding, four questions) |
| `VERTIV_ASK.md` | Draft technical ask to Vertiv (cooling transient data) |
| `scripts_sensitivity_sweep.js` | Reproducible input-sensitivity sweep behind the team brief |

## Working on this repo

Everything is vanilla HTML/CSS/JS with the Voltai design system (light theme) vendored in `_ds/`.
`support.js` and `figures/` belong to `helio.html` (generated — do not hand-edit `support.js`).
Deploys to Vercel from `main` (static, `vercel.json`).
