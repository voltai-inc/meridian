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

| Page | What it is |
|------|-----------|
| `index.html` | Landing — the toolkit hub |
| `site-intelligence.html` | **Meridian** (the product): Screen → Design pipeline, per-chip power verdicts, inline workload power validation, deliverables |
| `power-signoff.html` | **Workload Power Validation** — the full bench behind Meridian's inline verdict, every design knob exposed; Meridian deep-links in prefilled |
| `helio.html` | **Helio** — the 2N reference architecture (10→100 MW pod block) whose scaled ratios Meridian validates against |
| `power-validation.js` | Shared DOM-free simulation engine (traces, chain loads, BESS, 19 checks) — used by both pages, unit-testable under node |

External: Digital Twin (separate app) at `http://51.21.243.237:5173/`.

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
| `VERTIV_ASK.md` | Draft technical ask to Vertiv (cooling transient data) |

## Working on this repo

Everything is vanilla HTML/CSS/JS with the Voltai design system (light theme) vendored in `_ds/`.
`support.js` and `figures/` belong to `helio.html` (generated — do not hand-edit `support.js`).
Deploys to Vercel from `main` (static, `vercel.json`).
